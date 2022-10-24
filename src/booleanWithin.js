const turf = require('./turf')

module.exports = function booleanWithin (feature1, feature2) {
  const features1 = splitGeometry(feature1)
  const features2 = splitGeometry(feature2)

  const matching = features1.filter(f1 => !!features2.filter(f2 => turf.booleanWithin(f1, f2)).length)

  return features1.length === matching.length
}

function splitGeometry (feature) {
  if (feature.geometry && feature.geometry.type === 'MultiPolygon') {
    return feature.geometry.coordinates.map(polygon => {
      return {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: polygon
        }
      }
    })
  }

  return [feature]
}
