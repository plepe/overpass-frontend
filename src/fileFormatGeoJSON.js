const elementIds = {
  node: 0,
  way: 0,
  relation: 0
}

module.exports = {
  id: 'GeoJSON',

  willLoad (url, content, options) {
    return url.match(/\.geojson$/i)
  },

  load (content, options, callback) {
    const data = JSON.parse(content)

    const result = {
      version: 0.6,
      elements: []
    }

    try {
      geojson2elements(data, result.elements, options)
    } catch (e) {
      return callback(e)
    }

    callback(null, result)
  }
}

function geojson2elements (data, elements, options) {
  if (data.type === 'FeatureCollection') {
    return data.features.forEach(feature => {
      geojson2elements(feature, elements, options)
    })
  }

  if (data.type !== 'Feature') {
    throw new Error('Unknown type ' + data.type)
  }

  let element

  switch (data.geometry.type) {
    case 'Point':
      element = {
        type: 'node',
        lon: data.geometry.coordinates[0],
        lat: data.geometry.coordinates[1]
      }
      break
    case 'LineString':
      element = {
        type: 'way',
        geometry: data.geometry.coordinates.map(c => {
          return { lon: c[0], lat: c[1] }
        })
      }
      break
    case 'Polygon':
      if (data.geometry.coordinates.length === 1) {
        element = {
          type: 'way',
          geometry: data.geometry.coordinates[0].map(c => {
            return { lon: c[0], lat: c[1] }
          })
        }
      } else {
        element = {
          type: 'relation',
          members: data.geometry.coordinates.map((ring, i) => {
            return {
              type: 'way',
              ref: --elementIds.way,
              role: i ? 'inner' : 'outer',
              geometry: ring.map(c => {
                return { lon: c[0], lat: c[1] }
              })
            }
          })
        }
        data.properties = { ...data.properties, type: 'multipolygon' }
      }
      break
    default:
      console.log('Unknown geometry type ' + data.geometry.type)
      return
  }

  if (data.properties) {
    element.tags = data.properties
  }

  element.id = --elementIds[element.type]

  elements.push(element)
}
