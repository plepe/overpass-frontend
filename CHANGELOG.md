# Version 2.2 - release 2018-12-04
All OverpassObjects (Node, Way, Relation) have new functions `exportGeoJSON()`, `exportOSMXML()` and `exportOSMJSON()` which export the object in the specified format. Check the documentation for further details.

# Version 2.1 - release 2018-11-13
Calculate 'connectedPrev', 'connectedNext' and 'dir' for members of type way in relations.

# Version 2.0 - release 2018-10-18
overpass-frontend now internally uses the in-memory LokiJS database to look for
matching objects in its cache. This also enables overpass-frontend to
load a .osm or .osm.bz2 or .json file which works as an internal database - no
queries to an Overpass API will be done in that case. Just pass a relative path to file name as url, when initializing OverpassFrontend.
