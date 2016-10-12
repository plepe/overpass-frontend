# OverpassFrontend
A JavaScript (NodeJS/Browser) library to easily access data from OpenStreetMap via Overpass API. The objects can directly be used with LeafletJS or exported to GeoJSON. Data will be cached locally, optionally by using LocalStorage (or similar).

# API
## OverpassFrontend(url, options)
The constructor for accessing the Overpass API.

```js
var overpassFrontend = new OverpassFrontend('//overpass-api.de/api/', {
});
```

Parameters:

| Name    | Type   | Description
| ------- | ------ | ---------------------
| url     | string | The URL of the API, e.g. 'https://overpass-api.de/api/'
| options | object | various options, see below

Options:

| Option  | Type   | Description
| ------- | ------ | ------------
| effortPerRequest | number | To avoid huge requests to the Overpass API, the request will be split into smaller chunks. This value defines, at which effort the request will be sent. Default: 1000.
| effortNode | number | The effort for request a node. Default: 1.
| effortWay | number | The effort for request a way. Default: 4.
| effortRelation | number | The effort for request a relation. Default: 64.
| timeGap | number (ms) | A short time gap between two requests to the Overpass API. Default: 10 milliseconds.

## OverpassFrontend.get(ids, options, featureCallback, finalCallback)
Get a list of OpenStreetMap objects from Overpass API.

Parameters:

| Name    | Type   | Description
| ------- | ------ | -------------
| ids     | string, string[] | One or more IDs, e.g. [ 'n123', 'w2345', 'n123' ]
| options | object | Various options, see below
| featureCallback | function | Will be called for each object in the order of the IDs in parameter 'ids'. Will be passed: 1. err (if an error occured, otherwise null), 2. the object or null, 3. the index in the array ids.
| finalCallback | function | Will be called after the last feature. Will be passed: 1. err (if an error occured, otherwise null).

Options:

| Option  | Type   | Description
| ------- | ------ | ------------
| priority | number | Priority for loading these objects. The lower the sooner they will be requested. Default: 0
| sort | boolean|string | When set to true, the function featureCallback will be called in the order of the array ids. As string, different options are available: 'BBoxDiagonalLength', order by length of the diagonal of the bounding box. Default: false (not order).
| bbox    | L.latLngBounds | Only include objects which intersect the given bbox. The featureCallback will be called anyway, but boolean false will be passed.
| properties | bit array | Which properties of the features should be downloaded: OVERPASS_ID_ONLY, OVERPASS_BBOX, OVERPASS_TAGS, OVERPASS_GEOM, OVERPASS_META. Combine by binary OR: ``OVERPASS_ID | OVERPASS_BBOX``. Default: ``OVERPASS_BBOX | OVERPASS_TAGS | OVERPASS_MEMBERS``

Returns an OverpassRequest object.

## OverpassFrontend.BBoxQuery(query, bbox, options, featureCallback, finalCallback)
Run the specified query in the specified bounding box.

Parameters:

| Name    | Type   | Description
| ------- | ------ | -------------
| query   | string | Query for requesting objects from Overpass API, e.g. "node[amenity=restaurant]"
| bbox    | L.latLngBounds | A Leaflet Bounds object, e.g. from map.getBounds()
| options | object | Various options, see below
| featureCallback | function | Will be called for each object in the order of the IDs in parameter 'ids'. Will be called for each object in the order of the IDs in parameter 'ids'. Will be passed: 1. err (if an error occured, otherwise null), 2. the object or null.
| finalCallback | function | Will be called after the last feature. Will be passed: 1. err (if an error occured, otherwise null).

Options:

| Option  | Type   | Description
| ------- | ------ | ------------
| priority | number | Priority for loading these objects. The lower the sooner they will be requested. Default: 0
| sort | boolean | When set to true, the function featureCallback will be called in some particular order (e.g. from orderApproxRouteLength).
| properties | bit array | Which properties of the features should be downloaded: OVERPASS_ID_ONLY, OVERPASS_BBOX, OVERPASS_TAGS, OVERPASS_GEOM, OVERPASS_META. Combine by binary OR: ``OVERPASS_ID | OVERPASS_BBOX``. Default: ``OVERPASS_BBOX | OVERPASS_TAGS | OVERPASS_MEMBERS``
| orderApproxRouteLength | boolean | Order objects by approximate route length (calculated from the diagonal of the bounding box)

Returns an OverpassRequest object.

## OverpassFrontend.regexpEscape(str)
Escape a string for usage in a regular expression to the Overpass API.

Example:
```js
overpassFrontend.regexpEscape('bank+atm') // 'bank\+atm'
```

## OverpassFrontend.abortAllRequests()
Abort all currently running requests. For each request the final callback will be called with the error 'abort'. The currently running server request will be finished and the data loaded into the cache, but no feature callbacks will be called.

# OverpassObject: OverpassNode, OverpassWay, OverpassRelation
Passed to the featureCallback function.
## OverpassObject.leafletFeature(options)
Returns a feature for adding to a Leaflet based map. As options all Path resp. Marker options are available, additionally:

* nodeFeature: if the feature (or a relation member) is a node, create one of the following Layers: 'CircleMarker' (default), 'Circle', 'Marker'.
* radius: if nodeFeature is 'Circle' or 'CircleMarker', use this value as radius.

If the geometry is not available (e.g. it has not been loaded), will return `null`.

Example:
```js
function(err, ob) { // featureCallback function
  ob.leafletFeature({
    nodeFeature: 'CircleMarker',
    radius: 6,
    fillColor: 'red'
  }).addTo(map)
}
```

# OverpassRequest
An object describing a request to the Overpass API.
