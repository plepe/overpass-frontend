# Version 3.1.0 - upcoming
* .BBoxQuery() now accept the option 'limit' - limit count of returned features.

# Version 3.0.0 - release 2022-10-24
* Improved cache handling - the query checks, if a super-set of that query has successfully been downloaded for the given area, which reduces the need for server requests. Example: if 'nwr[amenity]' for the given area has been downloaded, 'node[amenity=restaurant]' or 'way[amenity][cuisine]' are included.
* New filters: `(id:...)`, bbox `(lat,lon,lat,lon)`, `(around:...)`, `(user:...)`, `(uid:...)`, `(poly:...)`, `(if:...`), `(newer:...)`.
* For the `(if:...)` filter, the following evaluators functions are available: t[], is_tag(), is_closed(), id(), type(), version(), timestamp(), changeset(), uid(), user(), count_tags(), count_members(), count_by_role(), count_distinct_members(), count_distinct_by_role(), length(), is_closed() as well as the following operators: ternary `...?...:...`, ||, &amp;&amp;, ==, !=, &lt;, &lt;=, &gt;, &gt;=, +, -, *, /, !, -.

# Version 2.7.0 - release 2021-12-30
* Bounds and memberBounds for .get() and .BBoxQuery() accept GeoJSON polygons/multipolygons
* .BBoxQuery() now accepts empty bounds (query the whole world)

# Version 2.6.0 - release 2021-12-25
* OverpassObject.intersect(): accept geojson polygon/multipolygon as boundary
* Improve support for multipolygons crossing lon180
* Decrease npm package size

# Version 2.5.0 - release 2021-08-29
* When the server fails with 429 error, gradually increase time gaps.
* Emit more events: 'start', 'load', 'reject', 'error'
* Improve loading referenced objects from 'out geom'

# Version 2.4.2 - release 2019-03-27
Support combining filters with 'and'.

# Version 2.4 - release 2019-03-01
Support for queries stretching longitude 180, resp. returning shifted geometries (to show an object shifted by 360 degrees).

# Version 2.3 - release 2019-01-31
Improved Filters.

# Version 2.2 - release 2018-12-04
All OverpassObjects (Node, Way, Relation) have new functions `exportGeoJSON()`, `exportOSMXML()` and `exportOSMJSON()` which export the object in the specified format. Check the documentation for further details.

# Version 2.1 - release 2018-11-13
Calculate 'connectedPrev', 'connectedNext' and 'dir' for members of type way in relations.

# Version 2.0 - release 2018-10-18
overpass-frontend now internally uses the in-memory LokiJS database to look for
matching objects in its cache. This also enables overpass-frontend to
load a .osm or .osm.bz2 or .json file which works as an internal database - no
queries to an Overpass API will be done in that case. Just pass a relative path to file name as url, when initializing OverpassFrontend.
