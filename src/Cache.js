module.exports = class Cache {
  constructor () {
    this.cache = {}
  }

  get (id, options = {}) {
    if (id in this.cache) {
      return this.cache[id].data
    }

    return undefined
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
