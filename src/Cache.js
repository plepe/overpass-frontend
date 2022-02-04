module.exports = class Cache {
  constructor () {
    this.cache = {}
  }

  getMeta (id, options = {}) {
    if (id in this.cache) {
      return this.cache[id].data
    }

    return null
  }

  /**
   * Get an object from the cache
   * @param {string} - ID
   * @param {options} - Options, e.g. date at which to query.
   * @returns {OverpassObject|false|null|undefined} - if an object is loaded, returns the object. If the object does not exist, returns false. If the object might exist and a query to the database server is required, return null. If the object might already be loaded and the code is waiting for further information, return undefined (no query to the database server will be done at this time).
   */
  get (id, options = {}) {
    if (id in this.cache) {
      return this.cache[id].data.get(options)
    }

    return null
  }

  has (id, options = {}) {
    return id in this.cache
  }

  add (id, data) {
    this.cache[id] = {
      data
    }

    return data
  }

  remove (id) {
    delete this.cache[id]
  }
}
