function OverpassRequest (overpass, data) {
  this.overpass = overpass

  for (var k in data) {
    this[k] = data[k]
  }
}

OverpassRequest.prototype.abort = function () {
  return this.overpass.abortRequest(this)
}

module.exports = OverpassRequest
