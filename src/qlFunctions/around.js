const turf = require('../turf')
const arrayToCoords = require('../arrayToCoords')
const OverpassFrontend = require('../defines')
const qlFunction = require('./qlFunction')

module.exports = class around extends qlFunction {
  constructor (str) {
    super()
    this.fun = 'around'
    const s = str.split(/,/g)

    if (s.length < 3) {
      throw new Error('around function expects "distance,latitude,longitude[,latitude,longitude[,...]]"')
    } else if (s.length === 3) {
      this.value = { distance: parseFloat(s[0]), geometry: { type: 'Point', coordinates: [parseFloat(s[2]), parseFloat(s[1])] } }
    } else if (s.length % 2 === 1) {
      this.value = { distance: parseFloat(s[0]), geometry: { type: 'LineString', coordinates: arrayToCoords(s.slice(1).map(v => parseFloat(v))) } }
    } else {
      throw new Error('around function expects "distance,latitude,longitude[,latitude,longitude[,...]]"')
    }
  }

  test (ob) {
    const r = ob.intersects(this.bounds())
    return r === 2 ? true : r === 0 ? false : null
  }

  toString () {
    return '(around:' + this.value.distance + ',' + this.value.geometry.coordinates[1] + ',' + this.value.geometry.coordinates[0] + ')'
  }

  compileLokiJS () {
    return { needMatch: true }
  }

  cacheDescriptors (descriptors, options) {
    const bounds = this.bounds()

    descriptors.forEach(d => {
      const newBounds = d.bounds ? turf.intersect(d.bounds, bounds) : bounds
      if (newBounds === null) {
        d.invalid = true
      } else {
        d.bounds = newBounds.geometry
        d.properties |= OverpassFrontend.GEOM
      }
    })
  }

  isSupersetOf (other) {
    if (other instanceof around && this.value.geometry.type === 'Point' && other.value.geometry.type === 'Point') {
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

  properties () {
    return OverpassFrontend.GEOM
  }
}
