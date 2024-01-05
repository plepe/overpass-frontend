# OverpassFrontend
A JavaScript (NodeJS/Browser) library to easily access data from OpenStreetMap via Overpass API or from an OSM File. The objects can directly be used with LeafletJS or exported to GeoJSON. Data will be cached in the browser memory (persistent caching in LocalStorage or so may be added in the future).

# INSTALLATION
```sh
npm install --save overpass-frontend
```

# EXAMPLES
## BBOX Query
You can execute this example as: `node example-bbox.js`

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

## By ID
You can execute this example as: `node example-by-id.js`

```js
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
```

# DOCUMENTATION
Find documentation in [doc](https://rawgit.com/plepe/overpass-frontend/master/doc/OverpassFrontend.html). You can re-generate the documentation with `npm run doc`.

## The following queries are supported:
### Type
| Type | Description
|------|------------
| node | Query all nodes
| way  | Query all ways
| relation | Query all relations
| nwr  | Query any type (node, way, relation)

### Filters
Every query can have any amount of filters, e.g. `nwr[amenity=restraunt][name]` (all restaurants with a name).

| Filter               | Description                                |
|----------------------|--------------------------------------------|
| nwr[name=Foo]        | Tag 'name' equals 'Foo'                    |
| nwr["name"="Foo"]    | Tag 'name' equals 'Foo'                    |
| nwr[name!=Foo]       | Tag 'name' not equals 'Foo'                |
| nwr[name]            | Any object with a tag 'name', any value    |
| nwr[!name]           | Any object without a tag 'name'            |
| nwr[name&#126;"^foo$"]    | Regular expression, case sensitive         |
| nwr[name&#126;"^foo$",i]  | Regular expression, case insenstive        |
| nwr[&#126;"^name$"&#126;"^foo$"] | Regular expression for tag and value     |
| nwr[&#126;"^name$"&#126;"^foo$",i] | Case insenstive regular expression for tag and value |
| nwr[&#126;"^name$"&#126;"."]   | Regular expression for tag with any value  |
| nwr[name!&#126;"foo"]     | Negated Regular expression                 |
| nwr[cuisine^pizza]   | (non-standard) Search for semi-colon separated multi-value tags, containing the string (matches e.g. "kebap;pizza;noodles"). |
| nwr[name%foo]        | (non-standard) Search for strings containing "foo" where diacritics match too (e.g. ö, ó, ...). |
| nwr(48.1,16.1,48.2,16.2) | Query objects in the specified bounding-box (south,west,north,east) |
| node(1234)           | Query by id                                |
| node(id:1234,2345)   | Query by several ids                       |
| node(around:10,48.1,16.1) | Query objects in distance (meters) around the location (lat,lon) |
| node(around:10,48.1,16.1,48.2,16.2,...) | Query objects in distance (meters) around the linestring (pairs of lat,lon) |
| node(poly:"48.1 16.1 48.2 16.1 48.2 16.2") | Query objects inside the polygon (min 3 pairs of lat lon) |
| node(user:"Alice","Bob") | Query objects last edited by user "Alice" or "Bob"  |
| node(uid:1,2,3)      | Query objects last edited by the users with uid 1, 2 or 3 |
| node(newer:"2020-01-01T00:00:00Z") | Query objects that are newer (or equal) than the specified timestamp |
| node(if:t["name"]=="foo") | Conditional query filter, see below |

### Conditional query filters
node(if: &lt;Evaluator&gt;)

Values can either by numbers (3, 3.14159) or strings ("foo" or 'foo'). 0 or empty string counts as false.

The following operators are available (ordered weak to string binding):

| Operator | Description                   |
|----------|-------------------------------|
| ?:       | Ternary operator              |
| ||       | Logical disjunction           |
| &amp;&amp; | Logical conjunction         |
| == !=    | equality, inequality          |
| &lt; &lt;= &gt; &gt;= | less, less-equal, greater, greater-equal |
| + -      | plus, binary minus            |
| * /      | times, devided                |
| !        | logical negation              |
| -        | unary minus (internally, — will be used) |

The following functions are available:

| Function | Description                   |
|----------|-------------------------------|
| t["name"] | Value of the tag "name" (internally, the identifier 'tag' will be used) |
| is_tag("name") | Returns 1 if the object has a tag "name", 0 otherwise. |
| is_closed() | For ways, returns 1 if the first member equals the last member. 0 otherwise.
| id()     | Returns the ID of the object  |
| type()   | Returns the type of the object |
| version() | Returns the version number of the object |
| timestamp() | Returns the timestamp of the last edit of the object |
| changeset() | Returns the changeset id of the object in which it has been last edited |
| uid() | Returns the id of the user who last edited the object |
| user() | Returns the name of the user who last edited the object |
| debug(...) | Prints the value of the parameter to the JavaScript development console, returns the value |
| count_tags() | Returns the count of tags of the object |
| count_members() | Returns the number of members |
| count_by_role(...) | Returns the number of members with the specified role |
| count_distinct_members() | Returns the distinct number of members |
| count_distinct_by_role(...) | Returns the distinct number of members with the specified role |
| length() | Returns the length of the object in meters (0 for nodes) |
| is_closed() | Returns 1 if the object is a way and the first member is equal to the last member. |

Examples:
```
node(if:count_tags() > 5 || t["name"] == "foo")
node(if:debug(id()))
```

# DEVELOPMENT

To run unit tests, you need to have a local Overpass API server installed.
For that, you can either set it up manually or use a pre-made Docker image.

## Docker

First, you need to build Docker images for osm3s, the Overpass API server. Please refer to the [official repository](https://github.com/drolbr/docker-overpass) for building instructions.

Once you have built the images, you can build and run the image containing test data for `overpass-frontend`:

```sh
cd test/

# Use the default test configuration for Docker
cp ./conf.json-docker ./conf.js

# Build the test server image
docker build -t overpass-frontend-test .

# Run the test server (it will be exposed on the port number 8080)
docker run -p 8080:80 -it --rm overpass-frontend-test
```

Now you can run unit tests:

```
npm install
npm run test
```

## Manual setup

Please follow the installation instructions for [osm3s](https://wiki.openstreetmap.org/wiki/Overpass_API/Installation).

Before running unit tests, you should copy `test/conf.json-dist` to `test/conf.json` and change the configuration parameters. They should point to your local server address.

To run the tests, execute the following commands:

```sh
git clone https://github.com/plepe/overpass-frontend
cd overpass-frontend
npm install

# Initialize database for unit tests (ignore messages because of missing nodes/ways)
# replace /exec/path by the location where you installed osm3s
init_osm3s.sh test/data.osm.bz2 test/data/ /exec/path --meta

# Initialize attac database
mkdir test/history
mkdir tmp
unzip test/history.osc.zip -d tmp
for i in tmp/*.osc ; do update_database --db-dir=test/history --keep-attic < $i ; done
rm -r tmp/

# Run unit tests
npm run test
# Check code style (Standard JS)
npm run lint
```
