const Request = require('./Request')
const overpassOutOptions = require('./overpassOutOptions')
const defines = require('./defines')
const turf = require('./turf')
const toQuadtreeLookupBox = require('./toQuadtreeLookupBox')
const BoundingBox = require('boundingbox')
const Quadtree = require('quadtree-lookup')

/**
 * A BBox request
 * @extends Request
 */
class RequestBBox extends Request {
  /**
   * @param {OverpassFrontend} overpass
   * @param {data} data
   */
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

    this.loadFinish = false
    this.lastChecked = 0

    if (this.query in this.overpass.cacheBBoxQueries) {
      this.cache = this.overpass.cacheBBoxQueries[this.query]

      this.preprocess()

      // check if we need to call Overpass API (whole area known?)
      if (!this.needLoad()) {
        return this.finalCallback(null)
      }
    } else {
      // otherwise initialize cache
      this.overpass.cacheBBoxQueries[this.query] = {}
      this.cache = this.overpass.cacheBBoxQueries[this.query]
      this.cache.elements = new Quadtree.Quadtree(
        new Quadtree.Box(
          new Quadtree.Point(-90, -180),
          new Quadtree.Point(90, 180)
        )
      )

      this.cache.requested = null
      this.cache.timestamp = 0
    }
  }

  /**
   * check if there are any map features which can be returned right now
   */
  preprocess () {
    if (this.lastChecked > this.cache.timestamp) {
      if (!this.needLoad()) {
        this.finish()
      }

      return
    }
    this.lastChecked = new Date().getTime()

    // if we already have cached objects, check if we have immediate results
    var quadtreeBounds = toQuadtreeLookupBox(this.bounds)

    var items = this.cache.elements.queryRange(quadtreeBounds)
    // TODO: do something with 'items'

    for (var i = 0; i < items.length; i++) {
      var id = items[i].value
      var ob = this.overpass.cacheElements[id]

      if (id in this.doneFeatures) {
        continue
      }

      // also check the object directly if it intersects the bbox - if possible
      if (!ob.intersects(this.bounds)) {
        continue
      }

      if ((this.options.properties & ob.properties) === this.options.properties) {
        this.doneFeatures[id] = ob

        this.featureCallback(null, ob)
      }
    }

    if (!this.needLoad()) {
      this.finish()
    }
  }

  /**
   * compile the query
   * @param {OverpassFrontend#Context} context - Current context
   * @return {Request#SubRequest|false} - the compiled query or false if the bbox does not match
   */
  compileQuery (context) {
    super.compileQuery(context)

    // if the context already has a bbox and it differs from this, we can't add
    // ours
    if (context.bbox && context.bbox.toLatLonString() !== this.bounds.toLatLonString()) {
      return false
    }
    context.bbox = this.bounds

    var query = '(' + this.query + ')->.result;\n'

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

    var subRequest = {
      query,
      request: this,
      parts: [
        {
          properties: this.options.properties,
          receiveObject: this.receiveObject.bind(this),
          featureCallback: this.featureCallback
        }
      ],
      effort: this.options.split ? this.options.split * 4 : 512 // TODO: configure bbox effort
    }
    this.emit('subrequest-compile', subRequest)
    return subRequest
  }

  /**
   * receive an object from OverpassFronted -> enter to cache, return to caller
   * @param {OverpassObject} ob - Object which has been received
   * @param {Request#SubRequest} subRequest - sub request which is being handled right now
   * @param {int} partIndex - Which part of the subRequest is being received
   */
  receiveObject (ob) {
    this.doneFeatures[ob.id] = ob
    this.cache.elements.insert(toQuadtreeLookupBox(ob.bounds), ob.id)
  }

  /**
   * the current subrequest is finished -> update caches, check whether request is finished
   * @param {Request#SubRequest} subRequest - the current sub request
   */
  finishSubRequest (subRequest) {
    super.finishSubRequest(subRequest)

    this.cache.timestamp = new Date().getTime()

    if ((this.options.split === 0) ||
        (this.options.split > subRequest.parts[0].count)) {
      this.loadFinish = true

      if (!this.aborted) {
        var toRequest = this.remainingBounds.toGeoJSON()
        if (this.cache.requested === null) {
          this.cache.requested = toRequest
        } else {
          this.cache.requested = turf.union(toRequest, this.cache.requested)
        }
      }

      this.finish()
    }
  }

  /**
   * check if we need to call Overpass API. Maybe whole area is cached anyway?
   * @return {boolean} - true, if we need to call Overpass API
   */
  needLoad () {
    if (this.loadFinish) {
      return false
    }

    // check if we need to call Overpass API (whole area known?)
    var remainingBounds = this.bounds
    if (this.cache.requested !== null) {
      var toRequest = this.bounds.toGeoJSON()
      remainingBounds = turf.difference(toRequest, this.cache.requested)

      if (remainingBounds === undefined) {
        return false
      } else {
        this.remainingBounds = new BoundingBox(remainingBounds)
        return true
      }
    }

    return true
  }
}

module.exports = RequestBBox
