const turf = {
  distance: require('@turf/distance').default
}

module.exports = {
  parse (str) {
    const s = str.split(/,/g)

    if (s.length !== 3) {
      throw new Error('around function expects "distance,latitude,longitude"')
    }

    return { distance: parseFloat(s[0]), geometry: { type: 'Feature', geometry: { type: 'Point', coordinates: [ parseFloat(s[2]), parseFloat(s[1]) ] } } }
  },

  test (value, ob) {
    const geojson = ob.GeoJSON()
    if (geojson.geometry) {
      return turf.distance(geojson, value.geometry, 'kilometers') < value.distance / 1000
    }
  },

  compileQL (value) {
    return '(around:' + value.join(',') + ')'
  },

  compileLokiJS (value) {
    return [ null, null, true ]
  }
}
