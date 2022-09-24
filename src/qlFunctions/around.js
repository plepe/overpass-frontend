const turf = require('../turf')
const qlFunction = require('./qlFunction')

module.exports = class around extends qlFunction {
  constructor (str) {
    super()
    const s = str.split(/,/g)

    if (s.length !== 3) {
      throw new Error('around function expects "distance,latitude,longitude"')
    }

    this.value = { distance: parseFloat(s[0]), geometry: { type: 'Point', coordinates: [parseFloat(s[2]), parseFloat(s[1])] } }
  }

  test (ob) {
    const geojson = ob.GeoJSON()
    if (geojson.geometry) {
      return turf.distance(geojson, this.value.geometry, 'kilometers') < this.value.distance / 1000
    }
  }

  toString () {
    return '(around:' + this.value.distance + ',' + this.value.geometry.coordinates[1] + ',' + this.value.geometry.coordinates[0] + ')'
  }

  compileLokiJS () {
    return [null, null, true]
  }

  cacheInfo (options) {
    const bounds = this.bounds()

    const newBounds = options.bounds ? turf.intersect(options.bounds, bounds) : bounds
    if (newBounds === null) {
      options.invalid = true
    } else {
      options.bounds = newBounds.geometry
    }
  }

  isSupersetOf (other) {
    if (other instanceof around) {
      const distance = turf.distance(this.value.geometry, other.value.geometry, 'kilometers') * 1000
      return distance < this.value.distance - other.value.distance
    }

    if (other.bounds) {
      return !!turf.difference(this.bounds(), other.bounds())
    }
  }

  bounds () {
    if (!this._bounds) {
      this._bounds = turf.buffer(this.value.geometry, this.value.distance / 1000, { units: 'kilometers' })
    }

    return this._bounds
  }
}
