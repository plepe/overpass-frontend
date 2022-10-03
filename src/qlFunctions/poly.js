const turf = require('../turf')
const arrayToCoords = require('../arrayToCoords')
const qlFunction = require('./qlFunction')

module.exports = class poly extends qlFunction {
  constructor (str) {
    super()
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
    return ob.intersects(this.bounds())
  }

  toString () {
    return '(poly:"' + this.value.join(' ') + '")'
  }

  compileLokiJS () {
    return { needMatch: true }
  }

  cacheInfo (options) {
    const bounds = this.bounds()

    const newBounds = options.bounds ? turf.intersect(options.bounds, bounds) : bounds
    if (newBounds === null) {
      delete options.bounds
      options.invalid = true
    } else {
      options.bounds = newBounds.geometry
    }
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
}
