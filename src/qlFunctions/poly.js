const turf = require('../turf')
const OverpassFrontend = require('../defines')
const arrayToCoords = require('../arrayToCoords')
const qlFunction = require('./qlFunction')

module.exports = class poly extends qlFunction {
  constructor (str) {
    super()
    this.fun = 'poly'

    const m = str.match(/^\s*["']([0-9. ]*)["']\s*$/)
    if (!m) {
      throw new Error('poly function expects quoted coordinates separated by space')
    }

    const s = m[1].split(/ /g)
    if (s.length < 6 || s.length % 2 !== 0) {
      throw new Error('poly function expects minimum three pairs of coordinates')
    }

    this.value = s.map(v => parseFloat(v))
  }

  test (ob) {
    const r = ob.intersects(this.bounds())
    return r === 2 ? true : r === 0 ? false : null
  }

  toString () {
    return '(poly:"' + this.value.join(' ') + '")'
  }

  compileLokiJS () {
    return { needMatch: true }
  }

  cacheDescriptors (descriptors) {
    const bounds = this.bounds()

    descriptors.forEach(d => {
      const newBounds = d.bounds ? turf.intersect(d.bounds, bounds) : bounds
      if (newBounds === null) {
        delete d.bounds
        d.invalid = true
      } else {
        d.bounds = newBounds.geometry
        d.properties |= OverpassFrontend.GEOM
      }
    })
  }

  isSupersetOf (other) {
    if (other.bounds) {
      return !!turf.difference(this.bounds(), other.bounds())
    }
  }

  bounds () {
    if (!this._bounds) {
      const c = arrayToCoords(this.value)
      this._bounds = {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [c.concat([c[0]])]
        }
      }
    }

    return this._bounds
  }

  properties () {
    return OverpassFrontend.GEOM
  }
}
