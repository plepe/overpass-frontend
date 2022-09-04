const BoundingBox = require('boundingbox')

module.exports = {
  parse (str) {
    let s = str.split(/,/g)

    if (s.length !== 4) {
      throw new Error('bbox function expects "latitude,longitude,latitude,longitude"')
    }

    console.log(s)
    s = s.map(v => parseFloat(v))

    return new BoundingBox({
      minlat: s[0],
      minlon: s[1],
      maxlat: s[2],
      maxlon: s[3]
    })
  },

  test (value, ob) {
    return ob.intersects(value)
  },

  compileQL (value) {
    return '(' + value.toLatLonString() + ')'
  },

  compileLokiJS (value) {
    return [ null, null, true ]
  }
}
