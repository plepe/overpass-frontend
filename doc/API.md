## Classes

<dl>
<dt><a href="#Filter">Filter</a></dt>
<dd><p>A Filter into OSM data. A simplified version of <a href='https://wiki.openstreetmap.org/wiki/Overpass_API/Overpass_QL'>Overpass QL</a>.</p>
<p>Either a single query (e.g. <tt>node[amenity=restaurant];</tt>) or a combined query (e.g. <tt>(node[amenity=restaurant];way[amenity=restaurant];);</tt>).<br>
A single query statement consists of a type (e.g. 'node', 'way', 'relation', 'nwr' (node, way or relation)) and optional filters:<ul>
<li>(Not) Equals (=, !=): <tt>[amenity=restaurant]</tt> or <tt>["amenity"="restaurant"]</tt> resp. <tt>["amenity"!="restaurant"]</tt>.
<li>Regular Expression: <tt>[amenity~"^(restaurant|cafe)$"]</tt> resp. negated: <tt>[amenity!~"^(restaurant|cafe)$"]</tt>
<li>Key regular expression: <tt>[~"cycleway"~"left"]</tt> (key has to match cycleway and its value match left)
<li>Key (not) exists: <tt>[amenity]</tt> or <tt>["amenity"]</tt> resp. <tt>[!amenity]</tt>
<li>Array search: <tt>[cuisine^kebap]</tt>: search for cuisine tags which exactly include 'kebap' (semicolon-separated values, e.g. <tt>cuisine=kebap;pizza</tt>).
<li>String search: <tt>[name%cafe]</tt>: search for name tags which are similar to cafe, e.g. "café". (see https://github.com/plepe/strsearch2regexp for details).
</ul>
More advanced queries are not supported.</p></dd>
<dt><a href="#OverpassFrontend">OverpassFrontend</a></dt>
<dd><p>A connection to an Overpass API Server or an OpenStreetMap file</p>
</dd>
<dt><a href="#OverpassNode">OverpassNode</a> ⇐ <code><a href="#OverpassObject">OverpassObject</a></code></dt>
<dd><p>A node</p>
</dd>
<dt><a href="#OverpassObject">OverpassObject</a></dt>
<dd><p>Base class for representing map features.</p>
</dd>
<dt><a href="#OverpassRelation">OverpassRelation</a></dt>
<dd><p>A relation</p>
</dd>
<dt><a href="#OverpassWay">OverpassWay</a></dt>
<dd><p>A way</p>
</dd>
<dt><a href="#Request">Request</a></dt>
<dd><p>An unspecified request</p>
</dd>
<dt><a href="#RequestBBox">RequestBBox</a> ⇐ <code><a href="#Request">Request</a></code></dt>
<dd><p>A BBox request</p>
</dd>
<dt><a href="#RequestGet">RequestGet</a> ⇐ <code><a href="#Request">Request</a></code></dt>
<dd><p>A get request (request list of map features by id)</p>
</dd>
<dt><a href="#RequestMulti">RequestMulti</a> ⇐ <code><a href="#Request">Request</a></code></dt>
<dd><p>A request consisting of several requests - duplicate results will be filtered</p>
</dd>
<dt><a href="#KnownArea">KnownArea</a></dt>
<dd><p>When loading area after area of a map, it will be more and more complete.
This class manages which area is already known and which not.</p>
</dd>
</dl>

<a name="Filter"></a>

## Filter
A Filter into OSM data. A simplified version of <a href='https://wiki.openstreetmap.org/wiki/Overpass_API/Overpass_QL'>Overpass QL</a>.

<p>Either a single query (e.g. <tt>node[amenity=restaurant];</tt>) or a combined query (e.g. <tt>(node[amenity=restaurant];way[amenity=restaurant];);</tt>).<br>
A single query statement consists of a type (e.g. 'node', 'way', 'relation', 'nwr' (node, way or relation)) and optional filters:<ul>
<li>(Not) Equals (=, !=): <tt>[amenity=restaurant]</tt> or <tt>["amenity"="restaurant"]</tt> resp. <tt>["amenity"!="restaurant"]</tt>.
<li>Regular Expression: <tt>[amenity~"^(restaurant|cafe)$"]</tt> resp. negated: <tt>[amenity!~"^(restaurant|cafe)$"]</tt>
<li>Key regular expression: <tt>[~"cycleway"~"left"]</tt> (key has to match cycleway and its value match left)
<li>Key (not) exists: <tt>[amenity]</tt> or <tt>["amenity"]</tt> resp. <tt>[!amenity]</tt>
<li>Array search: <tt>[cuisine^kebap]</tt>: search for cuisine tags which exactly include 'kebap' (semicolon-separated values, e.g. <tt>cuisine=kebap;pizza</tt>).
<li>String search: <tt>[name%cafe]</tt>: search for name tags which are similar to cafe, e.g. "café". (see https://github.com/plepe/strsearch2regexp for details).
</ul>
More advanced queries are not supported.</p>

**Kind**: global class  

* [Filter](#Filter)
    * [new Filter(query)](#new_Filter_new)
    * [.match(ob)](#Filter+match) ⇒ <code>boolean</code>
    * [.toString()](#Filter+toString) ⇒ <code>string</code>
    * [.toQl([options])](#Filter+toQl) ⇒ <code>string</code>
    * [.toLokijs([options])](#Filter+toLokijs) ⇒ <code>object</code>

<a name="new_Filter_new"></a>

### new Filter(query)

| Param | Type |
| --- | --- |
| query | <code>string</code> \| <code>object</code> | 

<a name="Filter+match"></a>

### filter.match(ob) ⇒ <code>boolean</code>
Check if an object matches this filter

**Kind**: instance method of [<code>Filter</code>](#Filter)  

| Param | Type | Description |
| --- | --- | --- |
| ob | [<code>OverpassNode</code>](#OverpassNode) \| [<code>OverpassWay</code>](#OverpassWay) \| [<code>OverpassRelation</code>](#OverpassRelation) | an object from Overpass API |

<a name="Filter+toString"></a>

### filter.toString() ⇒ <code>string</code>
Convert query to a string representation

**Kind**: instance method of [<code>Filter</code>](#Filter)  
<a name="Filter+toQl"></a>

### filter.toQl([options]) ⇒ <code>string</code>
Convert query to Overpass QL

**Kind**: instance method of [<code>Filter</code>](#Filter)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | <code>object</code> |  | Additional options |
| [options.inputSet] | <code>string</code> | <code>&quot;&#x27;&#x27;&quot;</code> | Specify input set (e.g.'.foo'). |
| [options.outputSet] | <code>string</code> | <code>&quot;&#x27;&#x27;&quot;</code> | Specify output set (e.g.'.foo'). |

<a name="Filter+toLokijs"></a>

### filter.toLokijs([options]) ⇒ <code>object</code>
Convert query to LokiJS query for local database. If the property 'needMatch' is set on the returned object, an additional match() should be executed for each returned object, as the query can't be fully compiled (and the 'needMatch' property removed).

**Kind**: instance method of [<code>Filter</code>](#Filter)  

| Param | Type | Description |
| --- | --- | --- |
| [options] | <code>object</code> | Additional options |

<a name="OverpassFrontend"></a>

## OverpassFrontend
A connection to an Overpass API Server or an OpenStreetMap file

**Kind**: global class  
**Properties**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| hasStretchLon180 | <code>boolean</code> | <code>false</code> | Are there any map features in the cache which stretch over lon=180/-180? |


* [OverpassFrontend](#OverpassFrontend)
    * [new OverpassFrontend(url, options)](#new_OverpassFrontend_new)
    * [.clearCache()](#OverpassFrontend+clearCache)
    * [.get(ids, options, featureCallback, finalCallback)](#OverpassFrontend+get) ⇒ [<code>RequestGet</code>](#RequestGet)
    * [.getCached(id, options)](#OverpassFrontend+getCached) ⇒ <code>null</code> \| <code>false</code> \| [<code>OverpassObject</code>](#OverpassObject)
    * [.BBoxQuery(query, bounds, options, featureCallback, finalCallback)](#OverpassFrontend+BBoxQuery) ⇒ [<code>RequestBBox</code>](#RequestBBox)
    * ["error" (error, [context])](#OverpassFrontend+event_error)
    * ["start" (reserved, context)](#OverpassFrontend+event_start)
    * ["reject" (queryStatus, context)](#OverpassFrontend+event_reject)
    * ["load" (osm3sMeta, [context])](#OverpassFrontend+event_load)
    * ["update" (object)](#OverpassFrontend+event_update)
    * [.QueryStatus](#OverpassFrontend+QueryStatus) : <code>Object</code>
    * [.Context](#OverpassFrontend+Context) : <code>Object</code>

<a name="new_OverpassFrontend_new"></a>

### new OverpassFrontend(url, options)

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| url | <code>string</code> |  | The URL of the API, e.g. 'https://overpass-api.de/api/'. If you omit the protocol, it will use the protocol which is in use for the current page (or https: on nodejs): '//overpass-api.de/api/'. If the url ends in .json, .osm or .osm.bz2 it will load this OpenStreetMap file and use the data from there. |
| options | <code>object</code> |  | Options |
| [options.effortPerRequest] | <code>number</code> | <code>1000</code> | To avoid huge requests to the Overpass API, the request will be split into smaller chunks. This value defines, how many objects will be requested per API call (for get() calls see effortNode, effortWay, effortRelation, e.g. up to 1000 nodes or 250 ways or (500 nodes and 125 ways) at default values; for BBoxQuery() calls the setting will be divided by 4). |
| [options.effortNode] | <code>number</code> | <code>1</code> | The effort for request a node. Default: 1. |
| [options.effortWay] | <code>number</code> | <code>4</code> | The effort for request a way. |
| [options.effortRelation] | <code>number</code> | <code>64</code> | The effort for request a relation. |
| [options.timeGap] | <code>number</code> | <code>10</code> | A short time gap between two requests to the Overpass API (milliseconds). |
| [options.timeGap429] | <code>number</code> | <code>500</code> | A longer time gap after a 429 response from Overpass API (milliseconds). |
| [options.timeGap429Exp] | <code>number</code> | <code>3</code> | If we keep getting 429 responses, increase the time exponentially with the specified factor (e.g. 2: 500ms, 1000ms, 2000ms, ...; 3: 500ms, 1500ms, 4500ms, ...) |
| [options.loadChunkSize] | <code>number</code> | <code>1000</code> | When loading a file (instead connecting to an Overpass URL) load elements in chunks of n items. |

<a name="OverpassFrontend+clearCache"></a>

### overpassFrontend.clearCache()
clear all caches

**Kind**: instance method of [<code>OverpassFrontend</code>](#OverpassFrontend)  
<a name="OverpassFrontend+get"></a>

### overpassFrontend.get(ids, options, featureCallback, finalCallback) ⇒ [<code>RequestGet</code>](#RequestGet)
**Kind**: instance method of [<code>OverpassFrontend</code>](#OverpassFrontend)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| ids | <code>string</code> \| <code>Array.&lt;string&gt;</code> |  | Id or array of Ids of OSM map features, e.g. [ 'n123', 'w2345', 'n123' ]. Illegal IDs will not produce an error but generate a 'null' object. |
| options | <code>object</code> |  | Various options, see below |
| [options.priority] | <code>number</code> | <code>0</code> | Priority for loading these objects. The lower the sooner they will be requested. |
| [options.sort] | <code>string</code> \| <code>boolean</code> | <code>false</code> | When set to true or "index", the function featureCallback will be called in order of the "ids" array. When set to false or null, the featureCallback will be called as soon as the object is loaded (e.g. immediately, if it is cached). When set to "BBoxDiagonalLength", the objects are ordered by the length of the diagonal of the bounding box. |
| [options.sortDir] | <code>&quot;asc&quot;</code> \| <code>&quot;desc&quot;</code> | <code>&quot;asc&quot;</code> | Sort direction. |
| featureCallback | <code>function</code> |  | Will be called for each object which is passed in parameter 'ids'. Will be passed: 1. err (if an error occured, otherwise null), 2. the object or null, 3. index of the item in parameter ids. |
| finalCallback | <code>function</code> |  | Will be called after the last feature. Will be passed: 1. err (if an error occured, otherwise null). |

<a name="OverpassFrontend+getCached"></a>

### overpassFrontend.getCached(id, options) ⇒ <code>null</code> \| <code>false</code> \| [<code>OverpassObject</code>](#OverpassObject)
return an OSM object, if it is already in the cache

**Kind**: instance method of [<code>OverpassFrontend</code>](#OverpassFrontend)  
**Returns**: <code>null</code> \| <code>false</code> \| [<code>OverpassObject</code>](#OverpassObject) - - null: does not exist in the database; false: may exist, but has not been loaded yet (or not enough properties known); OverpassObject: sucessful object  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>string</code> | Id of an OSM map feature |
| options | <code>object</code> |  |
| [options.properties] | <code>int</code> | Which properties have to be known (default: OverpassFrontend.DEFAULT) |

<a name="OverpassFrontend+BBoxQuery"></a>

### overpassFrontend.BBoxQuery(query, bounds, options, featureCallback, finalCallback) ⇒ [<code>RequestBBox</code>](#RequestBBox)
**Kind**: instance method of [<code>OverpassFrontend</code>](#OverpassFrontend)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| query | <code>string</code> |  | Query for requesting objects from Overpass API, e.g. "node[amenity=restaurant]" or "(node[amenity];way[highway~'^(primary|secondary)$];)". See <a href='Filter.html'>Filter</a> for details. |
| bounds | <code>BoundingBox</code> |  | A Leaflet Bounds object, e.g. from map.getBounds() |
| options | <code>object</code> |  |  |
| [options.priority] | <code>number</code> | <code>0</code> | Priority for loading these objects. The lower the sooner they will be requested. |
| [options.sort] | <code>boolean</code> \| <code>string</code> | <code>false</code> | If false, it will be called as soon as the features are availabe (e.g. immediately when cached). |
| [options.properties] | <code>bit\_array</code> |  | Which properties of the features should be downloaded: OVERPASS_ID_ONLY, OVERPASS_BBOX, OVERPASS_TAGS, OVERPASS_GEOM, OVERPASS_META. Combine by binary OR: ``OVERPASS_ID | OVERPASS_BBOX``. Default: OverpassFrontend.TAGS | OverpassFrontend.MEMBERS | OverpassFrontend.BBOX |
| [options.split] | <code>number</code> | <code>0</code> | If more than 'split' elements would be returned, split into several smaller requests, with 'split' elements each. Default: 0 (do not split) |
| [options.members] | <code>boolean</code> | <code>false</code> | Query relation members of. Default: false |
| [options.memberCallback] | <code>function</code> |  | For every member, call this callback function. (Requires options.members=true) |
| [options.memberProperties] | <code>bit\_array</code> |  | Which properties should be loaded for the members. Default: OverpassFrontend.TAGS | OverpassFrontend.MEMBERS | OverpassFrontend.BBOX |
| [options.memberSplit] | <code>number</code> | <code>0</code> | If more than 'memberSplit' member elements would be returned, split into smaller requests (see 'split'). 0 = do not split. |
| [options.filter] | <code>string</code> \| [<code>Filter</code>](#Filter) |  | Additional filter. |
| [options.noCacheQuery] | <code>boolean</code> | <code>false</code> | If true, the local cache will not be queried |
| featureCallback | <code>function</code> |  | Will be called for each matching object. Will be passed: 1. err (if an error occured, otherwise null), 2. the object or null. |
| finalCallback | <code>function</code> |  | Will be called after the last feature. Will be passed: 1. err (if an error occured, otherwise null). |

<a name="OverpassFrontend+event_error"></a>

### "error" (error, [context])
An error occured

**Kind**: event emitted by [<code>OverpassFrontend</code>](#OverpassFrontend)  

| Param | Type | Description |
| --- | --- | --- |
| error | <code>Error</code> |  |
| [context] | [<code>Context</code>](#OverpassFrontend+Context) | context of the request |

<a name="OverpassFrontend+event_start"></a>

### "start" (reserved, context)
A request to Overpass API is started

**Kind**: event emitted by [<code>OverpassFrontend</code>](#OverpassFrontend)  

| Param | Type | Description |
| --- | --- | --- |
| reserved | <code>object</code> |  |
| context | [<code>Context</code>](#OverpassFrontend+Context) | context of the request |

<a name="OverpassFrontend+event_reject"></a>

### "reject" (queryStatus, context)
A request to Overpass API was rejected

**Kind**: event emitted by [<code>OverpassFrontend</code>](#OverpassFrontend)  

| Param | Type | Description |
| --- | --- | --- |
| queryStatus | [<code>QueryStatus</code>](#OverpassFrontend+QueryStatus) |  |
| context | [<code>Context</code>](#OverpassFrontend+Context) | context of the request |

<a name="OverpassFrontend+event_load"></a>

### "load" (osm3sMeta, [context])
When a file is specified as URL, this event notifies, that the file has been completely loaded. When a Overpass API is used, every time when data has been received.

**Kind**: event emitted by [<code>OverpassFrontend</code>](#OverpassFrontend)  

| Param | Type | Description |
| --- | --- | --- |
| osm3sMeta | <code>object</code> | Meta data (not all properties of meta data might be set) |
| osm3sMeta.version | <code>number</code> | OpenStreetMap API version (currently 0.6) |
| osm3sMeta.generator | <code>string</code> | Data generator |
| osm3sMeta.timestamp_osm_base | <code>string</code> | RFC8601 timestamp of OpenStreetMap data |
| osm3sMeta.copyright | <code>string</code> | Copyright statement |
| [osm3sMeta.bounds] | <code>BoundingBox</code> | Bounding Box (only when loading from file) |
| [context] | [<code>Context</code>](#OverpassFrontend+Context) | context of the request |

<a name="OverpassFrontend+event_update"></a>

### "update" (object)
When an object is updated (e.g. when loaded; additional information loaded; when a member object got loaded)

**Kind**: event emitted by [<code>OverpassFrontend</code>](#OverpassFrontend)  

| Param | Type | Description |
| --- | --- | --- |
| object | [<code>OverpassNode</code>](#OverpassNode) \| [<code>OverpassWay</code>](#OverpassWay) \| [<code>OverpassRelation</code>](#OverpassRelation) | The object which got updated. |

<a name="OverpassFrontend+QueryStatus"></a>

### overpassFrontend.QueryStatus : <code>Object</code>
Status of a query to Overpass API

**Kind**: instance typedef of [<code>OverpassFrontend</code>](#OverpassFrontend)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| [status] | <code>int</code> | result status (e.g. 429 for reject, ...) |
| [errorCount] | <code>int</code> | the nth error in a row |
| [retry] | <code>boolean</code> | true, if the request will be retried (after a 429 error) |
| [retryTimeout] | <code>int</code> | if the query will be retried, the next request will be delayed for n ms |

<a name="OverpassFrontend+Context"></a>

### overpassFrontend.Context : <code>Object</code>
Current request context

**Kind**: instance typedef of [<code>OverpassFrontend</code>](#OverpassFrontend)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| query | <code>string</code> | The compiled code of all sub requests |
| requests | [<code>Array.&lt;Request&gt;</code>](#Request) | List of all requests in the context |
| subRequests | [<code>Array.&lt;SubRequest&gt;</code>](#Request+SubRequest) | List of all subRequests in the context |
| bbox | <code>BoundingBox</code> | when there are any BBox requests, add this global bbox |
| maxEffort | <code>int</code> | how many queries can we still add to this context |
| todo | <code>object</code> | list of items which should be loaded via get requests to avoid duplicates |

<a name="OverpassNode"></a>

## OverpassNode ⇐ [<code>OverpassObject</code>](#OverpassObject)
A node

**Kind**: global class  
**Extends**: [<code>OverpassObject</code>](#OverpassObject)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| id | <code>string</code> | ID of this object, starting with 'n'. |
| osm_id | <code>number</code> | Numeric id. |
| type | <code>string</code> | Type: 'node' |
| tags | <code>object</code> | OpenStreetMap tags. |
| meta | <code>object</code> | OpenStreetMap meta information. |
| geometry | <code>Point</code> | of the object |
| data | <code>object</code> | Data as loaded from Overpass API. |
| properties | <code>bit\_array</code> | Which information about this object is known? |
| memberOf | <code>Array.&lt;object&gt;</code> | List of ways and relations where this object is member of. |
| memberOf.id | <code>string</code> | ID of the way or relation where this way is member of. |
| memberOf.role | <code>string</code> | Role of this object in the relation. |
| memberOf.sequence | <code>number</code> | This object is the nth member in the way resp. relation. |
| bounds | <code>BoundingBox</code> | Bounding box of this object. |
| center | <code>Point</code> | Centroid of the bounding box. |


* [OverpassNode](#OverpassNode) ⇐ [<code>OverpassObject</code>](#OverpassObject)
    * [.leafletFeature([options])](#OverpassNode+leafletFeature) ⇒ <code>L.layer</code>
    * [.title()](#OverpassObject+title) ⇒ <code>string</code>
    * [.GeoJSON()](#OverpassObject+GeoJSON) ⇒ <code>object</code>
    * [.exportGeoJSON(object, function)](#OverpassObject+exportGeoJSON)
    * [.exportOSMXML(object, DOMNode, function)](#OverpassObject+exportOSMXML)
    * [.exportOSMJSON(object, object, function)](#OverpassObject+exportOSMJSON)
    * [.intersects(bbox)](#OverpassObject+intersects) ⇒ <code>number</code>

<a name="OverpassNode+leafletFeature"></a>

### overpassNode.leafletFeature([options]) ⇒ <code>L.layer</code>
return a leaflet feature for this object

**Kind**: instance method of [<code>OverpassNode</code>](#OverpassNode)  
**Overrides**: [<code>leafletFeature</code>](#OverpassObject+leafletFeature)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | <code>object</code> |  | options Options will be passed to the leaflet function |
| [options.nodeFeature] | <code>string</code> | <code>&quot;&#x27;CircleMarker&#x27;&quot;</code> | Which type of object should be returned: 'Marker' (L.marker), 'Circle' (L.circle) or 'CircleMarker' (L.circleMarker). |
| [options.shiftWorld] | <code>Array.&lt;number&gt;</code> | <code>[0, 0]</code> | Shift western (negative) longitudes by shiftWorld[0], eastern (positive) longitudes by shiftWorld[1] (e.g. by 360, 0 to show objects around lon=180) |

<a name="OverpassObject+title"></a>

### overpassNode.title() ⇒ <code>string</code>
Title of of this object (default: name, operator or ref or the id of the object)

**Kind**: instance method of [<code>OverpassNode</code>](#OverpassNode)  
<a name="OverpassObject+GeoJSON"></a>

### overpassNode.GeoJSON() ⇒ <code>object</code>
GeoJSON representation of this object

**Kind**: instance method of [<code>OverpassNode</code>](#OverpassNode)  
**Overrides**: [<code>GeoJSON</code>](#OverpassObject+GeoJSON)  
<a name="OverpassObject+exportGeoJSON"></a>

### overpassNode.exportGeoJSON(object, function)
Export object as GeoJSON. Missing geometry will be loaded.

**Kind**: instance method of [<code>OverpassNode</code>](#OverpassNode)  

| Param | Description |
| --- | --- |
| object | options Options |
| function | callback Function which will be called with (err, result) |

<a name="OverpassObject+exportOSMXML"></a>

### overpassNode.exportOSMXML(object, DOMNode, function)
Export object (and members) as OpenStreetMap XML

**Kind**: instance method of [<code>OverpassNode</code>](#OverpassNode)  
**Overrides**: [<code>exportOSMXML</code>](#OverpassObject+exportOSMXML)  

| Param | Description |
| --- | --- |
| object | options Options |
| DOMNode | parentNode a DOM Node where the object will be appended as child. Depending on object type and options, member objects will also be appended on the same level. |
| function | callback Function which will be called with (err, dom node) |

<a name="OverpassObject+exportOSMJSON"></a>

### overpassNode.exportOSMJSON(object, object, function)
Export object (and members) as OpenStreetMap JSON

**Kind**: instance method of [<code>OverpassNode</code>](#OverpassNode)  
**Overrides**: [<code>exportOSMJSON</code>](#OverpassObject+exportOSMJSON)  

| Param | Description |
| --- | --- |
| object | options Options |
| object | elements All exported elements, include member objects. Pass an empty object. If a member element would be exported multiple times it will appear only once. For the final export, to be compatible to Overpass API, you should convert the object to an array via Object.values(). |
| function | callback Function which will be called with (err, result) |

<a name="OverpassObject+intersects"></a>

### overpassNode.intersects(bbox) ⇒ <code>number</code>
Check whether this object intersects (or is within) the specified bounding box. Returns 0 if it does not match; 1 if the exact geometry is not known, but the object's bounding box matches; 2 exact match.

**Kind**: instance method of [<code>OverpassNode</code>](#OverpassNode)  
**Overrides**: [<code>intersects</code>](#OverpassObject+intersects)  

| Param | Type | Description |
| --- | --- | --- |
| bbox | <code>boundingbox:BoundingBox</code> | Bounding box |

<a name="OverpassObject"></a>

## OverpassObject
Base class for representing map features.

**Kind**: global class  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| id | <code>string</code> | ID of this object. |
| osm_id | <code>number</code> | Numeric id. |
| type | <code>string</code> | Type: 'node', 'way' or 'relation'. |
| tags | <code>object</code> | OpenStreetMap tags. |
| meta | <code>object</code> | OpenStreetMap meta information. |
| geometry | <code>object</code> | of the object |
| data | <code>object</code> | Data as loaded from Overpass API. |
| properties | <code>bit\_array</code> | Which information about this object is known? |
| memberOf | <code>Array.&lt;object&gt;</code> | List of ways and relations where this object is member of. |
| memberOf.id | <code>string</code> | ID of the way or relation where this way is member of. |
| memberOf.role | <code>string</code> | Role of this object in the relation. |
| memberOf.sequence | <code>number</code> | This object is the nth member in the way resp. relation. |
| bounds | <code>BoundingBox</code> | Bounding box of this object. |
| center | <code>Point</code> | Centroid of the bounding box. |


* [OverpassObject](#OverpassObject)
    * [.title()](#OverpassObject+title) ⇒ <code>string</code>
    * [.GeoJSON()](#OverpassObject+GeoJSON) ⇒ <code>object</code>
    * [.exportGeoJSON(object, function)](#OverpassObject+exportGeoJSON)
    * [.exportOSMXML(object, DOMNode, function)](#OverpassObject+exportOSMXML)
    * [.exportOSMJSON(object, object, function)](#OverpassObject+exportOSMJSON)
    * [.intersects(bbox)](#OverpassObject+intersects) ⇒ <code>number</code>
    * [.leafletFeature([options])](#OverpassObject+leafletFeature) ⇒ <code>L.layer</code>

<a name="OverpassObject+title"></a>

### overpassObject.title() ⇒ <code>string</code>
Title of of this object (default: name, operator or ref or the id of the object)

**Kind**: instance method of [<code>OverpassObject</code>](#OverpassObject)  
<a name="OverpassObject+GeoJSON"></a>

### overpassObject.GeoJSON() ⇒ <code>object</code>
GeoJSON representation of this object

**Kind**: instance method of [<code>OverpassObject</code>](#OverpassObject)  
<a name="OverpassObject+exportGeoJSON"></a>

### overpassObject.exportGeoJSON(object, function)
Export object as GeoJSON. Missing geometry will be loaded.

**Kind**: instance method of [<code>OverpassObject</code>](#OverpassObject)  

| Param | Description |
| --- | --- |
| object | options Options |
| function | callback Function which will be called with (err, result) |

<a name="OverpassObject+exportOSMXML"></a>

### overpassObject.exportOSMXML(object, DOMNode, function)
Export object (and members) as OpenStreetMap XML

**Kind**: instance method of [<code>OverpassObject</code>](#OverpassObject)  

| Param | Description |
| --- | --- |
| object | options Options |
| DOMNode | parentNode a DOM Node where the object will be appended as child. Depending on object type and options, member objects will also be appended on the same level. |
| function | callback Function which will be called with (err, dom node) |

<a name="OverpassObject+exportOSMJSON"></a>

### overpassObject.exportOSMJSON(object, object, function)
Export object (and members) as OpenStreetMap JSON

**Kind**: instance method of [<code>OverpassObject</code>](#OverpassObject)  

| Param | Description |
| --- | --- |
| object | options Options |
| object | elements All exported elements, include member objects. Pass an empty object. If a member element would be exported multiple times it will appear only once. For the final export, to be compatible to Overpass API, you should convert the object to an array via Object.values(). |
| function | callback Function which will be called with (err, result) |

<a name="OverpassObject+intersects"></a>

### overpassObject.intersects(bbox) ⇒ <code>number</code>
Check whether this object intersects (or is within) the specified bounding box. Returns 0 if it does not match; 1 if the exact geometry is not known, but the object's bounding box matches; 2 exact match.

**Kind**: instance method of [<code>OverpassObject</code>](#OverpassObject)  

| Param | Type | Description |
| --- | --- | --- |
| bbox | <code>boundingbox:BoundingBox</code> | Bounding box |

<a name="OverpassObject+leafletFeature"></a>

### overpassObject.leafletFeature([options]) ⇒ <code>L.layer</code>
return a leaflet feature for this object.

**Kind**: instance method of [<code>OverpassObject</code>](#OverpassObject)  

| Param | Type | Description |
| --- | --- | --- |
| [options] | <code>object</code> | options Options will be passed to the leaflet function |

<a name="OverpassRelation"></a>

## OverpassRelation
A relation

**Kind**: global class  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| id | <code>string</code> | ID of this object, starting with 'r'. |
| osm_id | <code>number</code> | Numeric id. |
| type | <code>string</code> | Type: 'relation'. |
| tags | <code>object</code> | OpenStreetMap tags. |
| meta | <code>object</code> | OpenStreetMap meta information. |
| geometry | <code>GeoJSON</code> | of the object |
| data | <code>object</code> | Data as loaded from Overpass API. |
| properties | <code>bit\_array</code> | Which information about this object is known? |
| memberOf | <code>Array.&lt;object&gt;</code> | List of relations where this object is member of. |
| memberOf.id | <code>string</code> | ID of the relation where this object is member of. |
| memberOf.role | <code>string</code> | Role of this object in the relation. |
| memberOf.sequence | <code>number</code> | This object is the nth member in the relation. |
| memberOf.connectedPrev | <code>null</code> \| <code>string</code> | null (unknown), 'no' (connected), 'forward' (connected at the front end of this way), 'backward' (connected at the back end of this way) |
| memberOf.connectedNext | <code>null</code> \| <code>string</code> | null (unknown), 'no' (connected), 'forward' (connected at the back end of this way), 'backward' (connected at the front end of this way) |
| members.dir | <code>null</code> \| <code>string</code> | null (unknown), 'forward', 'backward' |
| bounds | <code>BoundingBox</code> | Bounding box of this object. |
| center | <code>Point</code> | Centroid of the bounding box. |
| members | <code>Array.&lt;object&gt;</code> | Nodes of the way. |
| members.id | <code>string</code> | ID of the member. |
| members.ref | <code>number</code> | Numeric ID of the member. |
| members.type | <code>string</code> | 'node'. |
| members.role | <code>string</code> | Role of the member. |
| members.connectedPrev | <code>null</code> \| <code>string</code> | null (unknown), 'no' (connected), 'forward' (connected at the front end of this way), 'backward' (connected at the back end of this way) |
| members.connectedNext | <code>null</code> \| <code>string</code> | null (unknown), 'no' (connected), 'forward' (connected at the back end of this way), 'backward' (connected at the fornt end of this way) |
| members.dir | <code>null</code> \| <code>string</code> | null (unknown), 'forward', 'backward', 'loop' |


* [OverpassRelation](#OverpassRelation)
    * [.memberIds()](#OverpassRelation+memberIds) ⇒ <code>Array.&lt;string&gt;</code>
    * [.leafletFeature([options])](#OverpassRelation+leafletFeature) ⇒ <code>L.layer</code>

<a name="OverpassRelation+memberIds"></a>

### overpassRelation.memberIds() ⇒ <code>Array.&lt;string&gt;</code>
Return list of member ids.

**Kind**: instance method of [<code>OverpassRelation</code>](#OverpassRelation)  
<a name="OverpassRelation+leafletFeature"></a>

### overpassRelation.leafletFeature([options]) ⇒ <code>L.layer</code>
return a leaflet feature for this object.

**Kind**: instance method of [<code>OverpassRelation</code>](#OverpassRelation)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | <code>object</code> |  | options Options will be passed to the leaflet function |
| [options.shiftWorld] | <code>Array.&lt;number&gt;</code> | <code>[0, 0]</code> | Shift western (negative) longitudes by shiftWorld[0], eastern (positive) longitudes by shiftWorld[1] (e.g. by 360, 0 to show objects around lon=180) |

<a name="OverpassWay"></a>

## OverpassWay
A way

**Kind**: global class  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| id | <code>string</code> | ID of this object, starting with 'w'. |
| osm_id | <code>number</code> | Numeric id. |
| type | <code>string</code> | Type: 'way'. |
| tags | <code>object</code> | OpenStreetMap tags. |
| meta | <code>object</code> | OpenStreetMap meta information. |
| geometry | <code>Array.&lt;Point&gt;</code> | of the object |
| data | <code>object</code> | Data as loaded from Overpass API. |
| properties | <code>bit\_array</code> | Which information about this object is known? |
| memberOf | <code>Array.&lt;object&gt;</code> | List of relations where this object is member of. |
| memberOf.id | <code>string</code> | ID of the relation where this way is member of. |
| memberOf.role | <code>string</code> | Role of this object in the relation. |
| memberOf.sequence | <code>number</code> | This object is the nth member in the relation. |
| bounds | <code>BoundingBox</code> | Bounding box of this object. |
| center | <code>Point</code> | Centroid of the bounding box. |
| members | <code>Array.&lt;object&gt;</code> | Nodes of the way. |
| members.id | <code>string</code> | ID of the member. |
| members.ref | <code>number</code> | Numeric ID of the member. |
| members.type | <code>string</code> | 'node'. |

<a name="OverpassWay+leafletFeature"></a>

### overpassWay.leafletFeature([options]) ⇒ <code>L.layer</code>
return a leaflet feature for this object. If the ways is closed, a L.polygon will be returned, otherwise a L.polyline.

**Kind**: instance method of [<code>OverpassWay</code>](#OverpassWay)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | <code>object</code> |  | options Options will be passed to the leaflet function |
| [options.shiftWorld] | <code>Array.&lt;number&gt;</code> | <code>[0, 0]</code> | Shift western (negative) longitudes by shiftWorld[0], eastern (positive) longitudes by shiftWorld[1] (e.g. by 360, 0 to show objects around lon=180) |

<a name="Request"></a>

## Request
An unspecified request

**Kind**: global class  

* [Request](#Request)
    * [new Request(overpass, options)](#new_Request_new)
    * [.abort()](#Request+abort)
    * [.finish(err)](#Request+finish)
    * [.willInclude(context)](#Request+willInclude) ⇒ <code>boolean</code>
    * [.minMaxEffort()](#Request+minMaxEffort) ⇒ [<code>minMaxEffortResult</code>](#Request+minMaxEffortResult)
    * [.compileQuery(context)](#Request+compileQuery) ⇒ [<code>SubRequest</code>](#Request+SubRequest)
    * [.receiveObject(ob, subRequest, partIndex)](#Request+receiveObject)
    * [.finishSubRequest(subRequest)](#Request+finishSubRequest)
    * ["abort"](#Request+event_abort)
    * ["finish"](#Request+event_finish)
    * ["subrequest-compiile" (subRequest)](#Request+event_subrequest-compiile)
    * ["subrequest-finished" (subRequest)](#Request+event_subrequest-finished)
    * [.SubRequest](#Request+SubRequest) : <code>Object</code>
    * [.minMaxEffortResult](#Request+minMaxEffortResult) : <code>Object</code>

<a name="new_Request_new"></a>

### new Request(overpass, options)

| Param | Type |
| --- | --- |
| overpass | [<code>OverpassFrontend</code>](#OverpassFrontend) | 
| options | <code>object</code> | 

<a name="Request+abort"></a>

### request.abort()
abort this request

**Kind**: instance method of [<code>Request</code>](#Request)  
<a name="Request+finish"></a>

### request.finish(err)
request is finished

**Kind**: instance method of [<code>Request</code>](#Request)  

| Param | Type | Description |
| --- | --- | --- |
| err | <code>Error</code> \| <code>null</code> | null if no error occured |

<a name="Request+willInclude"></a>

### request.willInclude(context) ⇒ <code>boolean</code>
shall this Request be included in the current call?

**Kind**: instance method of [<code>Request</code>](#Request)  
**Returns**: <code>boolean</code> - - yes|no  

| Param | Type | Description |
| --- | --- | --- |
| context | [<code>Context</code>](#OverpassFrontend+Context) | Current context |

<a name="Request+minMaxEffort"></a>

### request.minMaxEffort() ⇒ [<code>minMaxEffortResult</code>](#Request+minMaxEffortResult)
how much effort can a call to this request use

**Kind**: instance method of [<code>Request</code>](#Request)  
**Returns**: [<code>minMaxEffortResult</code>](#Request+minMaxEffortResult) - - minimum and maximum effort  
<a name="Request+compileQuery"></a>

### request.compileQuery(context) ⇒ [<code>SubRequest</code>](#Request+SubRequest)
compile the query

**Kind**: instance method of [<code>Request</code>](#Request)  
**Returns**: [<code>SubRequest</code>](#Request+SubRequest) - - the compiled query  

| Param | Type | Description |
| --- | --- | --- |
| context | [<code>Context</code>](#OverpassFrontend+Context) | Current context |

<a name="Request+receiveObject"></a>

### request.receiveObject(ob, subRequest, partIndex)
receive an object from OverpassFronted -> enter to cache, return to caller

**Kind**: instance method of [<code>Request</code>](#Request)  

| Param | Type | Description |
| --- | --- | --- |
| ob | [<code>OverpassObject</code>](#OverpassObject) | Object which has been received |
| subRequest | [<code>SubRequest</code>](#Request+SubRequest) | sub request which is being handled right now |
| partIndex | <code>int</code> | Which part of the subRequest is being received |

<a name="Request+finishSubRequest"></a>

### request.finishSubRequest(subRequest)
the current subrequest is finished -> update caches, check whether request is finished

**Kind**: instance method of [<code>Request</code>](#Request)  

| Param | Type | Description |
| --- | --- | --- |
| subRequest | [<code>SubRequest</code>](#Request+SubRequest) | the current sub request |

<a name="Request+event_abort"></a>

### "abort"
Request got aborted

**Kind**: event emitted by [<code>Request</code>](#Request)  
<a name="Request+event_finish"></a>

### "finish"
Request is finished

**Kind**: event emitted by [<code>Request</code>](#Request)  

| Type | Description |
| --- | --- |
| <code>Error</code> \| <code>null</code> | null if no error occured |

<a name="Request+event_subrequest-compiile"></a>

### "subrequest-compiile" (subRequest)
SubRequest got compiled

**Kind**: event emitted by [<code>Request</code>](#Request)  

| Param | Type | Description |
| --- | --- | --- |
| subRequest | [<code>SubRequest</code>](#Request+SubRequest) | the sub request |

<a name="Request+event_subrequest-finished"></a>

### "subrequest-finished" (subRequest)
SubRequest got finished

**Kind**: event emitted by [<code>Request</code>](#Request)  

| Param | Type | Description |
| --- | --- | --- |
| subRequest | [<code>SubRequest</code>](#Request+SubRequest) | the sub request |

<a name="Request+SubRequest"></a>

### request.SubRequest : <code>Object</code>
A compiled query

**Kind**: instance typedef of [<code>Request</code>](#Request)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| query | <code>string</code> | The compiled code |
| parts | <code>Array.&lt;object&gt;</code> | An entry for each part (separated by the 'out count' separator) |
| parts[].properties | <code>int</code> | The properties which each returned map feature has set (TAGS, BBOX, ...) |
| effort | <code>int</code> | Supposed "effort" of this query |
| request | [<code>Request</code>](#Request) | The request this compiled query belongs to |

<a name="Request+minMaxEffortResult"></a>

### request.minMaxEffortResult : <code>Object</code>
**Kind**: instance typedef of [<code>Request</code>](#Request)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| Remaining | <code>number</code> | minimal effort of this request |
| Remaining | <code>number</code> \| <code>null</code> | maximum effort (or null if unknown) |

<a name="RequestBBox"></a>

## RequestBBox ⇐ [<code>Request</code>](#Request)
A BBox request

**Kind**: global class  
**Extends**: [<code>Request</code>](#Request)  

* [RequestBBox](#RequestBBox) ⇐ [<code>Request</code>](#Request)
    * [new RequestBBox(overpass, options)](#new_RequestBBox_new)
    * [.preprocess()](#RequestBBox+preprocess)
    * [.willInclude(context)](#RequestBBox+willInclude) ⇒ <code>boolean</code> \| <code>Array.&lt;int&gt;</code>
    * [.minMaxEffort()](#RequestBBox+minMaxEffort) ⇒ [<code>minMaxEffortResult</code>](#Request+minMaxEffortResult)
    * [._compileQuery(context)](#RequestBBox+_compileQuery) ⇒ [<code>SubRequest</code>](#Request+SubRequest) \| <code>false</code>
    * [.receiveObject(ob, subRequest, partIndex)](#RequestBBox+receiveObject)
    * [.finishSubRequest(subRequest)](#RequestBBox+finishSubRequest)
    * [.needLoad()](#RequestBBox+needLoad) ⇒ <code>boolean</code>
    * [.abort()](#Request+abort)
    * [.finish(err)](#Request+finish)
    * [.compileQuery(context)](#Request+compileQuery) ⇒ [<code>SubRequest</code>](#Request+SubRequest)
    * ["abort"](#Request+event_abort)
    * ["finish"](#Request+event_finish)
    * ["subrequest-compiile" (subRequest)](#Request+event_subrequest-compiile)
    * ["subrequest-finished" (subRequest)](#Request+event_subrequest-finished)
    * [.SubRequest](#Request+SubRequest) : <code>Object</code>
    * [.minMaxEffortResult](#Request+minMaxEffortResult) : <code>Object</code>

<a name="new_RequestBBox_new"></a>

### new RequestBBox(overpass, options)

| Param | Type |
| --- | --- |
| overpass | [<code>OverpassFrontend</code>](#OverpassFrontend) | 
| options | <code>object</code> | 

<a name="RequestBBox+preprocess"></a>

### requestBBox.preprocess()
check if there are any map features which can be returned right now

**Kind**: instance method of [<code>RequestBBox</code>](#RequestBBox)  
<a name="RequestBBox+willInclude"></a>

### requestBBox.willInclude(context) ⇒ <code>boolean</code> \| <code>Array.&lt;int&gt;</code>
shall this Request be included in the current call?

**Kind**: instance method of [<code>RequestBBox</code>](#RequestBBox)  
**Overrides**: [<code>willInclude</code>](#Request+willInclude)  
**Returns**: <code>boolean</code> \| <code>Array.&lt;int&gt;</code> - - yes|no - or [ minEffort, maxEffort ]  

| Param | Type | Description |
| --- | --- | --- |
| context | [<code>Context</code>](#OverpassFrontend+Context) | Current context |

<a name="RequestBBox+minMaxEffort"></a>

### requestBBox.minMaxEffort() ⇒ [<code>minMaxEffortResult</code>](#Request+minMaxEffortResult)
how much effort can a call to this request use

**Kind**: instance method of [<code>RequestBBox</code>](#RequestBBox)  
**Overrides**: [<code>minMaxEffort</code>](#Request+minMaxEffort)  
**Returns**: [<code>minMaxEffortResult</code>](#Request+minMaxEffortResult) - - minimum and maximum effort  
<a name="RequestBBox+_compileQuery"></a>

### requestBBox.\_compileQuery(context) ⇒ [<code>SubRequest</code>](#Request+SubRequest) \| <code>false</code>
compile the query

**Kind**: instance method of [<code>RequestBBox</code>](#RequestBBox)  
**Returns**: [<code>SubRequest</code>](#Request+SubRequest) \| <code>false</code> - - the compiled query or false if the bbox does not match  

| Param | Type | Description |
| --- | --- | --- |
| context | [<code>Context</code>](#OverpassFrontend+Context) | Current context |

<a name="RequestBBox+receiveObject"></a>

### requestBBox.receiveObject(ob, subRequest, partIndex)
receive an object from OverpassFronted -> enter to cache, return to caller

**Kind**: instance method of [<code>RequestBBox</code>](#RequestBBox)  
**Overrides**: [<code>receiveObject</code>](#Request+receiveObject)  

| Param | Type | Description |
| --- | --- | --- |
| ob | [<code>OverpassObject</code>](#OverpassObject) | Object which has been received |
| subRequest | [<code>SubRequest</code>](#Request+SubRequest) | sub request which is being handled right now |
| partIndex | <code>int</code> | Which part of the subRequest is being received |

<a name="RequestBBox+finishSubRequest"></a>

### requestBBox.finishSubRequest(subRequest)
the current subrequest is finished -> update caches, check whether request is finished

**Kind**: instance method of [<code>RequestBBox</code>](#RequestBBox)  
**Overrides**: [<code>finishSubRequest</code>](#Request+finishSubRequest)  

| Param | Type | Description |
| --- | --- | --- |
| subRequest | [<code>SubRequest</code>](#Request+SubRequest) | the current sub request |

<a name="RequestBBox+needLoad"></a>

### requestBBox.needLoad() ⇒ <code>boolean</code>
check if we need to call Overpass API. Maybe whole area is cached anyway?

**Kind**: instance method of [<code>RequestBBox</code>](#RequestBBox)  
**Returns**: <code>boolean</code> - - true, if we need to call Overpass API  
<a name="Request+abort"></a>

### requestBBox.abort()
abort this request

**Kind**: instance method of [<code>RequestBBox</code>](#RequestBBox)  
**Overrides**: [<code>abort</code>](#Request+abort)  
<a name="Request+finish"></a>

### requestBBox.finish(err)
request is finished

**Kind**: instance method of [<code>RequestBBox</code>](#RequestBBox)  
**Overrides**: [<code>finish</code>](#Request+finish)  

| Param | Type | Description |
| --- | --- | --- |
| err | <code>Error</code> \| <code>null</code> | null if no error occured |

<a name="Request+compileQuery"></a>

### requestBBox.compileQuery(context) ⇒ [<code>SubRequest</code>](#Request+SubRequest)
compile the query

**Kind**: instance method of [<code>RequestBBox</code>](#RequestBBox)  
**Overrides**: [<code>compileQuery</code>](#Request+compileQuery)  
**Returns**: [<code>SubRequest</code>](#Request+SubRequest) - - the compiled query  

| Param | Type | Description |
| --- | --- | --- |
| context | [<code>Context</code>](#OverpassFrontend+Context) | Current context |

<a name="Request+event_abort"></a>

### "abort"
Request got aborted

**Kind**: event emitted by [<code>RequestBBox</code>](#RequestBBox)  
**Overrides**: [<code>abort</code>](#Request+event_abort)  
<a name="Request+event_finish"></a>

### "finish"
Request is finished

**Kind**: event emitted by [<code>RequestBBox</code>](#RequestBBox)  
**Overrides**: [<code>finish</code>](#Request+event_finish)  

| Type | Description |
| --- | --- |
| <code>Error</code> \| <code>null</code> | null if no error occured |

<a name="Request+event_subrequest-compiile"></a>

### "subrequest-compiile" (subRequest)
SubRequest got compiled

**Kind**: event emitted by [<code>RequestBBox</code>](#RequestBBox)  
**Overrides**: [<code>subrequest-compiile</code>](#Request+event_subrequest-compiile)  

| Param | Type | Description |
| --- | --- | --- |
| subRequest | [<code>SubRequest</code>](#Request+SubRequest) | the sub request |

<a name="Request+event_subrequest-finished"></a>

### "subrequest-finished" (subRequest)
SubRequest got finished

**Kind**: event emitted by [<code>RequestBBox</code>](#RequestBBox)  
**Overrides**: [<code>subrequest-finished</code>](#Request+event_subrequest-finished)  

| Param | Type | Description |
| --- | --- | --- |
| subRequest | [<code>SubRequest</code>](#Request+SubRequest) | the sub request |

<a name="Request+SubRequest"></a>

### requestBBox.SubRequest : <code>Object</code>
A compiled query

**Kind**: instance typedef of [<code>RequestBBox</code>](#RequestBBox)  
**Overrides**: [<code>SubRequest</code>](#Request+SubRequest)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| query | <code>string</code> | The compiled code |
| parts | <code>Array.&lt;object&gt;</code> | An entry for each part (separated by the 'out count' separator) |
| parts[].properties | <code>int</code> | The properties which each returned map feature has set (TAGS, BBOX, ...) |
| effort | <code>int</code> | Supposed "effort" of this query |
| request | [<code>Request</code>](#Request) | The request this compiled query belongs to |

<a name="Request+minMaxEffortResult"></a>

### requestBBox.minMaxEffortResult : <code>Object</code>
**Kind**: instance typedef of [<code>RequestBBox</code>](#RequestBBox)  
**Overrides**: [<code>minMaxEffortResult</code>](#Request+minMaxEffortResult)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| Remaining | <code>number</code> | minimal effort of this request |
| Remaining | <code>number</code> \| <code>null</code> | maximum effort (or null if unknown) |

<a name="RequestGet"></a>

## RequestGet ⇐ [<code>Request</code>](#Request)
A get request (request list of map features by id)

**Kind**: global class  
**Extends**: [<code>Request</code>](#Request)  

* [RequestGet](#RequestGet) ⇐ [<code>Request</code>](#Request)
    * [new RequestGet(overpass, data)](#new_RequestGet_new)
    * [.minMaxEffort()](#RequestGet+minMaxEffort) ⇒ [<code>minMaxEffortResult</code>](#Request+minMaxEffortResult)
    * [.preprocess()](#RequestGet+preprocess)
    * [._compileQuery(context)](#RequestGet+_compileQuery) ⇒ [<code>SubRequest</code>](#Request+SubRequest)
    * [.abort()](#Request+abort)
    * [.finish(err)](#Request+finish)
    * [.willInclude(context)](#Request+willInclude) ⇒ <code>boolean</code>
    * [.compileQuery(context)](#Request+compileQuery) ⇒ [<code>SubRequest</code>](#Request+SubRequest)
    * [.receiveObject(ob, subRequest, partIndex)](#Request+receiveObject)
    * [.finishSubRequest(subRequest)](#Request+finishSubRequest)
    * ["abort"](#Request+event_abort)
    * ["finish"](#Request+event_finish)
    * ["subrequest-compiile" (subRequest)](#Request+event_subrequest-compiile)
    * ["subrequest-finished" (subRequest)](#Request+event_subrequest-finished)
    * [.SubRequest](#Request+SubRequest) : <code>Object</code>
    * [.minMaxEffortResult](#Request+minMaxEffortResult) : <code>Object</code>

<a name="new_RequestGet_new"></a>

### new RequestGet(overpass, data)

| Param | Type |
| --- | --- |
| overpass | [<code>OverpassFrontend</code>](#OverpassFrontend) | 
| data | <code>data</code> | 

<a name="RequestGet+minMaxEffort"></a>

### requestGet.minMaxEffort() ⇒ [<code>minMaxEffortResult</code>](#Request+minMaxEffortResult)
how much effort can a call to this request use

**Kind**: instance method of [<code>RequestGet</code>](#RequestGet)  
**Overrides**: [<code>minMaxEffort</code>](#Request+minMaxEffort)  
**Returns**: [<code>minMaxEffortResult</code>](#Request+minMaxEffortResult) - - minimum and maximum effort  
<a name="RequestGet+preprocess"></a>

### requestGet.preprocess()
check if there are any map features which can be returned right now

**Kind**: instance method of [<code>RequestGet</code>](#RequestGet)  
<a name="RequestGet+_compileQuery"></a>

### requestGet.\_compileQuery(context) ⇒ [<code>SubRequest</code>](#Request+SubRequest)
compile the query

**Kind**: instance method of [<code>RequestGet</code>](#RequestGet)  
**Returns**: [<code>SubRequest</code>](#Request+SubRequest) - - the compiled query  

| Param | Type | Description |
| --- | --- | --- |
| context | [<code>Context</code>](#OverpassFrontend+Context) | Current context |

<a name="Request+abort"></a>

### requestGet.abort()
abort this request

**Kind**: instance method of [<code>RequestGet</code>](#RequestGet)  
**Overrides**: [<code>abort</code>](#Request+abort)  
<a name="Request+finish"></a>

### requestGet.finish(err)
request is finished

**Kind**: instance method of [<code>RequestGet</code>](#RequestGet)  
**Overrides**: [<code>finish</code>](#Request+finish)  

| Param | Type | Description |
| --- | --- | --- |
| err | <code>Error</code> \| <code>null</code> | null if no error occured |

<a name="Request+willInclude"></a>

### requestGet.willInclude(context) ⇒ <code>boolean</code>
shall this Request be included in the current call?

**Kind**: instance method of [<code>RequestGet</code>](#RequestGet)  
**Overrides**: [<code>willInclude</code>](#Request+willInclude)  
**Returns**: <code>boolean</code> - - yes|no  

| Param | Type | Description |
| --- | --- | --- |
| context | [<code>Context</code>](#OverpassFrontend+Context) | Current context |

<a name="Request+compileQuery"></a>

### requestGet.compileQuery(context) ⇒ [<code>SubRequest</code>](#Request+SubRequest)
compile the query

**Kind**: instance method of [<code>RequestGet</code>](#RequestGet)  
**Overrides**: [<code>compileQuery</code>](#Request+compileQuery)  
**Returns**: [<code>SubRequest</code>](#Request+SubRequest) - - the compiled query  

| Param | Type | Description |
| --- | --- | --- |
| context | [<code>Context</code>](#OverpassFrontend+Context) | Current context |

<a name="Request+receiveObject"></a>

### requestGet.receiveObject(ob, subRequest, partIndex)
receive an object from OverpassFronted -> enter to cache, return to caller

**Kind**: instance method of [<code>RequestGet</code>](#RequestGet)  
**Overrides**: [<code>receiveObject</code>](#Request+receiveObject)  

| Param | Type | Description |
| --- | --- | --- |
| ob | [<code>OverpassObject</code>](#OverpassObject) | Object which has been received |
| subRequest | [<code>SubRequest</code>](#Request+SubRequest) | sub request which is being handled right now |
| partIndex | <code>int</code> | Which part of the subRequest is being received |

<a name="Request+finishSubRequest"></a>

### requestGet.finishSubRequest(subRequest)
the current subrequest is finished -> update caches, check whether request is finished

**Kind**: instance method of [<code>RequestGet</code>](#RequestGet)  
**Overrides**: [<code>finishSubRequest</code>](#Request+finishSubRequest)  

| Param | Type | Description |
| --- | --- | --- |
| subRequest | [<code>SubRequest</code>](#Request+SubRequest) | the current sub request |

<a name="Request+event_abort"></a>

### "abort"
Request got aborted

**Kind**: event emitted by [<code>RequestGet</code>](#RequestGet)  
**Overrides**: [<code>abort</code>](#Request+event_abort)  
<a name="Request+event_finish"></a>

### "finish"
Request is finished

**Kind**: event emitted by [<code>RequestGet</code>](#RequestGet)  
**Overrides**: [<code>finish</code>](#Request+event_finish)  

| Type | Description |
| --- | --- |
| <code>Error</code> \| <code>null</code> | null if no error occured |

<a name="Request+event_subrequest-compiile"></a>

### "subrequest-compiile" (subRequest)
SubRequest got compiled

**Kind**: event emitted by [<code>RequestGet</code>](#RequestGet)  
**Overrides**: [<code>subrequest-compiile</code>](#Request+event_subrequest-compiile)  

| Param | Type | Description |
| --- | --- | --- |
| subRequest | [<code>SubRequest</code>](#Request+SubRequest) | the sub request |

<a name="Request+event_subrequest-finished"></a>

### "subrequest-finished" (subRequest)
SubRequest got finished

**Kind**: event emitted by [<code>RequestGet</code>](#RequestGet)  
**Overrides**: [<code>subrequest-finished</code>](#Request+event_subrequest-finished)  

| Param | Type | Description |
| --- | --- | --- |
| subRequest | [<code>SubRequest</code>](#Request+SubRequest) | the sub request |

<a name="Request+SubRequest"></a>

### requestGet.SubRequest : <code>Object</code>
A compiled query

**Kind**: instance typedef of [<code>RequestGet</code>](#RequestGet)  
**Overrides**: [<code>SubRequest</code>](#Request+SubRequest)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| query | <code>string</code> | The compiled code |
| parts | <code>Array.&lt;object&gt;</code> | An entry for each part (separated by the 'out count' separator) |
| parts[].properties | <code>int</code> | The properties which each returned map feature has set (TAGS, BBOX, ...) |
| effort | <code>int</code> | Supposed "effort" of this query |
| request | [<code>Request</code>](#Request) | The request this compiled query belongs to |

<a name="Request+minMaxEffortResult"></a>

### requestGet.minMaxEffortResult : <code>Object</code>
**Kind**: instance typedef of [<code>RequestGet</code>](#RequestGet)  
**Overrides**: [<code>minMaxEffortResult</code>](#Request+minMaxEffortResult)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| Remaining | <code>number</code> | minimal effort of this request |
| Remaining | <code>number</code> \| <code>null</code> | maximum effort (or null if unknown) |

<a name="RequestMulti"></a>

## RequestMulti ⇐ [<code>Request</code>](#Request)
A request consisting of several requests - duplicate results will be filtered

**Kind**: global class  
**Extends**: [<code>Request</code>](#Request)  

* [RequestMulti](#RequestMulti) ⇐ [<code>Request</code>](#Request)
    * [.abort()](#RequestMulti+abort)
    * [.finish(err)](#Request+finish)
    * [.willInclude(context)](#Request+willInclude) ⇒ <code>boolean</code>
    * [.minMaxEffort()](#Request+minMaxEffort) ⇒ [<code>minMaxEffortResult</code>](#Request+minMaxEffortResult)
    * [.compileQuery(context)](#Request+compileQuery) ⇒ [<code>SubRequest</code>](#Request+SubRequest)
    * [.receiveObject(ob, subRequest, partIndex)](#Request+receiveObject)
    * [.finishSubRequest(subRequest)](#Request+finishSubRequest)
    * ["abort"](#Request+event_abort)
    * ["finish"](#Request+event_finish)
    * ["subrequest-compiile" (subRequest)](#Request+event_subrequest-compiile)
    * ["subrequest-finished" (subRequest)](#Request+event_subrequest-finished)
    * [.SubRequest](#Request+SubRequest) : <code>Object</code>
    * [.minMaxEffortResult](#Request+minMaxEffortResult) : <code>Object</code>

<a name="RequestMulti+abort"></a>

### requestMulti.abort()
abort this request and sub requests

**Kind**: instance method of [<code>RequestMulti</code>](#RequestMulti)  
**Overrides**: [<code>abort</code>](#Request+abort)  
<a name="Request+finish"></a>

### requestMulti.finish(err)
request is finished

**Kind**: instance method of [<code>RequestMulti</code>](#RequestMulti)  
**Overrides**: [<code>finish</code>](#Request+finish)  

| Param | Type | Description |
| --- | --- | --- |
| err | <code>Error</code> \| <code>null</code> | null if no error occured |

<a name="Request+willInclude"></a>

### requestMulti.willInclude(context) ⇒ <code>boolean</code>
shall this Request be included in the current call?

**Kind**: instance method of [<code>RequestMulti</code>](#RequestMulti)  
**Overrides**: [<code>willInclude</code>](#Request+willInclude)  
**Returns**: <code>boolean</code> - - yes|no  

| Param | Type | Description |
| --- | --- | --- |
| context | [<code>Context</code>](#OverpassFrontend+Context) | Current context |

<a name="Request+minMaxEffort"></a>

### requestMulti.minMaxEffort() ⇒ [<code>minMaxEffortResult</code>](#Request+minMaxEffortResult)
how much effort can a call to this request use

**Kind**: instance method of [<code>RequestMulti</code>](#RequestMulti)  
**Overrides**: [<code>minMaxEffort</code>](#Request+minMaxEffort)  
**Returns**: [<code>minMaxEffortResult</code>](#Request+minMaxEffortResult) - - minimum and maximum effort  
<a name="Request+compileQuery"></a>

### requestMulti.compileQuery(context) ⇒ [<code>SubRequest</code>](#Request+SubRequest)
compile the query

**Kind**: instance method of [<code>RequestMulti</code>](#RequestMulti)  
**Overrides**: [<code>compileQuery</code>](#Request+compileQuery)  
**Returns**: [<code>SubRequest</code>](#Request+SubRequest) - - the compiled query  

| Param | Type | Description |
| --- | --- | --- |
| context | [<code>Context</code>](#OverpassFrontend+Context) | Current context |

<a name="Request+receiveObject"></a>

### requestMulti.receiveObject(ob, subRequest, partIndex)
receive an object from OverpassFronted -> enter to cache, return to caller

**Kind**: instance method of [<code>RequestMulti</code>](#RequestMulti)  
**Overrides**: [<code>receiveObject</code>](#Request+receiveObject)  

| Param | Type | Description |
| --- | --- | --- |
| ob | [<code>OverpassObject</code>](#OverpassObject) | Object which has been received |
| subRequest | [<code>SubRequest</code>](#Request+SubRequest) | sub request which is being handled right now |
| partIndex | <code>int</code> | Which part of the subRequest is being received |

<a name="Request+finishSubRequest"></a>

### requestMulti.finishSubRequest(subRequest)
the current subrequest is finished -> update caches, check whether request is finished

**Kind**: instance method of [<code>RequestMulti</code>](#RequestMulti)  
**Overrides**: [<code>finishSubRequest</code>](#Request+finishSubRequest)  

| Param | Type | Description |
| --- | --- | --- |
| subRequest | [<code>SubRequest</code>](#Request+SubRequest) | the current sub request |

<a name="Request+event_abort"></a>

### "abort"
Request got aborted

**Kind**: event emitted by [<code>RequestMulti</code>](#RequestMulti)  
**Overrides**: [<code>abort</code>](#Request+event_abort)  
<a name="Request+event_finish"></a>

### "finish"
Request is finished

**Kind**: event emitted by [<code>RequestMulti</code>](#RequestMulti)  
**Overrides**: [<code>finish</code>](#Request+event_finish)  

| Type | Description |
| --- | --- |
| <code>Error</code> \| <code>null</code> | null if no error occured |

<a name="Request+event_subrequest-compiile"></a>

### "subrequest-compiile" (subRequest)
SubRequest got compiled

**Kind**: event emitted by [<code>RequestMulti</code>](#RequestMulti)  
**Overrides**: [<code>subrequest-compiile</code>](#Request+event_subrequest-compiile)  

| Param | Type | Description |
| --- | --- | --- |
| subRequest | [<code>SubRequest</code>](#Request+SubRequest) | the sub request |

<a name="Request+event_subrequest-finished"></a>

### "subrequest-finished" (subRequest)
SubRequest got finished

**Kind**: event emitted by [<code>RequestMulti</code>](#RequestMulti)  
**Overrides**: [<code>subrequest-finished</code>](#Request+event_subrequest-finished)  

| Param | Type | Description |
| --- | --- | --- |
| subRequest | [<code>SubRequest</code>](#Request+SubRequest) | the sub request |

<a name="Request+SubRequest"></a>

### requestMulti.SubRequest : <code>Object</code>
A compiled query

**Kind**: instance typedef of [<code>RequestMulti</code>](#RequestMulti)  
**Overrides**: [<code>SubRequest</code>](#Request+SubRequest)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| query | <code>string</code> | The compiled code |
| parts | <code>Array.&lt;object&gt;</code> | An entry for each part (separated by the 'out count' separator) |
| parts[].properties | <code>int</code> | The properties which each returned map feature has set (TAGS, BBOX, ...) |
| effort | <code>int</code> | Supposed "effort" of this query |
| request | [<code>Request</code>](#Request) | The request this compiled query belongs to |

<a name="Request+minMaxEffortResult"></a>

### requestMulti.minMaxEffortResult : <code>Object</code>
**Kind**: instance typedef of [<code>RequestMulti</code>](#RequestMulti)  
**Overrides**: [<code>minMaxEffortResult</code>](#Request+minMaxEffortResult)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| Remaining | <code>number</code> | minimal effort of this request |
| Remaining | <code>number</code> \| <code>null</code> | maximum effort (or null if unknown) |

<a name="KnownArea"></a>

## KnownArea
When loading area after area of a map, it will be more and more complete.
This class manages which area is already known and which not.

**Kind**: global class  

* [KnownArea](#KnownArea)
    * [.add()](#KnownArea+add)
    * [.check()](#KnownArea+check)
    * [.toGeoJSON()](#KnownArea+toGeoJSON)

<a name="KnownArea+add"></a>

### knownArea.add()
make another part of the map known

**Kind**: instance method of [<code>KnownArea</code>](#KnownArea)  
<a name="KnownArea+check"></a>

### knownArea.check()
is the whole area known?

**Kind**: instance method of [<code>KnownArea</code>](#KnownArea)  
<a name="KnownArea+toGeoJSON"></a>

### knownArea.toGeoJSON()
return area as (multi)polygon

**Kind**: instance method of [<code>KnownArea</code>](#KnownArea)  
