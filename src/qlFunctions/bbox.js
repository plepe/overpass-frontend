const BoundingBox = require('boundingbox')
const turf = require('../turf')
const OverpassFrontend = require('../defines')
const qlFunction = require('./qlFunction')

module.exports = class bbox extends qlFunction {
  constructor (str) {
    super()
    if (str instanceof BoundingBox) {
      this.value = str
      return
    }

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
    return { needMatch: true }
  }

  cacheDescriptors (descriptors) {
    const bounds = this.value.toGeoJSON()

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
