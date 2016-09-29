function OverpassRequest (overpass, data) {
  this.overpass = overpass

  for (var k in data) {
    this[k] = data[k]
  }
}

module.exports = OverpassRequest
