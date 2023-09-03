const BoundingBox = require('boundingbox')
const Request = require('./Request')
const overpassOutOptions = require('./overpassOutOptions')
const defines = require('./defines')
const BBoxQueryCache = require('./BBoxQueryCache')
const RequestBBoxMembers = require('./RequestBBoxMembers')
const Filter = require('./Filter')
const boundsToLokiQuery = require('./boundsToLokiQuery')
const boundsIsFullWorld = require('./boundsIsFullWorld')
const compileRecurseReverse = require('./compileRecurseReverse')

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
          this.filterQuery = new Filter(this.query)
          this.filterQuery.setBaseFilter(this.options.filter)
          this.query = this.filterQuery.toQl()
        } else {
          this.filterQuery = new Filter(this.query)
        }
      } catch (err) {
        return this.finish(err)
      }

      this.lokiQuery = new Filter(this.filterQuery)

      if (!boundsIsFullWorld(this.bounds)) {
        if (this.bounds instanceof BoundingBox) {
          this.lokiQuery.setBaseFilter('nwr(' + this.bbox.toLatLonString() + ')')
        } else {
          // this does not support polygons with holes
          const coords = this.bounds.geometry.coordinates[0]
            .slice(0, -1)
            .map(c => c[1] + ' ' + c[0])
            .join(' ')
          this.lokiQuery.setBaseFilter('nwr(poly:"' + coords + '")')
        }
      }

      const cacheFilter = new Filter({ and: [this.filterQuery, new Filter('nwr(properties:' + this.options.properties + ')')] })
      this.options.properties = cacheFilter.properties()

      this.cacheDescriptors = cacheFilter.cacheDescriptors().map(cacheDescriptors => {
        return {
          cache: BBoxQueryCache.get(this.overpass, cacheDescriptors.id),
          cacheDescriptors
        }
      })

      this.doneFeaturesSets = {}
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
      items = this.overpass.queryLokiDB(this.lokiQuery, { properties: this.options.properties }, null, this.doneFeaturesSets)
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

    let query; let resultSet = '.result'; let resultSetId = null

    // if the context already has a bbox and it differs from this, we can't add
    // ours
    if (this.lokiQuery) {
      query = this.lokiQuery.toQl({ setsUseStatementIds: true }) + '\n'
      resultSetId = this.lokiQuery.getStatement().id
      resultSet = resultSetId ? '._' + resultSetId : '.result'
    } else {
      query = this.query.substr(0, this.query.length - 1) + '->.result;\n'
    }

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
      query += '(' + resultSet + '; - .done;)->' + resultSet + ';\n'
    }

    if (!('split' in this.options)) {
      this.options.effortSplit = Math.ceil(effortAvailable / this.overpass.options.effortBBoxFeature)
    }
    query += resultSet + ' out ' + overpassOutOptions(this.options) + ';\n'

    const subRequest = {
      query,
      request: this,
      parts: [
        {
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
    const reverseParts = {}
    script.reverse().forEach(e => {
      e.recurse.forEach(r => {
        subRequest.query += compileRecurseReverse(r, e)
        if (!(r.id in reverseParts)) {
          reverseParts[r.id] = []
        }
        reverseParts[r.id].push({
          id: e.id,
          properties: defines.MEMBERS
        })
      })
    })

    Object.entries(reverseParts).forEach(([rid, from]) => {
      const options = { properties: defines.ID_ONLY }
      from.forEach(e => {
        options.properties |= e.properties
      })

      options.properties |= defines.ALL // TODO: load only necessary properties for the requested recurse type
      subRequest.query += 'out count;\n(' +
        from.map(e => 'nwr._' + rid + '._rev' + e.id + '_' + rid + ';')
          .join('') + ');\n' +
        'out ' + overpassOutOptions(options) + ';'

      subRequest.parts.push({
        statementId: rid,
        properties: options.properties,
        receiveObject: this.receiveRevObject.bind(this)
      })
    })

    return subRequest
  }

  /**
   * receive an object from OverpassFronted -> enter to cache, return to caller
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
        cache.cache.add(this.bbox, cache.cacheDescriptors)
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

    return !this.cacheDescriptors || !this.cacheDescriptors.every(cache => {
      return cache.cache.check(this.bbox, cache.cacheDescriptors)
    })
  }

  mayFinish () {
    return !this.needLoad()
  }
}

module.exports = RequestBBox
