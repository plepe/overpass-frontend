function geojsonShiftWorld (geojson, shift) {
  switch (geojson.type) {
    case 'FeatureCollection':
      return {
        type: 'FeatureCollection',
        features: geojson.features.map(feature => geojsonShiftWorld(feature, shift))
      }
    case 'Feature':
      return {
        type: 'Feature',
        geometry: geojsonShiftWorld(geojson.geometry, shift),
        properties: geojson.properties
      }
    case 'GeometryCollection':
      return {
        type: 'GeometryCollection',
        geometries: geojson.geometries.map(geometry => geojsonShiftWorld(geometry, shift)),
        properties: geojson.properties
      }
    case 'Point':
      return {
        type: 'Point',
        coordinates: [geojson.coordinates[0] + shift[geojson.coordinates[0] < 0 ? 0 : 1], geojson.coordinates[1]]
      }
    case 'Polygon':
    case 'MultiLineString':
      return {
        type: geojson.type,
        coordinates: geojson.coordinates.map(ring => ring.map(poi => [poi[0] + shift[poi[0] < 0 ? 0 : 1], poi[1]]))
      }
    case 'MultiPolygon':
      return {
        type: 'MultiPolygon',
        coordinates: geojson.coordinates.map(poly => poly.map(ring => ring.map(poi => [poi[0] + shift[poi[0] < 0 ? 0 : 1], poi[1]])))
      }
    case 'LineString':
    case 'MultiPoint':
      return {
        type: geojson.type,
        coordinates: geojson.coordinates.map(poi => [poi[0] + shift[poi[0] < 0 ? 0 : 1], poi[1]])
      }
    default:
      console.log(geojson)
  }
}

module.exports = geojsonShiftWorld
