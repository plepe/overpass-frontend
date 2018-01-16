const overpassOutOptions = require('./overpassOutOptions')
const Quadtree = require('quadtree-lookup')
const toQuadtreeLookupBox = require('./toQuadtreeLookupBox')
const turf = require('./turf')
const BoundingBox = require('boundingbox')
const defines = require('./defines')

function requestExtMembersInit () {
  var cacheId = this.query + '|members'

  if (cacheId in this.overpass.cacheBBoxQueries) {
    this.cacheExtMembers = this.overpass.cacheBBoxQueries[cacheId]
  } else {
    // otherwise initialize cache
    this.overpass.cacheBBoxQueries[cacheId] = {}
    this.cacheExtMembers = this.overpass.cacheBBoxQueries[cacheId]
    this.cacheExtMembers.elements = new Quadtree.Quadtree(
      new Quadtree.Box(
        new Quadtree.Point(-90, -180),
        new Quadtree.Point(90, 180)
      )
    )

    this.cacheExtMembers.requested = null
    this.cacheExtMembers.timestamp = 0
  }

  this.loadFinishExtMembers = false
  this.doneFeaturesExtMembers = {}

  if (typeof this.options.memberSplit === 'undefined') {
    this.options.memberSplit = 0
  }

  if (typeof this.options.memberProperties === 'undefined') {
    this.options.memberProperties = defines.DEFAULT
  }
  this.options.memberProperties |= defines.BBOX
}

function requestExtMembersPreprocess (fun) {
  fun.call(this)

  var quadtreeBounds = toQuadtreeLookupBox(this.bounds)

  var items = this.cacheExtMembers.elements.queryRange(quadtreeBounds)
  // TODO: do something with 'items'

  for (var i = 0; i < items.length; i++) {
    var id = items[i].value
    var ob = this.overpass.cacheElements[id]

    if (id in this.doneFeaturesExtMembers) {
      continue
    }

    // also check the object directly if it intersects the bbox - if possible
    if (!ob.intersects(this.bounds)) {
      continue
    }

    if ((this.options.memberProperties & ob.properties) === this.options.memberProperties) {
      this.doneFeaturesExtMembers[id] = ob

      this.options.memberCallback(null, ob)
    }
  }
}

function requestExtMembersCompileQuery (fun, context) {
  var subRequest = fun.call(this, context)

  var BBoxString = this.bounds.toLatLonString()

  var query = '(\n' +
     '  node(r.result)(' + BBoxString + ');\n' +
     '  way(r.result)(' + BBoxString + ');\n' +
     '  relation(r.result)(' + BBoxString + ');\n' +
     ')->.resultMembers;\n'

  var queryRemoveDoneFeatures = ''
  var countRemoveDoneFeatures = 0
  for (var id in this.doneFeaturesExtMembers) {
    var ob = this.doneFeaturesExtMembers[id]

    if (countRemoveDoneFeatures % 1000 === 999) {
      query += '(' + queryRemoveDoneFeatures + ')->.doneMembers;\n'
      queryRemoveDoneFeatures = '.doneMembers;'
    }

    queryRemoveDoneFeatures += ob.type + '(' + ob.osm_id + ');'
    countRemoveDoneFeatures++
  }

  if (countRemoveDoneFeatures) {
    query += '(' + queryRemoveDoneFeatures + ')->.doneMembers;\n'
    query += '(.resultMembers; - .doneMembers);\n'
  } else {
    query += '(.resultMembers);\n'
  }

  var membersOptions = {
    split: this.options.memberSplit,
    properties: this.options.memberProperties,
    receiveObject: requestExtMembersReceive.bind(this),
    featureCallback: this.options.memberCallback,
    count: 0
  }

  query += 'out ' + overpassOutOptions(membersOptions) + ';'

  subRequest.query += '\nout count;\n' + query
  this.partIndexExtMembers = subRequest.parts.length
  subRequest.parts.push(membersOptions)

  return subRequest
}

function requestExtMembersReceive (ob) {
  this.doneFeaturesExtMembers[ob.id] = ob
  this.cacheExtMembers.elements.insert(toQuadtreeLookupBox(ob.bounds), ob.id)
}

function requestExtMembersNeedLoad (fun) {
  var result = fun.call(this)

  if (result === true) {
    return true
  }

  if (this.loadFinishExtMembers) {
    return false
  }

  var remainingBounds = this.bounds
  if (this.cacheExtMembers.requested !== null) {
    var toRequest = this.bounds.toGeoJSON()
    remainingBounds = turf.difference(toRequest, this.cacheExtMembers.requested)

    if (remainingBounds === undefined) {
      return false
    } else {
      this.remainingBoundsExtMembers = new BoundingBox(remainingBounds)
      return true
    }
  }

  return true
}

function requestExtMembersFinishSubrequest (fun, subRequest) {
  fun.call(this, subRequest)

  this.cacheExtMembers.timestamp = new Date().getTime()

  if ((this.options.memberSplit === 0) ||
      (this.options.memberSplit > subRequest.parts[this.partIndexExtMembers].count)) {
    this.loadFinishExtMembers = true

    if (!this.aborted) {
      var toRequest = this.remainingBounds.toGeoJSON()
      if (this.cacheExtMembers.requested === null) {
        this.cacheExtMembers.requested = toRequest
      } else {
        this.cacheExtMembers.requested = turf.union(toRequest, this.cacheExtMembers.requested)
      }
    }
  }
}

module.exports = function (request) {
  request.compileQuery = requestExtMembersCompileQuery.bind(request, request.compileQuery)
  request.needLoad = requestExtMembersNeedLoad.bind(request, request.needLoad)
  request.preprocess = requestExtMembersPreprocess.bind(request, request.preprocess)
  request.finishSubRequest = requestExtMembersFinishSubrequest.bind(request, request.finishSubRequest)

  requestExtMembersInit.call(request)
}
