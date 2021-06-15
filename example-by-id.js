const OverpassFrontend = require('overpass-frontend')

// you may specify an OSM file as url, e.g. 'test/data.osm.bz2'
const overpassFrontend = new OverpassFrontend('//overpass-api.de/api/interpreter')

// request restaurants in the specified bounding box
overpassFrontend.get(
  ['n27365030', 'w5013364'],
  {
    properties: OverpassFrontend.TAGS
  },
  function (err, result) {
    if (result) {
      console.log('* ' + result.tags.name + ' (' + result.id + ')')
    } else {
      console.log('* empty result')
    }
  },
  function (err) {
    if (err) { console.log(err) }
  }
)
