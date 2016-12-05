function OverpassRequest (overpass, data) {
  this.overpass = overpass

  for (var k in data) {
    this[k] = data[k]
  }
}

OverpassRequest.prototype.abort = function () {
  if (this.aborted) {
    console.log('already aborted', this)
    return
  }

  this.aborted = true
  return this.overpass.abortRequest(this)
}

module.exports = OverpassRequest
