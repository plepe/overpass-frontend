# OverpassFrontend
A JavaScript (NodeJS/Browser) library to easily access data from OpenStreetMap via Overpass API. The objects can directly be used with LeafletJS or exported to GeoJSON. Data will be cached locally, optionally by using LocalStorage (or similar).

# INSTALLATION
```sh
npm install --save overpass-frontend
```

# DOCUMENTATION
Find documentation in [doc](https://rawgit.com/plepe/overpass-frontend/master/doc/OverpassFrontend.html). You can re-generate the documentation with `npm run doc`.

# EXAMPLE
```js
const OverpassFrontend = require('overpass-frontend')

// you may specify an OSM file as url, e.g. 'test/data.osm.bz2'
const overpassFrontend = new OverpassFrontend('//overpass-api.de/api/interpreter')

// request restaurants in the specified bounding box
overpassFrontend.BBoxQuery(
  'nwr[amenity=restaurant]',
  { minlat: 48.19, maxlat: 48.20, minlon: 16.33, maxlon: 16.34 },
  {
    properties: OverpassFrontend.ALL
  },
  function (err, result) {
    console.log('* ' + result.tags.name + ' (' + result.id + ')')
  },
  function (err) {
    if (err) { console.log(err) }
  }
)
```
