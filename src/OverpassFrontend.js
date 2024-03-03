const ee = require('event-emitter')
const async = require('async')
const weightSort = require('weight-sort')
const BoundingBox = require('boundingbox')
const LokiJS = require('lokijs')

const httpLoad = require('./httpLoad')
const removeNullEntries = require('./removeNullEntries')

const BBoxQueryCache = require('./BBoxQueryCache')
const OverpassObject = require('./OverpassObject')
const OverpassNode = require('./OverpassNode')
const OverpassWay = require('./OverpassWay')
const OverpassRelation = require('./OverpassRelation')
const RequestGet = require('./RequestGet')
const RequestBBox = require('./RequestBBox')
const RequestMulti = require('./RequestMulti')
const defines = require('./defines')
const loadFile = require('./loadFile')
const copyOsm3sMetaFrom = require('./copyOsm3sMeta')
const timestamp = require('./timestamp')
const Filter = require('./Filter')
const isGeoJSON = require('./isGeoJSON')
const boundsIsFullWorld = require('./boundsIsFullWorld')
const isFileURL = require('./isFileURL')

/**
 * An error occured
 * @event OverpassFrontend#error
 * @param {Error} error
 * @param {OverpassFrontend#Context} [context] - context of the request
 */

/**
 * A request to Overpass API is started
 * @event OverpassFrontend#start
 * @param {object} reserved
 * @param {OverpassFrontend#Context} context - context of the request
 */

/**
 * A request to Overpass API was rejected
 * @event OverpassFrontend#reject
 * @param {OverpassFrontend#QueryStatus} queryStatus
 * @param {OverpassFrontend#Context} context - context of the request
 */

/**
 * Status of a query to Overpass API
 * @typedef {Object} OverpassFrontend#QueryStatus
 * @property {int} [status] - result status (e.g. 429 for reject, ...)
 * @property {int} [errorCount] - the nth error in a row
 * @property {boolean} [retry] - true, if the request will be retried (after a 429 error)
 * @property {int} [retryTimeout] - if the query will be retried, the next request will be delayed for n ms
 */

/**
 * When a file is specified as URL, this event notifies, that the file has been completely loaded. When a Overpass API is used, every time when data has been received.
 * @event OverpassFrontend#load
 * @param {object} osm3sMeta Meta data (not all properties of meta data might be set)
 * @param {number} osm3sMeta.version OpenStreetMap API version (currently 0.6)
 * @param {string} osm3sMeta.generator Data generator
 * @param {string} osm3sMeta.timestamp_osm_base RFC8601 timestamp of OpenStreetMap data
 * @param {string} osm3sMeta.copyright Copyright statement
 * @param {BoundingBox} [osm3sMeta.bounds] Bounding Box (only when loading from file)
 * @param {OverpassFrontend#Context} [context] - context of the request
 */

/**
 * When an object is updated (e.g. when loaded; additional information loaded; when a member object got loaded)
 * @event OverpassFrontend#update
 * @param {OverpassNode|OverpassWay|OverpassRelation} object The object which got updated.
 */

/**
 * A connection to an Overpass API Server or an OpenStreetMap file
 * @param {string} url The URL of the API, e.g. 'https://overpass-api.de/api/'. If you omit the protocol, it will use the protocol which is in use for the current page (or https: on nodejs): '//overpass-api.de/api/'. If the url ends in .json, .osm or .osm.bz2 it will load this OpenStreetMap file and use the data from there.
 * @param {object} options Options
 * @param {boolean} [options.isFile] true, if the URL is a file; false if the URL points to an Overpass API server. if unset, will be autodetected.
 * @param {string} [options.fileFormat] force file format; if undefined, auto-detect.
 * @param {object} [options.fileFormatOptions] options for the file format parser.
 * @param {number} [options.count=0] Only return a maximum of count items. If count=0, no limit is used (default).
 * @param {number} [options.effortPerRequest=1000] To avoid huge requests to the Overpass API, the request will be split into smaller chunks. This value defines, how many objects will be requested per API call (for get() calls see effortNode, effortWay, effortRelation, e.g. up to 1000 nodes or 250 ways or (500 nodes and 125 ways) at default values; for BBoxQuery() calls the setting will be divided by 4).
 * @param {number} [options.effortNode=1] The effort for request a node. Default: 1.
 * @param {number} [options.effortWay=4] The effort for request a way.
 * @param {number} [options.effortRelation=64] The effort for request a relation.
 * @param {number} [options.effortBBoxFeature=4] The effort for requesting an item in a BboxQuery.
 * @param {number} [options.timeGap=10] A short time gap between two requests to the Overpass API (milliseconds).
 * @param {number} [options.timeGap429=500] A longer time gap after a 429 response from Overpass API (milliseconds).
 * @param {number} [options.timeGap429Exp=3] If we keep getting 429 responses, increase the time exponentially with the specified factor (e.g. 2: 500ms, 1000ms, 2000ms, ...; 3: 500ms, 1500ms, 4500ms, ...)
 * @param {number} [options.loadChunkSize=1000] When loading a file (instead connecting to an Overpass URL) load elements in chunks of n items.
 * @property {boolean} hasStretchLon180=false Are there any map features in the cache which stretch over lon=180/-180?
 */
class OverpassFrontend {
  constructor (url, options) {
    this.url = url
    this.options = {
      effortPerRequest: 1000,
      effortNode: 1,
      effortWay: 4,
      effortRelation: 64,
      effortBBoxFeature: 4,
      timeGap: 10,
      timeGap429: 500,
      timeGap429Exp: 3,
      loadChunkSize: 1000
    }
    for (const k in options) {
      this.options[k] = options[k]
    }

    const db = new LokiJS()
    this.db = db.addCollection('osm', { unique: ['id'] })

    this.clearCache()

    this.requests = []
    this.requestIsActive = false
    this.errorCount = 0

    this.pendingNotifyMemberUpdate = {}
    this.pendingUpdateEmit = {}

    if (this.options.isFile ?? isFileURL(this.url)) {
      this.options.isFile = true
      this.ready = false
      this._loadFile()
    } else {
      this.options.isFile = false
      this.ready = true
    }
  }

  /**
   * clear all caches
   */
  clearCache () {
    if (this.options.isFile) {
      return
    }

    this.cacheElements = {}
    this.cacheElementsMemberOf = {}
    this.cacheTimestamp = timestamp()
    this.db.clear()
    BBoxQueryCache.clear()

    // Set default properties
    this.hasStretchLon180 = false
  }

  _loadFile () {
    loadFile(this.url, (err, content) => {
      if (err) {
        console.log('Error loading file', err)
        return this.emit('error', err)
      }

      let handler
      if (this.options.fileFormat) {
        handler = OverpassFrontend.fileFormats.filter(format => format.id === this.options.fileFormat)
      } else {
        handler = OverpassFrontend.fileFormats.filter(format => format.willLoad(this.url, content, this.options.fileFormatOptions ?? {}))
      }

      if (!handler.length) {
        console.log('No file format handler found')
        return this.emit('error', 'No file format handler found')
      }

      handler = handler[0]

      handler.load(content, this.options.fileFormatOptions ?? {}, (err, result) => {
        if (err) {
          console.log('Error loading file with handler ' + handler.id, err)
          return this.emit('error', 'Error loading file with handler ' + handler.id + ': ' + err.message)
        }

        this._loadFileContent(result)
      })
    })
  }

  _loadFileContent (result) {
    const osm3sMeta = copyOsm3sMetaFrom(result)

    const chunks = []
    for (let i = 0; i < result.elements.length; i += this.options.loadChunkSize) {
      chunks.push(result.elements.slice(i, i + this.options.loadChunkSize))
    }

    // collect all objects, so they can be completed later-on
    const obs = []
    async.eachLimit(
      chunks,
      1,
      (chunk, done) => {
        chunk.forEach(
          (element) => {
            const ob = this.createOrUpdateOSMObject(element, {
              osm3sMeta,
              properties: OverpassFrontend.TAGS | OverpassFrontend.META | OverpassFrontend.MEMBERS
            })

            obs.push(ob)
          }
        )

        global.setTimeout(done, 0)
      },
      (err) => {
        this.pendingNotifies()

        // Set objects to fully known, as no more data can be loaded from the file
        obs.forEach(ob => {
          ob.properties |= OverpassFrontend.ALL
          if (osm3sMeta.bounds) {
            osm3sMeta.bounds.extend(ob.bounds)
          } else {
            osm3sMeta.bounds = new BoundingBox(ob.bounds)
          }
        })

        if (err) {
          console.log('Error loading file', err)
          return this.emit('error', err)
        }

        this.emit('load', osm3sMeta)

        this.ready = true
        this._overpassProcess()
      }
    )
  }

  /**
   * @param {string|string[]} ids - Id or array of Ids of OSM map features, e.g. [ 'n123', 'w2345', 'n123' ]. Illegal IDs will not produce an error but generate a 'null' object.
   * @param {object} options Various options, see below
   * @param {number} [options.priority=0] - Priority for loading these objects. The lower the sooner they will be requested.
   * @param {string|boolean} [options.sort=false] - When set to true or "index", the function featureCallback will be called in order of the "ids" array. When set to false or null, the featureCallback will be called as soon as the object is loaded (e.g. immediately, if it is cached). When set to "BBoxDiagonalLength", the objects are ordered by the length of the diagonal of the bounding box.
   * @param {"asc"|"desc"} [options.sortDir="asc"] Sort direction.
   * @param {BoundingBox|GeoJSON} [options.bounds] - Only return items which intersect these bounds. Boundaries is a BoundingBox, or a Leaflet Bounds object (e.g. from map.getBounds()) or a GeoJSON Polygon/Multipolygon.
   * @param {boolean} [options.members=false] Query relation members of. Default: false
   * @param {function} [options.memberCallback] For every member, call this callback function. (Requires options.members=true)
   * @param {bit_array} [options.memberProperties] Which properties should be loaded for the members. Default: OverpassFrontend.TAGS | OverpassFrontend.MEMBERS | OverpassFrontend.BBOX
   * @param {BoundingBox|GeoJSON} [options.memberBounds] - Only return members which intersect these bounds. Boundaries is a BoundingBox, or a Leaflet Bounds object (e.g. from map.getBounds()) or a GeoJSON Polygon/Multipolygon.
   * @param {function} featureCallback Will be called for each object which is passed in parameter 'ids'. Will be passed: 1. err (if an error occured, otherwise null), 2. the object or null, 3. index of the item in parameter ids.
   * @param {function} finalCallback Will be called after the last feature. Will be passed: 1. err (if an error occured, otherwise null).
   * @return {RequestGet}
   */
  get (ids, options, featureCallback, finalCallback) {
    const request = new RequestGet(this, {
      ids: ids,
      options: options,
      featureCallback: featureCallback,
      finalCallback: finalCallback
    })

    this.requests.push(request)

    this._next()

    return request
  }

  /**
   * return an OSM object, if it is already in the cache
   * @param {string} id - Id of an OSM map feature
   * @param {object} options
   * @param {int} [options.properties] - Which properties have to be known (default: OverpassFrontend.DEFAULT)
   * @return {null|false|OverpassObject} - null: does not exist in the database; false: may exist, but has not been loaded yet (or not enough properties known); OverpassObject: sucessful object
   */
  getCached (id, options) {
    if (typeof options === 'undefined') {
      options = {}
    }

    if (typeof options.properties === 'undefined') {
      options.properties = defines.DEFAULT
    }

    if (!(id in this.cacheElements)) {
      return false
    }

    const ob = this.cacheElements[id]

    if (ob.missingObject) {
      return null
    }

    if ((options.properties & ob.properties) !== options.properties) {
      return false
    }

    return ob
  }

  /**
   * Current request context
   * @typedef {Object} OverpassFrontend#Context
   * @property {string} query - The compiled code of all sub requests
   * @property {string} queryOptions - The compiled queryOptions which will be sent to Overpass API
   * @property {Request[]} requests - List of all requests in the context
   * @property {Request#SubRequest[]} subRequests - List of all subRequests in the context
   * @property {BoundingBox} bbox - when there are any BBox requests, add this global bbox
   * @property {int} maxEffort - how many queries can we still add to this context
   * @property {object} todo - list of items which should be loaded via get requests to avoid duplicates
   */

  _overpassProcess () {
    // currently active - we'll come back later :-)
    if (!this.ready) {
      return
    }

    // preprocess all requests
    // e.g. call featureCallback for elements which were received in the
    // meantime
    this.requests.forEach((request, i) => {
      if (request && request.timestampPreprocess < this.cacheTimestamp) {
        request.preprocess()
        request.timestampPreprocess = this.cacheTimestamp

        if (request.finished) {
          this.requests[i] = null
        } else if (request.mayFinish() || this.options.isFile) {
          request.finish()
        }
      }
    })
    this.requests = removeNullEntries(this.requests)

    // currently active - we'll come back later :-)
    if (this.requestIsActive || !this.ready) {
      return
    }

    // nothing todo ...
    if (!this.requests.length) {
      return
    }

    // now order all requests by priority
    this.requests = weightSort(this.requests, 'priority')

    this.requestIsActive = true
    let request
    let j

    const context = {
      bbox: null,
      todo: {},
      requests: [],
      subRequests: [],
      query: '',
      minPriority: this.requests[0].priority,
      minEffort: 0,
      maxEffort: 0
    }

    for (j = 0; j < this.requests.length; j++) {
      request = this.requests[j]

      if (request.priority > context.minPriority &&
         (context.maxEffort === null || context.maxEffort > this.options.effortPerRequest)) {
        break
      }

      if (request.willInclude(context)) {
        const { minEffort, maxEffort } = request.minMaxEffort()

        if (context.minEffort > 0 && context.minEffort + minEffort > this.options.effortPerRequest) {
          continue
        }

        context.minEffort += minEffort
        if (maxEffort === null) {
          context.maxEffort = null
        } else if (context.maxEffort !== null) {
          context.maxEffort += maxEffort
        }

        context.requests.push(request)
      }
    }

    let effortAvailable = this.options.effortPerRequest

    for (j = 0; j < context.requests.length; j++) {
      request = context.requests[j]
      const remainingRequestsAtPriority = context.requests.slice(j).filter(r => r.priority === request.priority)
      context.maxEffort = Math.ceil(effortAvailable / remainingRequestsAtPriority.length)
      const subRequest = request.compileQuery(context)

      if (subRequest.parts.length === 0) {
        console.log('subRequest has no parts! Why was willInclude true?', subRequest)
        continue
      }

      context.subRequests.push(subRequest)

      if (context.query !== '') {
        context.query += '\nout count;\n'
      }

      effortAvailable -= subRequest.effort
      context.query += subRequest.query

      if (effortAvailable <= 0) {
        break
      }
    }

    if (context.query === '') {
      return this._next()
    }

    context.queryOptions = '[out:json]'
    if (context.bbox && !boundsIsFullWorld(context.bbox)) {
      context.queryOptions += '[bbox:' + context.bbox.toLatLonString() + ']'
    }

    const query = context.queryOptions + ';\n' + context.query

    setTimeout(function () {
      httpLoad(
        this.url,
        null,
        query,
        this._handleResult.bind(this, context)
      )

      this.emit('start', {}, context)
    }.bind(this), this.options.timeGap)
  }

  _handleResult (context, err, results) {
    this.requestIsActive = false

    if (err === null && results.remark) {
      err = results.remark
    }

    const status = {}

    if (err !== null) {
      this.errorCount++

      status.status = err.status
      status.errorCount = this.errorCount

      if (this.errorCount <= 3) {
        // retry
        if (err.status === 429) {
          this.requestIsActive = true
          const timeGap = this.options.timeGap429Exp ** (this.errorCount - 1) * this.options.timeGap429

          status.retry = true
          status.retryTimeout = timeGap
          this.emit('reject', status, context)

          global.setTimeout(() => {
            this.requestIsActive = false
            this._overpassProcess()
          }, timeGap - this.options.timeGap)
        } else {
          this.emit('error', err, context)

          this._overpassProcess()
        }
      } else {
        if (err.status === 429) {
          status.retry = false

          this.emit('reject', status, context)
        }

        this.emit('error', status, context)

        // abort
        // call finalCallback for the request
        context.subRequests.forEach(function (subRequest) {
          subRequest.request.finish(err)
        })
      }

      return
    }

    this.errorCount = 0

    const osm3sMeta = copyOsm3sMetaFrom(results)
    this.emit('load', osm3sMeta, context)

    let subRequestsIndex = 0
    let partIndex = 0
    let subRequest = context.subRequests[0]
    let request = subRequest.request
    let part = subRequest.parts[0]
    if (!('count' in part)) {
      part.count = 0
    }

    for (let i = 0; i < results.elements.length; i++) {
      const el = results.elements[i]

      if (isSeparator(el)) {
        partIndex++

        if (partIndex >= subRequest.parts.length) {
          request.finishSubRequest(subRequest)

          if (request.mayFinish() && !request.finished) {
            request.finish()
          }

          subRequestsIndex++
          partIndex = 0
          subRequest = context.subRequests[subRequestsIndex]
          request = subRequest.request
          part = subRequest.parts[0]
          if (!('count' in part)) {
            part.count = 0
          }
        } else {
          part = subRequest.parts[partIndex]
        }

        continue
      }

      part.osm3sMeta = osm3sMeta
      const ob = this.createOrUpdateOSMObject(el, part)
      delete context.todo[ob.id]

      const members = this.cacheElements[ob.id].memberIds()
      if (members) {
        for (let j = 0; j < members.length; j++) {
          if (!(members[j] in this.cacheElementsMemberOf)) {
            this.cacheElementsMemberOf[members[j]] = [this.cacheElements[ob.id]]
          } else {
            this.cacheElementsMemberOf[members[j]].push(this.cacheElements[ob.id])
          }
        }
      }

      part.count++
      if (part.receiveObject) {
        part.receiveObject(ob)
      }
      if (!request.aborted && !request.finished && part.featureCallback && (!part.checkFeatureCallback || part.checkFeatureCallback(ob, part))) {
        part.featureCallback(err, ob)
      }
    }

    if (!(subRequestsIndex === context.subRequests.length - 1 || partIndex === context.subRequests[subRequestsIndex].parts.length - 1)) {
      console.log('too many parts!!!!')
    }

    for (const id in context.todo) {
      if (!(id in this.cacheElements)) {
        const ob = new OverpassObject()
        ob.id = id
        ob.type = { n: 'node', w: 'way', r: 'relation' }[id.substr(0, 1)]
        ob.osm_id = id.substr(1)
        ob.properties = OverpassFrontend.ALL
        ob.missingObject = true
        this.cacheElements[id] = ob
        this.db.insert(ob.dbInsert())
      } else {
        const ob = this.cacheElements[id]
        ob.missingObject = true
        this.db.update(ob.dbInsert())
      }
    }

    this.cacheTimestamp = timestamp()

    this.pendingNotifies()

    request.finishSubRequest(subRequest)

    this._next()
  }

  /**
   * @param {string} query - Query for requesting objects from Overpass API, e.g. "node[amenity=restaurant]" or "(node[amenity];way[highway~'^(primary|secondary)$];)". See <a href='Filter.html'>Filter</a> for details.
   * @param {BoundingBox|GeoJSON} bounds - Boundaries where to load objects, can be a BoundingBox object, Leaflet Bounds object (e.g. from map.getBounds()) or a GeoJSON Polygon/Multipolygon.
   * @param {object} options
   * @param {number} [options.limit=0] - Limit count of results. If 0, no limit will be used.
   * @param {number} [options.priority=0] - Priority for loading these objects. The lower the sooner they will be requested.
   * @param {boolean|string} [options.sort=false] - If false, it will be called as soon as the features are availabe (e.g. immediately when cached).
   * @param {bit_array} [options.properties] Which properties of the features should be downloaded: OVERPASS_ID_ONLY, OVERPASS_BBOX, OVERPASS_TAGS, OVERPASS_GEOM, OVERPASS_META. Combine by binary OR: ``OVERPASS_ID | OVERPASS_BBOX``. Default: OverpassFrontend.TAGS | OverpassFrontend.MEMBERS | OverpassFrontend.BBOX
   * @param {number} [options.split=0] If more than 'split' elements would be returned, split into several smaller requests, with 'split' elements each. Default: 0 (do not split)
   * @param {boolean} [options.members=false] Query relation members of. Default: false
   * @param {function} [options.memberCallback] For every member, call this callback function. (Requires options.members=true)
   * @param {bit_array} [options.memberProperties] Which properties should be loaded for the members. Default: OverpassFrontend.TAGS | OverpassFrontend.MEMBERS | OverpassFrontend.BBOX
   * @param {BoundingBox|GeoJSON} [options.memberBounds] - Only return members which intersect these bounds. Boundaries is a BoundingBox, or a Leaflet Bounds object (e.g. from map.getBounds()) or a GeoJSON Polygon/Multipolygon.
   * @param {number} [options.memberSplit=0] If more than 'memberSplit' member elements would be returned, split into smaller requests (see 'split'). 0 = do not split.
   * @param {string|Filter} [options.filter] Additional filter.
   * @param {boolean} [options.noCacheQuery=false] If true, the local cache will not be queried
   * @param {function} featureCallback Will be called for each matching object. Will be passed: 1. err (if an error occured, otherwise null), 2. the object or null.
   * @param {function} finalCallback Will be called after the last feature. Will be passed: 1. err (if an error occured, otherwise null).
   * @return {RequestBBox}
   */
  BBoxQuery (query, bounds, options, featureCallback, finalCallback) {
    let request
    const bbox = new BoundingBox(bounds)

    if (!isGeoJSON(bounds)) {
      bounds = bbox
    }

    if (bbox.minlon > bbox.maxlon) {
      const bbox1 = new BoundingBox(bbox)
      bbox1.maxlon = 180
      const bbox2 = new BoundingBox(bbox)
      bbox2.minlon = -180

      request = new RequestMulti(this,
        {
          featureCallback: featureCallback,
          finalCallback: finalCallback
        }, [
          new RequestBBox(this, {
            query: query,
            bbox: bbox1,
            bounds: bounds,
            options: options,
            doneFeatures: {}
          }),
          new RequestBBox(this, {
            query: query,
            bbox: bbox2,
            bounds: bounds,
            options: options,
            doneFeatures: {}
          })
        ]
      )
    } else {
      request = new RequestBBox(this, {
        query: query,
        bbox: bbox,
        bounds: bounds,
        options: options,
        doneFeatures: {},
        featureCallback: featureCallback,
        finalCallback: finalCallback
      })
    }

    this.requests.push(request)

    this._next()

    return request
  }

  clearBBoxQuery (query) {
    const cacheDescriptors = new Filter(query).cacheDescriptors()

    cacheDescriptors.forEach(id => {
      BBoxQueryCache.get({ id }).clear()
    })
  }

  _abortRequest (request) {
    const p = this.requests.indexOf(request)

    if (p === -1) {
      return
    }

    this.requests[p] = null
  }

  _finishRequest (request) {
    const p = this.requests.indexOf(request)
    if (p >= 0) {
      this.requests[p] = null
    }
  }

  _next () {
    async.setImmediate(function () {
      this._overpassProcess()
    }.bind(this))
  }

  abortAllRequests () {
    for (let j = 0; j < this.requests.length; j++) {
      if (this.requests[j] === null) {
        continue
      }

      this.requests[j].abort()
    }

    this.requests = []
    this.requestIsActive = false
  }

  removeFromCache (ids) {
    if (typeof ids === 'string') {
      ids = [ids]
    }

    for (let i = 0; i < ids.length; i++) {
      if (ids[i] in this.cacheElements) {
        const ob = this.cacheElements[ids[i]]

        // remove all memberOf references
        if (ob.members) {
          ob.members.forEach(member => {
            const memberOb = this.cacheElements[member.id]
            memberOb.memberOf = memberOb.memberOf
              .filter(memberOf => memberOf.id !== ob.id)
          })
        }

        const lokiOb = this.cacheElements[ids[i]].dbData
        delete this.cacheElements[ids[i]]
        this.db.remove(lokiOb)
      }
    }
  }

  notifyMemberUpdates () {
    const todo = this.pendingNotifyMemberUpdate
    this.pendingNotifyMemberUpdate = {}

    for (const k in todo) {
      const ob = this.cacheElements[k]
      ob.notifyMemberUpdate(todo[k])

      this.pendingUpdateEmit[ob.id] = ob
    }
  }

  pendingNotifies () {
    this.notifyMemberUpdates()

    const todo = Object.values(this.pendingUpdateEmit)
    this.pendingUpdateEmit = {}

    todo.forEach(ob => {
      ob.emit('update', ob)
      this.db.update(ob.dbInsert())
    })
  }

  createOrUpdateOSMObject (el, options) {
    const id = el.type.substr(0, 1) + el.id
    let ob = null
    let create = true

    if (id in this.cacheElements && !this.cacheElements[id]) {
      console.log('why can this be null?', id)
    }

    if (id in this.cacheElements && this.cacheElements[id]) {
      ob = this.cacheElements[id]
      create = false

      // no new information -> return
      if (~ob.properties & options.properties === 0) {
        return ob
      }
    } else if (el.type === 'relation') {
      ob = new OverpassRelation(id)
    } else if (el.type === 'way') {
      ob = new OverpassWay(id)
    } else if (el.type === 'node') {
      ob = new OverpassNode(id)
    } else {
      ob = new OverpassObject(id)
    }

    ob.overpass = this
    ob.updateData(el, options)

    ob.memberOf.forEach(entry => {
      if (entry.id in this.pendingNotifyMemberUpdate) {
        this.pendingNotifyMemberUpdate[entry.id].push(ob)
      } else {
        this.pendingNotifyMemberUpdate[entry.id] = [ob]
      }
    })
    this.pendingUpdateEmit[ob.id] = ob

    if (create) {
      this.db.insert(ob.dbInsert())
    } else {
      this.db.update(ob.dbInsert())
    }

    this.cacheElements[id] = ob
    return ob
  }

  regexpEscape (str) {
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
}

OverpassFrontend.fileFormats = [
  require('./fileFormatOSMXML'),
  require('./fileFormatOSMJSON')
]

for (const k in defines) {
  OverpassFrontend[k] = defines[k]
}

function isSeparator (el) {
  return ('count' in el || ('type' in el && el.type === 'count'))
}

ee(OverpassFrontend.prototype)

OverpassFrontend.Filter = Filter

module.exports = OverpassFrontend
