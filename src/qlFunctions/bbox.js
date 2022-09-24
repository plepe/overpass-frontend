const turf = require('../turf')

const BoundingBox = require('boundingbox')

const qlFunction = require('./qlFunction')

module.exports = class bbox extends qlFunction {
  constructor (str) {
    super()
    let s = str.split(/,/g)

    if (s.length !== 4) {
      throw new Error('bbox function expects "latitude,longitude,latitude,longitude"')
    }

    s = s.map(v => parseFloat(v))

    this.value = new BoundingBox({
      minlat: s[0],
      minlon: s[1],
      maxlat: s[2],
      maxlon: s[3]
    })
  }

  test (ob) {
    return ob.intersects(this.value)
  }

  toString () {
    return '(' + this.value.toLatLonString() + ')'
  }

  compileLokiJS () {
    return [null, null, true]
  }

  cacheInfo (options) {
    const bounds = this.value.toGeoJSON()

    const newBounds = options.bounds ? turf.intersect(options.bounds, bounds) : bounds
    if (newBounds === null) {
      options.invalid = true
    } else {
      options.bounds = newBounds.geometry
    }
  }

  isSupersetOf (other) {
    if (other instanceof bbox) {
      return other.value.within(this.value)
    }

    if (other.bounds) {
      return !!turf.difference(this.bounds(), other.bounds())
    }
  }

  bounds () {
    return this.value.toGeoJSON()
  }
}
