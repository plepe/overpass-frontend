const turf = {
  buffer: require('@turf/buffer').default,
  distance: require('@turf/distance').default,
  intersect: require('@turf/intersect').default
}

module.exports = {
  parse (str) {
    const s = str.split(/,/g)

    if (s.length !== 3) {
      throw new Error('around function expects "distance,latitude,longitude"')
    }

    return { distance: parseFloat(s[0]), geometry: { type: 'Point', coordinates: [ parseFloat(s[2]), parseFloat(s[1]) ] } }
  },

  test (value, ob) {
    const geojson = ob.GeoJSON()
    if (geojson.geometry) {
      return turf.distance(geojson, value.geometry, 'kilometers') < value.distance / 1000
    }
  },

  compileQL (value) {
    return '(around:' + value.distance + ',' + value.geometry.coordinates[1] + ',' + value.geometry.coordinates[0] + ')'
  },

  compileLokiJS (value) {
    return [ null, null, true ]
  },

  cacheInfo (options, value) {
    if (!value.bounds) {
      value.bounds = turf.buffer(value.geometry, value.distance / 1000, {units: 'kilometers'})
    }

    const newBounds = options.bounds === null ? value.bounds : turf.intersect(options.bounds, value.bounds)
    if (newBounds === null) {
      options.invalid = true
    } else {
      options.bounds = newBounds.geometry
    }
  }
}
