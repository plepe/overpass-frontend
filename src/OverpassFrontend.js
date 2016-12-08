var async = require('async')
var weightSort = require('weight-sort')
var BoundingBox = require('boundingbox')
var Quadtree = require('quadtree-lookup')
var turf = {
  difference: require('turf-difference'),
  union: require('turf-union')
}

var httpLoad = require('./httpLoad')
var removeNullEntries = require('./removeNullEntries')
var SortedCallbacks = require('./SortedCallbacks')

var OverpassObject = require('./OverpassObject')
var OverpassNode = require('./OverpassNode')
var OverpassWay = require('./OverpassWay')
var OverpassRelation = require('./OverpassRelation')
var OverpassRequest = require('./OverpassRequest')
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

  var request = new OverpassRequest(this, {
    type: 'get',
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
      this._preprocessBBoxQuery(request)
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
        query += '(node.n; - node.n' + BBoxQuery + '->.n);\nout ids bb qt;\n'
      }
    }

    if (wayQuery !== '') {
      query += '((' + wayQuery + ');)->.w;\n'
      if (BBoxQuery) {
        query += '(way.w; - way.w' + BBoxQuery + '->.w);\nout ids bb qt;\n'
      }
    }

    if (relationQuery !== '') {
      query += '((' + relationQuery + ');)->.r;\n'
      if (BBoxQuery) {
        query += '(relation.r; - relation.r' + BBoxQuery + '->.r);\nout ids bb qt;\n'
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

  if (err) {
    var done = []

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

    this.overpassRequestActive = false
    return
  }

  request = context.requests.shift()

  for (i = 0; i < results.elements.length; i++) {
    el = results.elements[i]

    if ('count' in el) {
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
        var BBoxRequest = {
          options: {
            properties: OverpassFrontend.BBOX,
            bbox: request.options.bbox
          },
          bboxNoMatch: true
        }

        this.createOrUpdateOSMObject(el, BBoxRequest)

        continue
      }
    }

    this.createOrUpdateOSMObject(el, request)

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

  if (options === null) {
    options = {}
  }
  if (typeof options.properties === 'undefined') {
    options.properties = OverpassFrontend.DEFAULT
  }
  options.properties |= OverpassFrontend.BBOX

  if (typeof options.split === 'undefined') {
    options.split = 0
  }

  var request = new OverpassRequest(this, {
    type: 'BBoxQuery',
    query: query,
    bounds: bounds,
    remainingBounds: bounds,
    options: options,
    priority: 'priority' in options ? options.priority : 0,
    doneFeatures: {},
    featureCallback: featureCallback,
    finalCallback: finalCallback,
    lastChecked: 0
  })

  var callbacks = new SortedCallbacks(request.options, request.featureCallback, request.finalCallback)
  request.featureCallback = callbacks.next.bind(callbacks)
  request.finalCallback = callbacks.final.bind(callbacks)

  if (request.query in this.overpassBBoxQueryElements) {
    this._preprocessBBoxQuery(request)

    // check if we need to call Overpass API (whole area known?)
    var remainingBounds = request.bounds
    if (this.overpassBBoxQueryRequested[request.query] !== null) {
      var toRequest = request.bounds.toGeoJSON()
      remainingBounds = turf.difference(toRequest, this.overpassBBoxQueryRequested[request.query])
    }

    var done = false
    if (remainingBounds === undefined) {
      request.finalCallback(null)
      done = true
    } else {
      request.remainingBounds = new BoundingBox(remainingBounds)
    }

    if (done) {
      return request
    }
  } else {
    // otherwise initialize cache
    this.overpassBBoxQueryElements[request.query] = new Quadtree.Quadtree(
      new Quadtree.Box(
        new Quadtree.Point(-90, -180),
        new Quadtree.Point(90, 180)
      )
    )

    this.overpassBBoxQueryRequested[request.query] = null
    this.overpassBBoxQueryLastUpdated[request.query] = 0
  }

  this.overpassRequests.push(request)

  async.setImmediate(function () {
    this._overpassProcess()
  }.bind(this))

  return request
}

OverpassFrontend.prototype._preprocessBBoxQuery = function (request) {
  if (request.lastChecked > this.overpassBBoxQueryLastUpdated[request.query]) {
    return
  }
  request.lastChecked = new Date().getTime()

  // if we already have cached objects, check if we have immediate results
  var quadtreeBounds = toQuadtreeLookupBox(request.bounds)

  var items = this.overpassBBoxQueryElements[request.query].queryRange(quadtreeBounds)
  // TODO: do something with 'items'

  for (var i = 0; i < items.length; i++) {
    var id = items[i].value
    var ob = this.overpassElements[id]

    if (id in request.doneFeatures) {
      continue
    }

    if ((request.options.properties & ob.properties) === request.options.properties) {
      request.doneFeatures[id] = ob

      request.featureCallback(null, ob)
    }
  }
}

OverpassFrontend.prototype._processBBoxQuery = function (request) {
  // check if we need to call Overpass API (whole area known?)
  var remainingBounds = request.bounds
  if (this.overpassBBoxQueryRequested[request.query] !== null) {
    var toRequest = request.bounds.toGeoJSON()
    remainingBounds = turf.difference(toRequest, this.overpassBBoxQueryRequested[request.query])

    if (remainingBounds === undefined) {
      request.finalCallback(null)
      this.overpassRequests[this.overpassRequests.indexOf(request)] = null

      this.overpassRequestActive = false

      async.setImmediate(function () {
        this._overpassProcess()
      }.bind(this))

      return
    }
  }

  // var BBoxString = request.remainingBounds.toLatLonString()
  // TODO: turf union/difference is broken - use full bounds instead
  var BBoxString = request.bounds.toLatLonString()

  var queryOptions = '[bbox:' + BBoxString + ']'

  var context = {
    request: request
  }

  var query = '[out:json]' + queryOptions + ';\n(' + request.query + ')->.result;\n'

  var queryRemoveDoneFeatures = ''
  var countRemoveDoneFeatures = 0
  for (var id in request.doneFeatures) {
    var ob = request.doneFeatures[id]

    if (countRemoveDoneFeatures % 1000 === 999) {
      query += '(' + queryRemoveDoneFeatures + ')->.done;\n'
      queryRemoveDoneFeatures = '.done;'
    }

    queryRemoveDoneFeatures += ob.type + '(' + ob.osm_id + ');'
    countRemoveDoneFeatures++
  }

  if (countRemoveDoneFeatures) {
    query += '(' + queryRemoveDoneFeatures + ')->.done;\n'
    query += '(.result; - .done);\n'
  }

  query += 'out ' + overpassOutOptions(request.options) + ';'

  setTimeout(function () {
    httpLoad(
      this.url,
      null,
      query,
      this._handleBBoxQueryResult.bind(this, context)
    )
  }.bind(this), this.options.timeGap)
}

OverpassFrontend.prototype._handleBBoxQueryResult = function (context, err, results) {
  var request = context.request
  var todo = {}

  if (err) {
    // call finalCallback for the request
    request.finalCallback(err)

    // remove current request
    this.overpassRequests[this.overpassRequests.indexOf(request)] = null
    this.overpassRequestActive = false

    return
  }

  for (var i = 0; i < results.elements.length; i++) {
    var el = results.elements[i]
    var id = el.type.substr(0, 1) + el.id

    var obBBox = new BoundingBox(el)
    var approxRouteLength = obBBox.diagonalLength(obBBox)

    var ob = this.createOrUpdateOSMObject(el, request)
    request.doneFeatures[id] = ob

    todo[id] = {
      bounds: obBBox,
      approxRouteLength: approxRouteLength
    }

    this.overpassBBoxQueryElements[request.query].insert(toQuadtreeLookupBox(obBBox), id)
  }

  if (!request.aborted) {
    for (var k in todo) {
      request.featureCallback(null, this.overpassElements[k])
    }
  }

  this.overpassBBoxQueryLastUpdated[request.query] = new Date().getTime()

  if ((request.options.split === 0) ||
      (request.options.split > results.elements.length)) {
    var toRequest = request.remainingBounds.toGeoJSON()
    if (this.overpassBBoxQueryRequested[request.query] === null) {
      this.overpassBBoxQueryRequested[request.query] = toRequest
    } else {
      this.overpassBBoxQueryRequested[request.query] = turf.union(toRequest, this.overpassBBoxQueryRequested[request.query])
    }

    if (!this.aborted) {
      request.finalCallback(null)
    }

    this.overpassRequests[this.overpassRequests.indexOf(request)] = null
  }
  this.overpassRequestActive = false

  async.setImmediate(function () {
    this._overpassProcess()
  }.bind(this))
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

OverpassFrontend.prototype.createOrUpdateOSMObject = function (el, request) {
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

  ob.updateData(el, request)

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

function overpassOutOptions (options) {
  var outOptions = ''

  if ('split' in options && options.split > 0) {
    outOptions += options.split + ' '
  }

  if (options.properties & OverpassFrontend.META) {
    outOptions += 'meta '
  } else if (options.properties & OverpassFrontend.TAGS) {
    if (options.properties & OverpassFrontend.MEMBERS) {
      outOptions += 'body '
    } else {
      outOptions += 'tags '
    }
  } else if (options.properties & OverpassFrontend.MEMBERS) {
    outOptions += 'skel '
  } else {
    outOptions += 'ids '
  }

  if (options.properties & OverpassFrontend.GEOM) {
    outOptions += 'geom '
  } else if (options.properties & OverpassFrontend.BBOX) {
    outOptions += 'bb '
  } else if (options.properties & OverpassFrontend.CENTER) {
    outOptions += 'center '
  }

  outOptions += 'qt'

  return outOptions
}

function toQuadtreeLookupBox (boundingbox) {
  return new Quadtree.Box(
    new Quadtree.Point(boundingbox.minlat, boundingbox.minlon),
    new Quadtree.Point(boundingbox.maxlat, boundingbox.maxlon)
  )
}

module.exports = OverpassFrontend
