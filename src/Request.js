class Request {
  constructor (overpass, data) {
    this.overpass = overpass

    for (var k in data) {
      this[k] = data[k]
    }
  }

  abort () {
    return this.overpass.abortRequest(this)
  }
}

module.exports = Request
