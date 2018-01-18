var async = require('async')
var weightSort = require('weight-sort')
var BoundingBox = require('boundingbox')

var httpLoad = require('./httpLoad')
var removeNullEntries = require('./removeNullEntries')

var OverpassObject = require('./OverpassObject')
var OverpassNode = require('./OverpassNode')
var OverpassWay = require('./OverpassWay')
var OverpassRelation = require('./OverpassRelation')
var RequestGet = require('./RequestGet')
var RequestBBox = require('./RequestBBox')
var defines = require('./defines')

function OverpassFrontend (url, options) {
  this.url = url
  this.options = {
    effortPerRequest: 1000,
    effortNode: 1,
    effortWay: 4,
    effortRelation: 64,
    timeGap: 10
  }
  for (var k in options) {
    this.options[k] = options[k]
  }

  this.overpassElements = {}
  this.overpassElements_member_of = {}
  this.overpassTiles = {}
  this.overpassRequests = []
  this.overpassRequestActive = false
  this.overpassBBoxQueryElements = {}
  this.overpassBBoxQueryRequested = {}
  this.overpassBBoxQueryLastUpdated = {}
  this.errorCount = 0
}

for (var k in defines) {
  OverpassFrontend[k] = defines[k]
}

/**
 * @param {string|string[]} ids - Id or array of Ids of OSM map features
 * @param {object} options
 * @param {number} [options.priority=0] - Priority for loading these objects. The lower the sooner they will be requested.
 * @param {boolean} [options.sort=false] - When set to true, the function featureCallback will be called in some particular order
 * @param {function} featureCallback Will be called for each object in the order of the IDs in parameter 'ids'. Will be passed: 1. err (if an error occured, otherwise null), 2. the object or null.
 * @param {function} finalCallback Will be called after the last feature. Will be passed: 1. err (if an error occured, otherwise null).
 */
OverpassFrontend.prototype.get = function (ids, options, featureCallback, finalCallback) {
  var request = new RequestGet(this, {
    ids: ids,
    options: options,
    featureCallback: featureCallback,
    finalCallback: finalCallback
  })

  this.overpassRequests.push(request)

  this._next()

  return request
}

OverpassFrontend.prototype._overpassProcess = function () {
  // currently active - we'll come back later :-)
  if (this.overpassRequestActive) {
    return
  }

  // preprocess all requests
  // e.g. call featureCallback for elements which were received in the
  // meantime
  this.overpassRequests.forEach(request => {
    if (request) {
      request.preprocess()
    }
  })
  this.overpassRequests = removeNullEntries(this.overpassRequests)

  // nothing todo ...
  if (!this.overpassRequests.length) {
    return
  }

  // now order all requests by priority
  this.overpassRequests = weightSort(this.overpassRequests, 'priority')

  this.overpassRequestActive = true
  var request
  var j

  if (this.overpassRequests[0].type === 'BBoxQuery') {
    request = this.overpassRequests[0]
    return this._processBBoxQuery(request)
  }

  var context = {
    todo: {},
    subRequests: [],
    query: '',
    maxEffort: this.options.effortPerRequest
  }

  for (j = 0; j < this.overpassRequests.length; j++) {
    request = this.overpassRequests[j]

    if (request.type !== 'get') {
      continue
    }

    var subRequest = request.compileQuery(context)

    if (subRequest) {
      context.subRequests.push(subRequest)

      if (context.query !== '') {
        context.query += '\nout count;\n'
      }

      context.maxEffort -= subRequest.effort
      context.query += subRequest.query
    }

    if (context.maxEffort < 0) {
      break
    }
  }

  if (context.query === '') {
    return this._next()
  }

  setTimeout(function () {
    httpLoad(
      this.url,
      null,
      '[out:json];\n' + context.query,
      this._handleResult.bind(this, context)
    )
  }.bind(this), this.options.timeGap)
}

OverpassFrontend.prototype._handleResult = function (context, err, results) {
  if (!err && results.remark) {
    err = results.remark
  }

  if (err) {
    this.errorCount++
    this.overpassRequestActive = false

    if (this.errorCount <= 3) {
      // retry
      this._overpassProcess()
    } else {
      // abort
      // call finalCallback for the request
      context.subRequests.forEach(function (subRequest) {
        subRequest.request.finish(err)
      })
    }

    return
  } else {
    this.errorCount = 0
  }

  var subRequestsIndex = 0
  var partIndex = 0
  var subRequest = context.subRequests[0]
  var request = subRequest.request
  var part = subRequest.parts[0]

  for (var i = 0; i < results.elements.length; i++) {
    var el = results.elements[i]

    if (isSeparator(el)) {
      partIndex++

      if (partIndex >= subRequest.parts.length) {
        request.finishSubRequest(subRequest)

        subRequestsIndex++
        partIndex = 0
        subRequest = context.subRequests[subRequestsIndex]
        request = subRequest.request
        part = subRequest.parts[0]
      } else {
        part = subRequest.parts[partIndex]
      }

      continue
    }

    var ob = this.createOrUpdateOSMObject(el, part)

    var members = this.overpassElements[ob.id].member_ids()
    if (members) {
      for (var j = 0; j < members.length; j++) {
        if (!(members[j] in this.overpassElements_member_of)) {
          this.overpassElements_member_of[members[j]] = [ this.overpassElements[ob.id] ]
        } else {
          this.overpassElements_member_of[members[j]].push(this.overpassElements[ob.id])
        }
      }
    }

    request.receiveObject(ob, subRequest, partIndex)
  }

  for (var id in context.todo) {
    if (!(id in this.overpassElements)) {
      this.overpassElements[id] = null
    }
  }

  request.finishSubRequest(subRequest)

  this._next()
}

/**
 * @param {string} query - Query for requesting objects from Overpass API, e.g. "node[amenity=restaurant]"
 * @param {L.latLngBounds} bounds - A Leaflet Bounds object, e.g. from map.getBounds()
 * @param {object} options
 * @param {number} [options.priority=0] - Priority for loading these objects. The lower the sooner they will be requested.
 * @param {boolean} [options.sort=false] - When set to true, the function featureCallback will be called in some particular order
 * @param {function} featureCallback Will be called for each object in the order of the IDs in parameter 'ids'. Will be passed: 1. err (if an error occured, otherwise null), 2. the object or null.
 * @param {function} finalCallback Will be called after the last feature. Will be passed: 1. err (if an error occured, otherwise null).
 */
OverpassFrontend.prototype.BBoxQuery = function (query, bounds, options, featureCallback, finalCallback) {
  bounds = new BoundingBox(bounds)

  var request = new RequestBBox(this, {
    query: query,
    bounds: bounds,
    remainingBounds: bounds,
    options: options,
    doneFeatures: {},
    featureCallback: featureCallback,
    finalCallback: finalCallback
  })

  this.overpassRequests.push(request)

  this._next()

  return request
}

OverpassFrontend.prototype._processBBoxQuery = function (request) {
  request.callCount++

  var subRequests = [ request.compileQuery() ]

  this._sendBBoxQueryRequests(subRequests)
}

OverpassFrontend.prototype._sendBBoxQueryRequests = function (subRequests) {
  var context = {
    todo: {},
    subRequests: subRequests,
    query: '',
    maxEffort: this.options.effortPerRequest
  }

  for (var i = 0; i < subRequests.length; i++) {
    if (i !== 0) {
      context.query += '\nout count;\n'
    }

    context.query += subRequests[i].query
  }

  setTimeout(function () {
    httpLoad(
      this.url,
      null,
      context.query,
      this._handleResult.bind(this, context)
    )
  }.bind(this), this.options.timeGap)
}

OverpassFrontend.prototype.clearBBoxQuery = function (query) {
  delete this.overpassBBoxQueryElements[query]
  delete this.overpassBBoxQueryRequested[query]
  delete this.overpassBBoxQueryLastUpdated[query]
}

OverpassFrontend.prototype._abortRequest = function (request) {
  var p = this.overpassRequests.indexOf(request)

  if (p === -1) {
    return
  }

  this.overpassRequests[p] = null
}

OverpassFrontend.prototype._finishRequest = function (request) {
  this.overpassRequests[this.overpassRequests.indexOf(request)] = null
}

OverpassFrontend.prototype._next = function () {
  this.overpassRequestActive = false

  async.setImmediate(function () {
    this._overpassProcess()
  }.bind(this))
}

OverpassFrontend.prototype.abortAllRequests = function () {
  for (var j = 0; j < this.overpassRequests.length; j++) {
    if (this.overpassRequests[j] === null) {
      continue
    }

    this.overpassRequests[j].finalCallback('abort')
  }

  this.overpassRequests = []
}

OverpassFrontend.prototype.removeFromCache = function (ids) {
  if (typeof ids === 'string') {
    ids = [ ids ]
  }

  for (var i = 0; i < ids.length; i++) {
    delete this.overpassElements[ids[i]]
  }
}

OverpassFrontend.prototype.createOrUpdateOSMObject = function (el, options) {
  var id = el.type.substr(0, 1) + el.id
  var ob = null

  if (id in this.overpassElements) {
    ob = this.overpassElements[id]
  } else if (el.type === 'relation') {
    ob = new OverpassRelation(id)
  } else if (el.type === 'way') {
    ob = new OverpassWay(id)
  } else if (el.type === 'node') {
    ob = new OverpassNode(id)
  } else {
    ob = new OverpassObject(id)
  }

  ob.updateData(el, options)

  this.overpassElements[id] = ob
  return ob
}

OverpassFrontend.prototype.regexpEscape = function (str) {
  return str.replace('\\', '\\\\')
       .replace('.', '\\.')
       .replace('|', '\\|')
       .replace('[', '\\[')
       .replace(']', '\\]')
       .replace('(', '\\(')
       .replace(')', '\\)')
       .replace('{', '\\{')
       .replace('}', '\\}')
       .replace('?', '\\?')
       .replace('+', '\\+')
       .replace('*', '\\*')
       .replace('^', '\\^')
       .replace('$', '\\$')
}

function isSeparator (el) {
  return ('count' in el || ('type' in el && el.type === 'count'))
}

module.exports = OverpassFrontend
