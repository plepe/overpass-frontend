const defines = require('./defines')
const overpassOutOptions = require('./overpassOutOptions')
const Quadtree = require('quadtree-lookup')
const toQuadtreeLookupBox = require('./toQuadtreeLookupBox')
const turf = require('./turf')
const BoundingBox = require('boundingbox')
const each = require('lodash/forEach')
const map = require('lodash/map')
const keys = require('lodash/keys')

function requestExtMembersInit () {
  this.options.properties |= defines.MEMBERS

  this.doneFeaturesExtMembers = {}
  this.todoExtMembers = {}
}

function requestExtMembersPreprocess (fun) {
  fun.call(this)

  this.todoExtMembers = {}
  each(this.doneFeatures, ob => {
    each(ob.members, member => {
      if (!(member.id in this.doneFeaturesExtMembers)) {
        this.todoExtMembers[member.id] = undefined
      }
    })
  })

  each(this.todoExtMembers, (value, id) => {
    if (id in this.overpass.cacheElements) {
    }
  })

  return


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

  if (keys(this.doneFeatures).length === 0) {
    return subRequest
  }

  let query = '(\n'
  map(this.doneFeatures, ob => {
    if (ob.type === 'relation') {
      return 'relation(' + ob.id + ');\n';
    }
    return ''
  }).join('')
  query += ')->.result;'

  let BBoxString = this.bounds.toLatLonString()
  query = '(\n' +
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
    effortSplit: this.options.membersEffortSplit,
    properties: this.options.memberProperties,
    receiveObject: requestExtMembersReceive.bind(this),
    featureCallback: this.options.memberCallback,
    count: 0
  }

  query += 'out ' + overpassOutOptions(membersOptions) + ';'

  subRequest.query += '\nout count;\n' + query
  subRequest.parts.push(membersOptions)
  this.subRequestIndexExtMembers = 

  return subRequest
}

function requestExtMembersReceive (ob) {
  this.doneFeaturesExtMembers[ob.id] = ob
}

function requestExtMembersFinishSubRequest (subRequest) {
  var result = fun.call(this)

  if (('membersEffortSplit' in this.options && this.options.membersEffortSplit > subRequest.parts[].count) ||
      (this.options.split > subRequest.parts[0].count)) {
    this.loadFinish = true

}

function requestExtMembersNeedLoad (fun) {
  var result = fun.call(this)
  return result

  if (result === true) {
    return true
  }

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

  return false
}

module.exports = function (request) {
  request.compileQuery = requestExtMembersCompileQuery.bind(request, request.compileQuery)
  request.needLoad = requestExtMembersNeedLoad.bind(request, request.needLoad)
  request.preprocess = requestExtMembersPreprocess.bind(request, request.preprocess)

  requestExtMembersInit.call(request)
}
