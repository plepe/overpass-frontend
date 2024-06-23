const BoundingBox = require('boundingbox')
const turf = require('../turf')
const OverpassFrontend = require('../defines')
const qlFunction = require('./qlFunction')
const boundsToLokiQuery = require('../boundsToLokiQuery')

module.exports = class bbox extends qlFunction {
  constructor (str) {
    super()
    this.fun = 'bbox'

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
    const r = ob.intersects(this.value)
    return r === 2 ? true : r === 0 ? false : null
  }

  toString () {
    return '(' + this.value.toLatLonString() + ')'
  }

  compileLokiJS (options) {
    const r = boundsToLokiQuery(this.value, options)
    r.needMatch = true

    return r
  }

  cacheDescriptors (descriptors, options) {
    const bounds = this.value.toGeoJSON()

    descriptors.forEach(d => {
      const newBounds = d.bounds ? turf.intersect(d.bounds, bounds) : bounds
      if (newBounds === null) {
        d.invalid = true
      } else {
        d.bounds = newBounds.geometry
        d.properties |= OverpassFrontend.BBOX
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

  properties () {
    return OverpassFrontend.BBOX
  }

  possibleBounds (ob) {
    return this.value.toGeoJSON()
  }
}
