const BoundingBox = require('boundingbox')
const Request = require('./Request')
const overpassOutOptions = require('./overpassOutOptions')
const defines = require('./defines')
const RequestBBoxMembers = require('./RequestBBoxMembers')
const Filter = require('./Filter')
const boundsIsFullWorld = require('./boundsIsFullWorld')
const compileRecurseReverse = require('./compileRecurseReverse')
const compileRecurseFilter = require('./compileRecurseFilter')

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

    this.options.minEffort = this.options.minEffort || 256

    // make sure the request ends with ';'
    if (!this.query.match(/;\s*$/)) {
      this.query += ';'
    }

    if (!('noCacheQuery' in this.options) || !this.options.noCacheQuery) {
      try {
        this.filterQuery = new Filter(this.query)
        if (this.options.filter && this.options.filter.length) {
          this.filterQuery.setBaseFilter(this.options.filter)
          this.query = this.filterQuery.toQl()
        }
      } catch (err) {
        return this.finish(err)
      }

      this.lokiQuery = new Filter(this.filterQuery.toString() + 'nwr._(properties:' + this.options.properties + ');')

      if (!boundsIsFullWorld(this.bounds)) {
        let boundsFilter
        this.output.setBounds(this.bounds)
        if (this.bounds instanceof BoundingBox) {
          if (!this.bbox) {
            boundsFilter = '(' + this.bounds.toLatLonString() + ')'
          } else {
            boundsFilter = '(' + this.bbox.toLatLonString() + ')'
          }
        } else {
          // this does not support polygons with holes
          const coords = this.bounds.geometry.coordinates[0]
            .slice(0, -1)
            .map(c => c[1] + ' ' + c[0])
            .join(' ')
          boundsFilter = '(poly:"' + coords + '")'
        }

        if (!this.options.boundsRecurseSelector || this.options.boundsRecurseSelector === 'input') {
          this.lokiQuery.setBaseFilter('nwr' + boundsFilter)
        } else if (this.options.boundsRecurseSelector === 'result') {
          const filter = this.lokiQuery.toQl({ setsUseStatementIds: true })
          const finalStatement = this.lokiQuery.getStatement()
          this.lokiQuery = new Filter(filter + 'nwr._' + finalStatement.id + boundsFilter)
        } else {
          throw new Error("RequestBBox: options boundsRecurseSelector, invalid option '" + this.options.boundsRecurseSelector + "'")
        }
      }

      this.lokiQuery = new Filter(this.lokiQuery) // TODO: get rid of this statement
      this.lokiQuery.conflate()

      this.cacheDescriptors = this.lokiQuery.cacheDescriptors().map(cacheDescriptor => {
        return {
          cache: this.overpass.bboxQueryCache.get(cacheDescriptor),
          cacheDescriptor
        }
      })

      this.doneFeaturesSets = {}
      this.doneFeaturesSetsTimestamp = 0
      this.undecidedItems = null
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
    this.undecidedItems = null

    if (this.doneFeaturesSetsTimestamp < this.overpass.cacheTimestamp) {
      this.doneFeaturesSets = {}
    }

    if (this.lokiQuery) {
      items = this.overpass.queryLokiDB(this.lokiQuery, { properties: this.options.properties }, null, this.doneFeaturesSets)
      this.undecidedItems = items.undecidedItems
    }

    for (let i = 0; i < items.length; i++) {
      if (this.options.limit && this.count >= this.options.limit) {
        this.loadFinish = true
        return
      }

      const id = items[i].id

      if (!(id in this.overpass.cacheElements)) {
        continue
      }
      const ob = this.overpass.cacheElements[id]

      if (id in this.doneFeatures) {
        continue
      }

      if ((this.options.properties & ob.properties) === this.options.properties) {
        this.receiveObject(ob)
        this.featureCallback(null, ob)
      }
    }

    if (this.options.limit && this.count >= this.options.limit) {
      this.loadFinish = true
    }

    this.doneFeaturesTimestamp = this.overpass.cacheTimestamp
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

    let minEffort = this.options.minEffort
    let maxEffort = null
    if (this.options.limit) {
      maxEffort = (this.options.limit - this.count) * this.overpass.options.effortBBoxFeature
      minEffort = Math.min(minEffort, maxEffort)
    }

    return { minEffort, maxEffort }
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

    const efforts = this.minMaxEffort()
    let effortAvailable = Math.max(context.maxEffort, efforts.minEffort)
    if (efforts.maxEffort) {
      effortAvailable = Math.min(effortAvailable, efforts.maxEffort)
    }

    let resultSetId = null
    if (this.lokiQuery) {
      this.options.properties |= this.lokiQuery.properties()
      resultSetId = this.lokiQuery.getStatement().id
    }

    const query = this.overpass.database.compile(this.lokiQuery, {
      properties: this.options.properties,
      doneFeatures: this.doneFeatures,
      statementId: resultSetId,
      context
    })

    if (!('split' in this.options)) {
      this.options.effortSplit = Math.ceil(effortAvailable / this.overpass.options.effortBBoxFeature)
    }

    const subRequest = {
      query,
      request: this,
      parts: [
        {
          filter: this.lokiQuery,
          statementId: resultSetId,
          properties: this.options.properties,
          receiveObject: this.receiveObject.bind(this),
          checkFeatureCallback: this.checkFeatureCallback.bind(this),
          featureCallback: this.featureCallback
        }
      ],
      effort: this.options.split ? this.options.split * this.overpass.options.effortBBoxFeature : effortAvailable
    }

    if (!this.lokiQuery) {
      return subRequest
    }

    const script = this.lokiQuery.getScript()
    const filter = this.lokiQuery.toQl({ setsUseStatementIds: true })
    const reverseParts = {}
    script.reverse().forEach(e => {
      e.recurse.forEach(r => {
        subRequest.query += compileRecurseReverse(r, e)
        if (!(r.id in reverseParts)) {
          reverseParts[r.id] = []
        }
        reverseParts[r.id].push({
          id: e.id,
          properties: r.properties
        })
      })
    })

    Object.entries(reverseParts).forEach(([rid, from]) => {
      const options = { properties: defines.ID_ONLY }
      from.forEach(e => {
        options.properties |= e.properties
      })

      subRequest.query += 'out count;\n(' +
        from.map(e => 'nwr._' + rid + '._rev' + e.id + '_' + rid + ';')
          .join('') + ');\n' +
        'out ' + overpassOutOptions(options) + ';'

      const statementId = this.lokiQuery.getStatement().id
      subRequest.parts.push({
        statementId: rid,
        filter: new Filter(filter + compileRecurseFilter(script, statementId, rid) + 'nwr._rev' + statementId + '_' + rid),
        properties: options.properties,
        receiveObject: this.receiveRevObject.bind(this)
      })
    })

    return subRequest
  }

  /**
   * receive an object from OverpassFrontend -> enter to cache, return to caller
   * @param {OverpassObject} ob - Object which has been received
   * @param {Request#SubRequest} subRequest - sub request which is being handled right now
   * @param {int} partIndex - Which part of the subRequest is being received
   */
  receiveObject (ob, subRequest, partIndex) {
    super.receiveObject(ob, subRequest, partIndex)
    this.doneFeatures[ob.id] = ob

    if (subRequest) {
      const statementId = subRequest.parts[partIndex].statementId
      this.doneFeaturesSets[statementId].list.push(ob)
    }
  }

  receiveRevObject (ob, subRequest, partIndex) {
    const statementId = subRequest.parts[partIndex].statementId
    this.doneFeaturesSets[statementId].list.push(ob)
  }

  checkFeatureCallback (ob) {
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
        cache.cache.add(cache.cacheDescriptor)
      })
    }

    if (this.options.limit && this.options.limit <= this.count) {
      this.loadFinish = true
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

    if (this.undecidedItems) {
      return true
    }

    return !this.cacheDescriptors || !this.cacheDescriptors.every(cache => {
      return cache.cache.check(cache.cacheDescriptor)
    })
  }

  mayFinish () {
    return !this.needLoad()
  }
}

module.exports = RequestBBox
