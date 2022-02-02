const Request = require('./Request')
const overpassOutOptions = require('./overpassOutOptions')
const defines = require('./defines')
const KnownArea = require('./knownArea')
const RequestBBoxMembers = require('./RequestBBoxMembers')
const Filter = require('./Filter')
const boundsToLokiQuery = require('./boundsToLokiQuery')
const boundsIsFullWorld = require('./boundsIsFullWorld')
const isodate = require('./isodate')

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
    if (this.overpass.options.attic) {
      this.options.properties |= defines.META
    }
    if (this.options.date) {
      this.options.date = isodate(this.options.date)
    }
    this.options.properties |= defines.BBOX
    this.options.minEffort = this.options.minEffort || 256

    // make sure the request ends with ';'
    if (!this.query.match(/;\s*$/)) {
      this.query += ';'
    }

    if ((typeof this.options.filter !== 'undefined') && !(this.options.filter instanceof Filter)) {
      this.options.filter = new Filter(this.options.filter)
    }

    let filterId = null
    if (this.options.filter) {
      filterId = this.options.filter.toString()
    }

    if (!('noCacheQuery' in this.options) || !this.options.noCacheQuery) {
      this.filterQuery = new Filter(this.query)

      this.lokiQuery = this.filterQuery.toLokijs()
      this.lokiQueryNeedMatch = !!this.lokiQuery.needMatch
      delete this.lokiQuery.needMatch

      if (this.options.filter) {
        const filterLokiQuery = this.options.filter.toLokijs()
        this.lokiQueryFilterNeedMatch = !!filterLokiQuery.needMatch
        delete filterLokiQuery.needMatch

        this.lokiQuery = { $and: [this.lokiQuery, filterLokiQuery] }
      }

      if (!boundsIsFullWorld(this.bounds)) {
        this.lokiQuery = { $and: [this.lokiQuery, boundsToLokiQuery(this.bbox, this.overpass)] }
      }

      if (this.options.date) {
        this.lokiQuery = { $and: [this.lokiQuery, { timestamp: { $lte: isodate(this.options.date) } }] }
      }

      // if attic date is enabled, we have to check again to filter out false
      // positives (an older version of an object might have matched)
      if (this.overpass.options.attic) {
        this.lokiQueryNeedMatch = true
        if (this.options.filter) {
          this.lokiQueryFilterNeedMatch = true
        }
      }
    }

    this.loadFinish = false

    if ('members' in this.options) {
      RequestBBoxMembers(this)
    }

    if (this.query in this.overpass.cacheBBoxQueries) {
      this.cache = this.overpass.cacheBBoxQueries[this.query]

      if (filterId) {
        if (!('filter' in this.cache)) {
          this.cache.filter = {}
        }

        if (!(filterId in this.cache.filter)) {
          this.cache.filter[filterId] = new KnownArea()
        }

        this.cacheFilter = this.cache.filter[filterId]
      }
    } else {
      // otherwise initialize cache
      this.overpass.cacheBBoxQueries[this.query] = {}
      this.cache = this.overpass.cacheBBoxQueries[this.query]
      this.cache.requested = new KnownArea()

      if (filterId) {
        this.cache.filter = {}
        this.cache.filter[filterId] = new KnownArea()
        this.cacheFilter = this.cache.filter[filterId]
      }
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

    // items should be a list of IDs
    items = items.map(item => item.id)
    if (this.overpass.options.attic) {
      // filter out duplicates
      items = [...new Set(items)]
    }

    items.forEach(id => {
      const ob = this.overpass.cache.get(id, this.options)
      if (ob === undefined) {
        return
      }

      if (id in this.doneFeatures) {
        return
      }

      // maybe we need an additional check
      if (this.lokiQueryNeedMatch && !this.filterQuery.match(ob)) {
        return
      }

      if (this.lokiQueryFilterNeedMatch && !this.options.filter.match(ob)) {
        return
      }

      // also check the object directly if it intersects the bbox - if possible
      if (ob.intersects(this.bounds) < 2) {
        return
      }

      if ((this.options.properties & ob.properties) === this.options.properties) {
        this.doneFeatures[id] = ob

        this.featureCallback(null, ob)
      }
    })
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

    if (context.date !== this.options.date) {
      return false
    }
    context.date = this.options.date

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
    let query = '(' + this.query + ')->.result;\n'

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

    if (this.options.filter) {
      query += this.options.filter.toQl({
        inputSet: '.result',
        outputSet: '.result'
      })
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

      if (this.options.filter) {
        this.cacheFilter.add(this.bbox)
      } else {
        this.cache.requested.add(this.bbox)
      }
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
    if (this.options.filter && this.cacheFilter.check(this.bbox)) {
      return false
    }

    return !this.cache.requested.check(this.bbox)
  }

  mayFinish () {
    return !this.needLoad()
  }
}

module.exports = RequestBBox
