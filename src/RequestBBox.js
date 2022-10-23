const Request = require('./Request')
const overpassOutOptions = require('./overpassOutOptions')
const defines = require('./defines')
const BBoxQueryCache = require('./BBoxQueryCache')
const RequestBBoxMembers = require('./RequestBBoxMembers')
const Filter = require('./Filter')
const boundsToLokiQuery = require('./boundsToLokiQuery')
const boundsIsFullWorld = require('./boundsIsFullWorld')

/**
 * A BBox request
 * @extends Request
 */
class RequestBBox extends Request {
  /**
   * @param {OverpassFrontend} overpass
   * @param {object} options
   */
  constructor (overpass, data) {
    super(overpass, data)
    this.type = 'BBoxQuery'

    if (typeof this.options.properties === 'undefined') {
      this.options.properties = defines.DEFAULT
    }
    this.options.properties |= defines.BBOX
    this.options.minEffort = this.options.minEffort || 256

    // make sure the request ends with ';'
    if (!this.query.match(/;\s*$/)) {
      this.query += ';'
    }

    if (!('noCacheQuery' in this.options) || !this.options.noCacheQuery) {
      try {
        if (this.options.filter) {
          this.filterQuery = new Filter({ and: [this.query, this.options.filter] })
          this.query = this.filterQuery.toQl()
        } else {
          this.filterQuery = new Filter(this.query)
        }
      } catch (err) {
        return this.finish(err)
      }

      this.lokiQuery = this.filterQuery.toLokijs()
      this.lokiQueryNeedMatch = !!this.lokiQuery.needMatch
      delete this.lokiQuery.needMatch

      if (!boundsIsFullWorld(this.bounds)) {
        this.lokiQuery = { $and: [this.lokiQuery, boundsToLokiQuery(this.bbox, this.overpass)] }
      }

      const cacheFilter = new Filter({ and: [this.filterQuery, new Filter('nwr(properties:' + this.options.properties + ')')] })
      this.options.properties = cacheFilter.properties()

      this.cacheDescriptors = cacheFilter.cacheDescriptors().map(cacheDescriptors => {
        return {
          cache: BBoxQueryCache.get(this.overpass, cacheDescriptors.id),
          cacheDescriptors
        }
      })
    }

    this.loadFinish = false

    if ('members' in this.options) {
      RequestBBoxMembers(this)
    }
  }

  /**
   * check if there are any map features which can be returned right now
   */
  preprocess () {
    let items = []
    if (this.lokiQuery) {
      items = this.overpass.db.find(this.lokiQuery)
    }

    for (let i = 0; i < items.length; i++) {
      const id = items[i].id

      if (!(id in this.overpass.cacheElements)) {
        continue
      }
      const ob = this.overpass.cacheElements[id]

      if (id in this.doneFeatures) {
        continue
      }

      // maybe we need an additional check
      if (this.lokiQueryNeedMatch && !this.filterQuery.match(ob)) {
        continue
      }

      // also check the object directly if it intersects the bbox - if possible
      if (ob.intersects(this.bounds) < 2) {
        continue
      }

      if ((this.options.properties & ob.properties) === this.options.properties) {
        this.doneFeatures[id] = ob

        this.featureCallback(null, ob)
      }
    }
  }

  /**
   * shall this Request be included in the current call?
   * @param {OverpassFrontend#Context} context - Current context
   * @return {boolean|int[]} - yes|no - or [ minEffort, maxEffort ]
   */
  willInclude (context) {
    if (this.loadFinish) {
      return false
    }

    if (context.bbox && context.bbox.toLatLonString() !== this.bbox.toLatLonString()) {
      return false
    }
    context.bbox = this.bbox

    for (const i in context.requests) {
      const request = context.requests[i]
      if (request instanceof RequestBBox && request.query === this.query) {
        return false
      }
    }

    return true
  }

  /**
   * how much effort can a call to this request use
   * @return {Request#minMaxEffortResult} - minimum and maximum effort
   */
  minMaxEffort () {
    if (this.loadFinish) {
      return { minEffort: 0, maxEffort: 0 }
    }

    return { minEffort: this.options.minEffort, maxEffort: null }
  }

  /**
   * compile the query
   * @param {OverpassFrontend#Context} context - Current context
   * @return {Request#SubRequest|false} - the compiled query or false if the bbox does not match
   */
  _compileQuery (context) {
    if (this.loadFinish || (context.bbox && context.bbox.toLatLonString() !== this.bbox.toLatLonString())) {
      return {
        query: '',
        request: this,
        parts: [],
        effort: 0
      }
    }

    const effortAvailable = Math.max(context.maxEffort, this.options.minEffort)

    // if the context already has a bbox and it differs from this, we can't add
    // ours
    let query = this.query.substr(0, this.query.length - 1) + '->.result;\n'

    let queryRemoveDoneFeatures = ''
    let countRemoveDoneFeatures = 0
    for (const id in this.doneFeatures) {
      const ob = this.doneFeatures[id]

      if (countRemoveDoneFeatures % 1000 === 999) {
        query += '(' + queryRemoveDoneFeatures + ')->.done;\n'
        queryRemoveDoneFeatures = '.done;'
      }

      queryRemoveDoneFeatures += ob.type + '(' + ob.osm_id + ');'
      countRemoveDoneFeatures++
    }

    if (countRemoveDoneFeatures) {
      query += '(' + queryRemoveDoneFeatures + ')->.done;\n'
      query += '(.result; - .done;)->.result;\n'
    }

    if (!('split' in this.options)) {
      this.options.effortSplit = Math.ceil(effortAvailable / 4)
    }
    query += '.result out ' + overpassOutOptions(this.options) + ';'

    const subRequest = {
      query,
      request: this,
      parts: [
        {
          properties: this.options.properties,
          receiveObject: this.receiveObject.bind(this),
          checkFeatureCallback: this.checkFeatureCallback.bind(this),
          featureCallback: this.featureCallback
        }
      ],
      effort: this.options.split ? this.options.split * 4 : effortAvailable // TODO: configure bbox effort
    }
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
  }

  checkFeatureCallback (ob) {
    if (this.bounds && ob.intersects(this.bounds) === 0) {
      return false
    }

    return true
  }

  /**
   * the current subrequest is finished -> update caches, check whether request is finished
   * @param {Request#SubRequest} subRequest - the current sub request
   */
  finishSubRequest (subRequest) {
    super.finishSubRequest(subRequest)

    if (('effortSplit' in this.options && this.options.effortSplit > subRequest.parts[0].count) ||
        (this.options.split > subRequest.parts[0].count)) {
      this.loadFinish = true

      this.cacheDescriptors && this.cacheDescriptors.forEach(cache => {
        cache.cache.add(this.bbox, cache.cacheDescriptors)
      })
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

    return !this.cacheDescriptors || !this.cacheDescriptors.every(cache => {
      return cache.cache.check(this.bbox, cache.cacheDescriptors)
    })
  }

  mayFinish () {
    return !this.needLoad()
  }
}

module.exports = RequestBBox
