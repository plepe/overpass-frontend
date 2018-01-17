const Request = require('./Request')
const overpassOutOptions = require('./overpassOutOptions')
const defines = require('./defines')
const turf = require('./turf')
const toQuadtreeLookupBox = require('./toQuadtreeLookupBox')
const BoundingBox = require('boundingbox')
const SortedCallbacks = require('./SortedCallbacks')
const Quadtree = require('quadtree-lookup')

class RequestBBox extends Request {
  constructor (overpass, data) {
    super(overpass, data)
    this.type = 'BBoxQuery'

    if (typeof this.options.properties === 'undefined') {
      this.options.properties = defines.DEFAULT
    }
    this.options.properties |= defines.BBOX

    if (typeof this.options.split === 'undefined') {
      this.options.split = 0
    }

    var callbacks = new SortedCallbacks(this.options, this.featureCallback, this.finalCallback)
    this.featureCallback = callbacks.next.bind(callbacks)
    this.finalCallback = callbacks.final.bind(callbacks)

    this.callCount = 0
    this.loadFinish = false
    this.lastChecked = 0

    this.init()
  }

  init () {
    if (this.query in this.overpass.overpassBBoxQueryElements) {
      this.overpass._preprocessBBoxQuery(this)

      // check if we need to call Overpass API (whole area known?)
      var remainingBounds = this.bounds
      if (this.overpass.overpassBBoxQueryRequested[this.query] !== null) {
        var toRequest = this.bounds.toGeoJSON()
        remainingBounds = turf.difference(toRequest, this.overpass.overpassBBoxQueryRequested[this.query])
      }

      var done = false
      if (remainingBounds === undefined) {
        this.finalCallback(null)
        done = true
      } else {
        this.remainingBounds = new BoundingBox(remainingBounds)
      }

      if (done) {
        return
      }
    } else {
      // otherwise initialize cache
      this.overpass.overpassBBoxQueryElements[this.query] = new Quadtree.Quadtree(
        new Quadtree.Box(
          new Quadtree.Point(-90, -180),
          new Quadtree.Point(90, 180)
        )
      )

      this.overpass.overpassBBoxQueryRequested[this.query] = null
      this.overpass.overpassBBoxQueryLastUpdated[this.query] = 0
    }
  }

  compileQuery () {
    // var BBoxString = this.remainingBounds.toLatLonString()
    // TODO: turf union/difference is broken - use full bounds instead
    var BBoxString = this.bounds.toLatLonString()
    var queryOptions = '[bbox:' + BBoxString + ']'

    var query = '[out:json]' + queryOptions + ';\n(' + this.query + ')->.result;\n'

    var queryRemoveDoneFeatures = ''
    var countRemoveDoneFeatures = 0
    for (var id in this.doneFeatures) {
      var ob = this.doneFeatures[id]

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

    query += 'out ' + overpassOutOptions(this.options) + ';'

    return {
      query,
      request: this,
      parts: [
        {
          properties: this.options.properties,
          count: 0
        }
      ]
    }
  }

  receiveObject (ob, subRequest, partIndex) {
    subRequest.parts[partIndex].count++
    this.doneFeatures[ob.id] = ob
    this.overpass.overpassBBoxQueryElements[this.query].insert(toQuadtreeLookupBox(ob.bounds), ob.id)

    if (!this.aborted) {
      this.featureCallback(null, ob)
    }
  }

  finishSubRequest (subRequest) {
    this.overpass.overpassBBoxQueryLastUpdated[this.query] = new Date().getTime()

    if ((this.options.split === 0) ||
        (this.options.split > subRequest.parts[0].count)) {
      this.loadFinish = true

      if (!this.aborted) {
        var toRequest = this.remainingBounds.toGeoJSON()
        if (this.overpass.overpassBBoxQueryRequested[this.query] === null) {
          this.overpass.overpassBBoxQueryRequested[this.query] = toRequest
        } else {
          this.overpass.overpassBBoxQueryRequested[this.query] = turf.union(toRequest, this.overpass.overpassBBoxQueryRequested[this.query])
        }
      }

      this.finish()
    }
  }

  needLoad () {
    if (this.loadFinish) {
      return false
    }

    // check if we need to call Overpass API (whole area known?)
    var remainingBounds = this.bounds
    if (this.overpass.overpassBBoxQueryRequested[this.query] !== null) {
      var toRequest = this.bounds.toGeoJSON()
      remainingBounds = turf.difference(toRequest, this.overpass.overpassBBoxQueryRequested[this.query])

      return remainingBounds !== undefined
    }

    return true
  }
}

module.exports = RequestBBox
