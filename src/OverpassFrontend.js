var async = require('async')
var weightSort = require('weight-sort')
var BoundingBox = require('boundingbox')

var httpLoad = require('./httpLoad')
var removeNullEntries = require('./removeNullEntries')
var SortedCallbacks = require('./SortedCallbacks')

var OverpassObject = require('./OverpassObject')
var OverpassNode = require('./OverpassNode')
var OverpassWay = require('./OverpassWay')
var OverpassRelation = require('./OverpassRelation')
var RequestGet = require('./RequestGet')
var RequestBBox = require('./RequestBBox')
var defines = require('./defines')
const overpassOutOptions = require('./overpassOutOptions')

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

OverpassFrontend.prototype.get = function (ids, options, featureCallback, finalCallback) {
  if (typeof ids === 'string') {
    ids = [ ids ]
  }
  if (options === null) {
    options = {}
  }
  if (typeof options.properties === 'undefined') {
    options.properties = OverpassFrontend.DEFAULT
  }

  for (var i = 0; i < ids.length; i++) {
    if (ids[i] in this.overpassElements && this.overpassElements[ids[i]] === false) {
      delete this.overpassElements[ids[i]]
    }
  }

  if (options.bbox) {
    options.bbox = new BoundingBox(options.bbox)
  }
  // option 'split' not available for get requests -> use effort instead
  delete options.split

  var request = new RequestGet(this, {
    ids: ids.concat([]),
    options: options,
    priority: 'priority' in options ? options.priority : 0,
    featureCallback: featureCallback,
    finalCallback: finalCallback
  })

  var callbacks = new SortedCallbacks(request.options, request.featureCallback, request.finalCallback)
  request.featureCallback = callbacks.next.bind(callbacks)
  request.finalCallback = callbacks.final.bind(callbacks)

  this.overpassRequests.push(request)

  async.setImmediate(function () {
    this._overpassProcess()
  }.bind(this))

  return request
}

OverpassFrontend.prototype._overpassProcess = function () {
  if (this.overpassRequestActive) {
    return
  }

  this.overpassRequests = removeNullEntries(this.overpassRequests)
  this.overpassRequests = weightSort(this.overpassRequests, 'priority')

  if (!this.overpassRequests.length) {
    return
  }

  this.overpassRequestActive = true
  var effort = 0
  var context = {
    todo: {},
    requests: []
  }
  var query = ''
  var request
  var currentRequest
  var j

  for (j = 0; j < this.overpassRequests.length; j++) {
    request = this.overpassRequests[j]

    if (request.type === 'BBoxQuery') {
      // e.g. call featureCallback for elements which were received in the
      // meantime
      request.preprocess()
    }
  }

  if (this.overpassRequests[0].type === 'BBoxQuery') {
    request = this.overpassRequests[0]
    return this._processBBoxQuery(request)
  }

  for (j = 0; j < this.overpassRequests.length; j++) {
    request = this.overpassRequests[j]

    if (request.type !== 'get') {
      continue
    }

    var ids = request.ids
    var allFoundUntilNow = true
    var nodeQuery = ''
    var wayQuery = ''
    var relationQuery = ''
    var BBoxQuery = ''

    if (request.options.bbox) {
      BBoxQuery = '(' + request.options.bbox.toLatLonString() + ')'
    }

    if (!ids) {
      ids = []
    }

    for (var i = 0; i < ids.length; i++) {
      if (ids[i] === null) {
        continue
      }

      if (ids[i] in this.overpassElements) {
        var ob = this.overpassElements[ids[i]]
        var ready = true

        // Feature does not exists!
        if (ob === null) {
          request.featureCallback(null, null, i)
          request.ids[i] = null
          continue
        }

        // for bbox option, if object is (partly) loaded, but outside call
        // featureCallback with 'false'
        if (request.options.bbox && !ob.intersects(request.options.bbox)) {
          request.featureCallback(null, false, i)
          request.ids[i] = null
          continue
        }

        // not fully loaded
        if ((ob !== false && ob !== null) && (request.options.properties & ob.properties) !== request.options.properties) {
          ready = false
        }

        // if sort is set in options maybe defer calling featureCallback
        if (ready) {
          request.featureCallback(null, ob, i)
          request.ids[i] = null
          continue
        }
      } else {
        // Illegal ID
        if (ids[i] !== null && !ids[i].match(/^[nwr][0-9]+$/)) {
          request.featureCallback(null, null, i)
          request.ids[i] = null
          continue
        }
      }

      allFoundUntilNow = false
      if (ids[i] in context.todo) {
        continue
      }

      // too much data - delay for next iteration
      if (effort >= this.options.effortPerRequest) {
        continue
      }

      if (request.options.bbox) {
        // check if we already know the bbox of the element; if yes, don't try
        // to load object if it does not intersect bounds
        if (ids[i] in this.overpassElements && (this.overpassElements[ids[i]].properties & OverpassFrontend.BBOX)) {
          if (!this.overpassElements[ids[i]].intersects(request.options.bbox)) {
            continue
          }
        }

        context.todo[ids[i]] = true
        request.bboxSeenSeparator = false
      } else {
        context.todo[ids[i]] = true
      }

      if (currentRequest !== request) {
        if (currentRequest) {
          // add separator to distinguish requests
          query += 'out count;\n'
        }

        currentRequest = request
        context.requests.push(request)
      }

      switch (ids[i].substr(0, 1)) {
        case 'n':
          nodeQuery += 'node(' + ids[i].substr(1) + ');\n'
          effort += this.options.effortNode
          break
        case 'w':
          wayQuery += 'way(' + ids[i].substr(1) + ');\n'
          effort += this.options.effortWay
          break
        case 'r':
          relationQuery += 'relation(' + ids[i].substr(1) + ');\n'
          effort += this.options.effortRelation
          break
      }
    }

    if (allFoundUntilNow) {
      request.finalCallback(null)
      this.overpassRequests[j] = null
    }

    var outOptions = overpassOutOptions(request.options)

    if (nodeQuery !== '') {
      query += '((' + nodeQuery + ');)->.n;\n'
      if (BBoxQuery) {
        query += '(node.n; - node.n' + BBoxQuery + '->.n;);\nout ids bb qt;\n'
      }
    }

    if (wayQuery !== '') {
      query += '((' + wayQuery + ');)->.w;\n'
      if (BBoxQuery) {
        query += '(way.w; - way.w' + BBoxQuery + '->.w;);\nout ids bb qt;\n'
      }
    }

    if (relationQuery !== '') {
      query += '((' + relationQuery + ');)->.r;\n'
      if (BBoxQuery) {
        query += '(relation.r; - relation.r' + BBoxQuery + '->.r;);\nout ids bb qt;\n'
      }
    }

    if (BBoxQuery && (nodeQuery !== '' || wayQuery !== '' || relationQuery !== '')) {
      // additional separator to separate objects outside bbox from inside bbox
      query += 'out count;\n'
    }
    if (nodeQuery !== '') {
      query += '.n out ' + outOptions + ';\n'
    }
    if (wayQuery !== '') {
      query += '.w out ' + outOptions + ';\n'
    }
    if (relationQuery !== '') {
      query += '.r out ' + outOptions + ';\n'
    }
  }

  if (query === '') {
    this.overpassRequestActive = false
    async.setImmediate(function () {
      this._overpassProcess()
    }.bind(this))

    return
  }

  setTimeout(function () {
    httpLoad(
      this.url,
      null,
      '[out:json];\n' + query,
      this._handleGetResult.bind(this, context)
    )
  }.bind(this), this.options.timeGap)
}

OverpassFrontend.prototype._handleGetResult = function (context, err, results) {
  var el
  var id
  var request
  var i

  if (!err && results.remark) {
    err = results.remark
  }

  if (err) {
    var done = []

    this.errorCount++
    this.overpassRequestActive = false

    if (this.errorCount <= 3) {
      // retry
      this._overpassProcess()
    } else {
      // abort
      for (i = 0; i < context.requests.length; i++) {
        request = context.requests[i]

        if (done.indexOf(request) === -1) {
          // call finalCallback for the request
          request.finalCallback(err)
          // remove current request
          this.overpassRequests[this.overpassRequests.indexOf(request)] = null
          // we already handled this request
          done.push(request)
        }
      }
    }

    return
  } else {
    this.errorCount = 0
  }

  request = context.requests.shift()

  for (i = 0; i < results.elements.length; i++) {
    el = results.elements[i]

    if (isSeparator(el)) {
      // separator found
      if (request.options.bbox && !request.bboxSeenSeparator) {
        request.bboxSeenSeparator = true
      } else {
        request = context.requests.shift()
      }
      continue
    } else {
      id = el.type.substr(0, 1) + el.id
    }

    // bounding box only result -> save to overpassElements with bounds only
    if (request.options.bbox) {
      if (!request.bboxSeenSeparator) {
        var options = {
          properties: OverpassFrontend.BBOX,
          bbox: request.options.bbox,
          bboxNoMatch: true
        }

        this.createOrUpdateOSMObject(el, options)

        continue
      }
    }

    this.createOrUpdateOSMObject(el, request.options)

    var members = this.overpassElements[id].member_ids()
    if (members) {
      for (var j = 0; j < members.length; j++) {
        if (!(members[j] in this.overpassElements_member_of)) {
          this.overpassElements_member_of[members[j]] = [ this.overpassElements[id] ]
        } else {
          this.overpassElements_member_of[members[j]].push(this.overpassElements[id])
        }
      }
    }
  }

  for (id in context.todo) {
    if (!(id in this.overpassElements)) {
      this.overpassElements[id] = null
    }
  }

  this.overpassRequestActive = false

  async.setImmediate(function () {
    this._overpassProcess()
  }.bind(this))
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

  if (!request.needLoad()) {
    request.finish()
    return this._next()
  }

  var subRequests = [ request.compileQuery() ]

  this._sendBBoxQueryRequests(subRequests)
}

OverpassFrontend.prototype._sendBBoxQueryRequests = function (subRequests) {
  var query = ''

  for (var i = 0; i < subRequests.length; i++) {
    if (i !== 0) {
      query += '\nout count;\n'
    }

    query += subRequests[i].query
  }

  setTimeout(function () {
    httpLoad(
      this.url,
      null,
      query,
      this._handleBBoxQueryResult.bind(this, subRequests)
    )
  }.bind(this), this.options.timeGap)
}

OverpassFrontend.prototype._handleBBoxQueryResult = function (subRequests, err, results) {
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
      subRequests.forEach(function (subRequest) {
        subRequest.request.finish(err)
      })
    }

    return
  } else {
    this.errorCount = 0
  }

  var subRequestsIndex = 0
  var partIndex = 0
  var subRequest = subRequests[0]
  var request = subRequest.request
  var part = subRequest.parts[0]

  for (var i = 0; i < results.elements.length; i++) {
    var el = results.elements[i]

    if (isSeparator(el)) {
      partIndex++

      if (partIndex >= subRequests[subRequestsIndex].part.length) {
        request.finishSubRequest(subRequest)

        subRequestsIndex++
        partIndex = 0
        subRequest = subRequests[subRequestsIndex]
        request = subRequest.request
        part = subRequest.part[0]
      } else {
        part = subRequest.part[partIndex]
      }

      continue
    }

    var ob = this.createOrUpdateOSMObject(el, part)

    request.receiveObject(ob, subRequests[subRequestsIndex], partIndex)
  }

  request.finishSubRequest(subRequest)

  this._next()
}

OverpassFrontend.prototype.clearBBoxQuery = function (query) {
  delete this.overpassBBoxQueryElements[query]
  delete this.overpassBBoxQueryRequested[query]
  delete this.overpassBBoxQueryLastUpdated[query]
}

OverpassFrontend.prototype.abortRequest = function (request) {
  var p = this.overpassRequests.indexOf(request)

  if (p === -1) {
    return
  }

  request.aborted = true
  request.finalCallback('abort')
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
