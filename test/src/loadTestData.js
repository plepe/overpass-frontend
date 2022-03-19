const OverpassFrontend = require('../../src/OverpassFrontend')
let overpassFrontend

module.exports = (callback) => {
  if (overpassFrontend) {
    return callback(null, overpassFrontend)
  }

  overpassFrontend = new OverpassFrontend('test/data.osm.bz2')
  overpassFrontend.once('load', () => callback(null, overpassFrontend))
}
