const ee = require('event-emitter')
const SortedCallbacks = require('./SortedCallbacks')

/**
 * A compiled query
 * @typedef {Object} Request#SubRequest
 * @property {string} query - The compiled code
 * @property {object[]} parts - An entry for each part (separated by the 'out count' separator)
 * @property {int} parts[].properties - The properties which each returned map feature has set (TAGS, BBOX, ...)
 * @property {int} effort - Supposed "effort" of this query
 * @property {int} count - Count of discovered items
 * @property {Request} request - The request this compiled query belongs to
 */

/**
 * An unspecified request
 * @param {OverpassFrontend} overpass
 * @param {object} options
 */
class Request {
  constructor (overpass, data) {
    this.overpass = overpass

    for (const k in data) {
      this[k] = data[k]
    }

    if (!this.options) {
      this.options = {}
    }

    this.priority = 'priority' in this.options ? this.options.priority : 0

    const callbacks = new SortedCallbacks(this.options, this.featureCallback, this.finalCallback)
    this.featureCallback = callbacks.next.bind(callbacks)
    this.finalCallback = callbacks.final.bind(callbacks)

    this.count = 0
    this.callCount = 0
    this.timestampPreprocess = 0
  }

  /**
   * Request got aborted
   * @event Request#abort
   */

  /**
   * abort this request
   */
  abort () {
    this.aborted = true
    this.emit('abort')
    this.overpass._abortRequest(this)
  }

  /**
   * Request is finished
   * @event Request#finish
   * @param {Error|null} - null if no error occured
   */

  /**
   * request is finished
   * @param {Error|null} err - null if no error occured
   */
  finish (err) {
    if (!this.aborted) {
      this.finalCallback(err)
    }

    this.overpass._finishRequest(this)
    this.finished = true
    this.emit('finish', err)
  }

  /**
   * shall this Request be included in the current call?
   * @param {OverpassFrontend#Context} context - Current context
   * @return {boolean} - yes|no
   */
  willInclude (context) {
    return true
  }

  /**
   * @typedef {Object} Request#minMaxEffortResult
   * @property {number} Remaining minimal effort of this request
   * @property {number|null} Remaining maximum effort (or null if unknown)
   */

  /**
   * how much effort can a call to this request use
   * @return {Request#minMaxEffortResult} - minimum and maximum effort
   */
  minMaxEffort () {
    return { minEffort: 0, maxEffort: 0 }
  }

  /**
   * SubRequest got compiled
   * @event Request#subrequest-compiile
   * @param {Request#SubRequest} subRequest - the sub request
   */

  /**
   * compile the query
   * @param {OverpassFrontend#Context} context - Current context
   * @return {Request#SubRequest} - the compiled query
   */
  compileQuery (context) {
    const subRequest = this._compileQuery(context)
    this.emit('subrequest-compile', subRequest)

    this.callCount++

    return subRequest
  }

  /**
   * receive an object from OverpassFronted -> enter to cache, return to caller
   * @param {OverpassObject} ob - Object which has been received
   * @param {Request#SubRequest} subRequest - sub request which is being handled right now
   * @param {int} partIndex - Which part of the subRequest is being received
   */
  receiveObject (ob) {
    this.count++
  }

  /**
   * SubRequest got finished
   * @event Request#subrequest-finished
   * @param {Request#SubRequest} subRequest - the sub request
   */

  /**
   * the current subrequest is finished -> update caches, check whether request is finished
   * @param {Request#SubRequest} subRequest - the current sub request
   */
  finishSubRequest (subRequest) {
    this.emit('subrequest-finish', subRequest)
  }

  /**
   * Export objects (and members) as OpenStreetMap XML
   * @param object options Options
   * @param {bit_array} [options.properties=OverpassFrontend.DEFAULT_EXPORT] Which properties of the features should be exported: OverpassFrontend.ID_ONLY, OverpassFrontend.BBOX, OverpassFrontend.TAGS, OverpassFrontend.GEOM, OverpassFrontend.META, OverpassFrontend.EMBED_GEOM. Combine by binary OR: ``OverpassFrontend.ID | OverpassFrontend.BBOX``. Default: OverpassFrontend.TAGS | OverpassFrontend.META | OverpassFrontend.MEMBERS | OverpassFrontend.GEOM
   * @param DOMNode parentNode a DOM Node where the object will be appended as child. Depending on object type and options, member objects will also be appended on the same level.
   * @param function callback Function which will be called with (err)
   */
  exportOSMXML (options, parentNode, callback) {
    if (this.finished) {
      this._exportOSMXML(options, parentNode, callback)
    } else {
      this.once('finish', () => this._exportOSMXML(options, parentNode, callback))
    }
  }

  _exportOSMXML (options, parentNode, callback) {
    callback(null)
  }

  /**
   * Export objects (and members) as OpenStreetMap JSON
   * @param object options Options
   * @param {bit_array} [options.properties=OverpassFrontend.DEFAULT_EXPORT] Which properties of the features should be exported: OverpassFrontend.ID_ONLY, OverpassFrontend.BBOX, OverpassFrontend.TAGS, OverpassFrontend.GEOM, OverpassFrontend.META, OverpassFrontend.EMBED_GEOM. Combine by binary OR: ``OverpassFrontend.ID | OverpassFrontend.BBOX``. Default: OverpassFrontend.TAGS | OverpassFrontend.META | OverpassFrontend.MEMBERS | OverpassFrontend.GEOM
   * @param DOMNode parentNode a DOM Node where the object will be appended as child. Depending on object type and options, member objects will also be appended on the same level.
   * @param function callback Function which will be called with (err)
   */
  exportOSMJSON (options, result, callback) {
    if (this.finished) {
      this._exportOSMJSON(options, result, callback)
    } else {
      this.once('finish', () => this._exportOSMJSON(options, result, callback))
    }
  }

  _exportOSMJSON (options, result, callback) {
    callback(null)
  }
}

ee(Request.prototype)

module.exports = Request
