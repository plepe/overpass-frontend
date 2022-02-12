const ee = require('event-emitter')
const SortedCallbacks = require('./SortedCallbacks')

/**
 * A compiled query
 * @typedef {Object} Request#SubRequest
 * @property {string} query - The compiled code
 * @property {object[]} parts - An entry for each part (separated by the 'out count' separator)
 * @property {int} parts[].properties - The properties which each returned map feature has set (TAGS, BBOX, ...)
 * @property {int} effort - Supposed "effort" of this query
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

    this.callCount = 0
    this.timestampPreprocess = 0
    this.hasUnfinished = {}
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
   * @param {OverpassObject|undefined} ob - Object which has been received
   * @param {OverpassMetaObject} ob - Meta Object which has been received
   */
  receiveObject (ob, metaOb) {
    if (ob === undefined) {
      this.hasUnfinished[metaOb.id] = true
    }
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
}

ee(Request.prototype)

module.exports = Request
