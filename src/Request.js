const ee = require('event-emitter')

/**
 * A compiled query
 * @typedef {Object} SubRequest
 * @property {string} query - The compiled code
 * @property {object[]} parts - An entry for each part (separated by the 'out count' separator)
 * @property {int} parts[].properties - The properties which each returned map feature has set (TAGS, BBOX, ...)
 * @property {int} effort - Supposed "effort" of this query
 * @property {Request} request - The request this compiled query belongs to
 */

/**
 * An unspecified request
 * @param {OverpassFrontend} overpass
 * @param {data} data
 */
class Request {
  constructor (overpass, data) {
    this.overpass = overpass

    for (var k in data) {
      this[k] = data[k]
    }

    this.priority = 'priority' in this.options ? this.options.priority : 0
  }

  /**
   * compile the query
   * @return {SubRequest} - the compiled query
   */
  compileQuery () {
  }

  /**
   * abort this request
   */
  abort () {
    this.aborted = true
    this.finalCallback('abort')
    this.emit('abort')
    this.overpass._abortRequest(this)
  }

  /**
   * request is finished
   * @param {Error|null} err - null if no error occured
   */
  finish (err) {
    if (!this.aborted) {
      this.finalCallback(err)
    }

    this.overpass._finishRequest(this)
  }
}

module.exports = Request
