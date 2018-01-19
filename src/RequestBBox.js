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

    if (this.query in this.overpass.overpassBBoxQueryElements) {
      this.preprocess()

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

  /**
   * check if there are any map features which can be returned right now
   */
  preprocess () {
    if (this.lastChecked > this.overpass.overpassBBoxQueryLastUpdated[this.query]) {
      if (!this.needLoad()) {
        this.finish()
      }

      return
    }
    this.lastChecked = new Date().getTime()

    // if we already have cached objects, check if we have immediate results
    var quadtreeBounds = toQuadtreeLookupBox(this.bounds)

    var items = this.overpass.overpassBBoxQueryElements[this.query].queryRange(quadtreeBounds)
    // TODO: do something with 'items'

    for (var i = 0; i < items.length; i++) {
      var id = items[i].value
      var ob = this.overpass.overpassElements[id]

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
          count: 0
        }
      ]
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
  receiveObject (ob, subRequest, partIndex) {
    subRequest.parts[partIndex].count++
    this.doneFeatures[ob.id] = ob
    this.overpass.overpassBBoxQueryElements[this.query].insert(toQuadtreeLookupBox(ob.bounds), ob.id)

    if (!this.aborted) {
      this.featureCallback(null, ob)
    }
  }

  /**
   * the current subrequest is finished -> update caches, check whether request is finished
   * @param {Request#SubRequest} subRequest - the current sub request
   */
  finishSubRequest (subRequest) {
    super.finishSubRequest(subRequest)

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
    if (this.overpass.overpassBBoxQueryRequested[this.query] !== null) {
      var toRequest = this.bounds.toGeoJSON()
      remainingBounds = turf.difference(toRequest, this.overpass.overpassBBoxQueryRequested[this.query])

      return remainingBounds !== undefined
    }

    return true
  }
}

module.exports = RequestBBox
