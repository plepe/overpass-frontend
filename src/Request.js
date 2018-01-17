/**
 * A compiled query
 * @typedef {Object} CompiledQuery
 * @property {string} query The compiled code
 * @property {object[]} parts An entry for each part (separated by the 'out count' separator)
 * @property {int} parts[].properties The properties which each returned map feature has set (TAGS, BBOX, ...)
 * @property {int} effort Supposed "effort" of this query
 */
class Request {
  constructor (overpass, data) {
    this.overpass = overpass

    for (var k in data) {
      this[k] = data[k]
    }
  }

  /**
   * compile the query
   * @return {CompiledQuery} the compiled query
   */
  compileQuery () {
  }

  abort () {
    return this.overpass.abortRequest(this)
  }

  finish (err) {
    if (!this.aborted) {
      this.finalCallback(err)
    }

    this.overpass._finishRequest(this)
  }
}

module.exports = Request
