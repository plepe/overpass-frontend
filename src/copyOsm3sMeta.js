module.exports = function copyOsm3sMetaFrom (results) {
  let osm3sMeta = {}

  for (let k in results) {
    if (k !== 'elements' && k !== 'osm3s') {
      osm3sMeta[k] = results[k]
    }
  }
  for (let k in results.osm3s) {
    osm3sMeta[k] = results.osm3s[k]
  }

  return osm3sMeta
}
