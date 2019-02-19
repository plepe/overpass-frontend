function geojsonShiftWesternWorld (geojson, shift) {
  switch (geojson.type) {
    case 'FeatureCollection':
      return {
        type: 'FeatureCollection',
        features: geojson.features.map(feature => geojsonShiftWesternWorld(feature, shift))
      }
    case 'Feature':
      return {
        type: 'Feature',
        geometry: geojsonShiftWesternWorld(geojson.geometry, shift),
        properties: geojson.properties
      }
    case 'Polygon':
      return {
        type: 'Polygon',
        coordinates: geojson.coordinates.map(ring => ring.map(poi => [ poi[0] < 0 ? poi[0] + shift : poi[0], poi[1] ]))
      }
    default:
      console.log(geojson)
  }
}

module.exports = geojsonShiftWesternWorld
