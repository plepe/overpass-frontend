const geojson2elements = require('./geojson2elements.js')

module.exports = {
  id: 'GeoJSON',

  willLoad (url, content, options) {
    return url.match(/\.geojson$/i)
  },

  load (content, options, callback) {
    const data = JSON.parse(content)

    const result = {
      version: 0.6
    }

    ;['generator', 'timestamp_osm_base', 'copyright'].forEach(k => {
      if (data[k]) {
        result[k] = data[k]
      }
    })

    if (data.bounds) {
      result.bounds = {
        minlon: data.bounds[0],
        minlat: data.bounds[1],
        maxlon: data.bounds[2],
        maxlat: data.bounds[3]
      }
    }

    result.elements = []

    try {
      geojson2elements(data, result.elements, options)
    } catch (e) {
      return callback(e)
    }

    callback(null, result)
  }
}
