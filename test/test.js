var fs = require('fs')
var conf = JSON.parse(fs.readFileSync('test/conf.json', 'utf8'));

var assert = require('assert')

var OverpassFrontend = require('../src/OverpassFrontend')
var BoundingBox = require('boundingbox')
var overpassFrontend = new OverpassFrontend(conf.url)


describe('Overpass get', function() {
  describe('single id', function() {
    it('should return an existing relation', function(done) {
      overpassFrontend.get('r910885', { properties: OverpassFrontend.ALL },
        function(err, result, index) {
          if(err)
            done(err)

          if(result.id == 'r910885')
            done()
          else
            done('wrong object?')
        },
        function(err) {
        })
    })

    it('should return null for a missing object', function(done) {
      overpassFrontend.get('r32', { properties: OverpassFrontend.ALL },
        function(err, result, index) {
          if(result !== null) {
            done('r32 should not exist!')
          }
        },
        function(err) {
          done(err);
        })
    })

    it('option "sort": should return ordered by id (even when cached)', function(done) {
      var items = [ 'r910885', 'n3037893169', 'r910885', 'w146678749' ]
      var lastIndex = null

      overpassFrontend.get(
        items,
        {
          sort: true,
          properties: OverpassFrontend.ID_ONLY
        },
        function(err, result, index) {
          if (err) {
            assert(false, 'Error: ' + err)
          }

          var p = items.indexOf(result.id)
          if (p === -1) {
            assert(false, 'Object ' + result.id + ' should not be found')
          }

          if (items[index] !== result.id) {
            assert(false, 'Object ' + result.id + ': wrong index ' + index + '!')
          }

          if (lastIndex === null) {
            if (index !== 0) {
              assert(false, 'Object ' + result.id + ' (Index ' + index + '): should not be first element')
            }
          } else {
            if (index !== lastIndex + 1) {
              assert(false, 'Object ' + result.id + ' (Index ' + index + '): should not come after ' + lastIndex)
            }
          }
          lastIndex = index
        },
        function(err) {
          assert.equal(items.length, lastIndex + 1, 'Should return ' + items.length + ' elements')

          done(err)
        })
    })

    it('option "sort"="BBoxDiagonalLength"', function(done) {
      var items = [ 'w125586435', 'w299696929', 'w174711686', 'w247954720' ]
      var expected = [ 'w247954720', 'w174711686', 'w125586435', 'w299696929' ]
      var lastIndex = null

      overpassFrontend.get(
        items,
        {
          sort: 'BBoxDiagonalLength',
          properties: OverpassFrontend.BBOX
        },
        function(err, result, index) {
          if (err) {
            assert(false, 'Error: ' + err)
          }

          var p = expected.indexOf(result.id)
          if (p === -1) {
            assert(false, 'Object ' + result.id + ' should not be found')
          }

          if (expected[index] !== result.id) {
            assert(false, 'Object ' + result.id + ': wrong index ' + index + '!')
          }

          if (lastIndex === null) {
            if (index !== 0) {
              assert(false, 'Object ' + result.id + ' (Index ' + index + '): should not be first element')
            }
          } else {
            if (index !== lastIndex + 1) {
              assert(false, 'Object ' + result.id + ' (Index ' + index + '): should not come after ' + lastIndex)
            }
          }
          lastIndex = index
        },
        function(err) {
          assert.equal(expected.length, lastIndex + 1, 'Should return ' + expected.length + ' elements')

          done(err)
        })
    })
  })

  describe('GeoJSON', function() {
    it('node', function(done) {
      overpassFrontend.get('n3037893169', { properties: OverpassFrontend.ALL },
        function(err, result, index) {
	  var geojson = result.GeoJSON();
          //console.log(JSON.stringify(geojson, null, '  '))

          assert.deepEqual({
	    "type": "Feature",
	    "id": "node/3037893169",
	    "geometry": {
	      "type": "Point",
	      "coordinates": [ 16.3384675, 48.1984802 ]
	    },
	    "properties": {
	      "amenity": "bench",
	      "backrest": "yes",
	      "material": "wood",
	      "source": "survey",
	      "@changeset": 24967165,
	      "@id": "node/3037893169",
	      "@timestamp": "2014-08-23T23:04:34Z",
	      "@uid": 770238,
	      "@user": "Kevin Kofler",
	      "@version": 1
	    }
	  },
          geojson);

          done();
        },
        function(err) {
        })
    })

    it('way', function(done) {
      overpassFrontend.get('w146678749', { properties: OverpassFrontend.ALL },
        function(err, result, index) {
	  var geojson = result.GeoJSON();

          assert.deepEqual({
	    "type": "Feature",
	    "id": "way/146678749",
	    "geometry": {
	      "type": "LineString",
	      "coordinates": [
		[ 16.3408935, 48.1986759 ],
		[ 16.3402714, 48.1985783 ],
		[ 16.3398928, 48.1985189 ],
		[ 16.3392533, 48.1984151 ]
	      ]
	    },
	    "properties": {
	      "highway": "residential",
	      "is_in": "Austria, Europe,Vienna,Wien",
	      "lit": "yes",
	      "maxspeed": "30",
	      "name": "Stollgasse",
	      "oneway": "yes",
	      "source:maxspeed": "AT:zone:30",
	      "@changeset": 18574192,
	      "@id": "way/146678749",
	      "@timestamp": "2013-10-27T20:43:03Z",
	      "@uid": 1066249,
	      "@user": "Railjet",
	      "@version": 5
	    }
	  },
          geojson);

          done();
        },
        function(err) {
        })
    })
  })

  describe('bbox query', function() {
    it('should return a list of node features', function(done) {
      var found = []
      var expected = [ 'n3037893162', 'n3037893163', 'n3037893164' ]

      overpassFrontend.BBoxQuery(
        'node[amenity=bench];',
        {
          minlon: 16.3384616,
          minlat: 48.1990347,
          maxlon: 16.3386118,
          maxlat: 48.1991437
        },
        {
          properties: OverpassFrontend.ID_ONLY
        },
        function(err, result, index) {
          found.push(result.id)

          if(expected.indexOf(result.id) == -1)
            assert(false, 'Object ' + result.id + ' should not be found!')
        },
        function(err) {
          if(found.length != expected.length)
            assert(false, 'Wrong count of objects found!')

          done()
        }
      )
    })

    it('should return a list of node features (2nd try, partly cached)', function(done) {
      var found = []
      var expected = [ 'n3037893162', 'n3037893163', 'n3037893164', 'n3037893159', 'n3037893160' ]

      overpassFrontend.BBoxQuery(
        'node[amenity=bench];',
        {
          minlon: 16.3382616,
          minlat: 48.1990347,
          maxlon: 16.3386118,
          maxlat: 48.1991437
        },
        {
          properties: OverpassFrontend.ID_ONLY
        },
        function(err, result, index) {
          found.push(result.id)

          if(expected.indexOf(result.id) == -1)
            assert(false, 'Object ' + result.id + ' should not be found!')
        },
        function(err) {
          if(found.length != expected.length)
            assert(false, 'Wrong count of objects found!')

          done()
        }
      )
    })

    it('should return a list of way features', function(done) {
      var found = []
      var expected = [ 'w299709373' ]
      var might = [ 'w299709375' ] // correct, if only bbox check is used

      overpassFrontend.BBoxQuery(
        'way[highway=footway];',
        {
          minlon: 16.3384616,
          minlat: 48.1990347,
          maxlon: 16.3386118,
          maxlat: 48.1991437
        },
        {
          properties: OverpassFrontend.ID_ONLY
        },
        function(err, result, index) {
          found.push(result.id)

          if(expected.indexOf(result.id) === -1 &&
             might.indexOf(result.id) !== -1)
            assert(false, 'Object ' + result.id + ' should not be found!')
        },
        function(err) {
          if(found.length != expected.length)
            assert(false, 'Wrong count of objects found!')

          done()
        }
      )
    })

    it('should return a list of way features (2nd try, partly cached)', function(done) {
      var found = []
      var expected = [ 'w299709373', 'w299709375' ]

      overpassFrontend.BBoxQuery(
        'way[highway=footway];',
        {
          minlon: 16.3382616,
          minlat: 48.1990347,
          maxlon: 16.3386118,
          maxlat: 48.1991437
        },
        {
          properties: OverpassFrontend.ID_ONLY
        },
        function(err, result, index) {
          found.push(result.id)

          if(expected.indexOf(result.id) == -1)
            assert(false, 'Object ' + result.id + ' should not be found!')
        },
        function(err) {
          if(found.length != expected.length)
            assert(false, 'Wrong count of objects found!')

          done()
        }
      )
    })

    it('should return a list of way features (3rd try, fully cached)', function(done) {
      var expectedFound = []
      var expected = [ 'w299709373' ]
      var might = [ 'w299709375' ] // correct, if only bbox check is used

      overpassFrontend.BBoxQuery(
        'way[highway=footway];',
        {
          minlon: 16.3384616,
          minlat: 48.1990347,
          maxlon: 16.3386118,
          maxlat: 48.1991437
        },
        {
          properties: OverpassFrontend.ID_ONLY
        },
        function(err, result, index) {
          if(expected.indexOf(result.id) !== -1)
            expectedFound.push(result.id)

          if(expected.indexOf(result.id) === -1 &&
             might.indexOf(result.id) === -1)
            assert(false, 'Object ' + result.id + ' should not be found!')
        },
        function(err) {
          if(expectedFound.length != expected.length)
            assert(false, 'Wrong count of objects found!')

          done()
        }
      )
    })
  })
  describe('removeFromCache()', function() {
    // TODO: Missing!
  })
})

describe('Overpass query by id with bbox option', function() {
  it('First call', function(done) {
    var query = [ 'w299709373', 'w299709375', 'w4583442', 'w299704585', 'n2832485845', 'n3037893162', 'r20313', 'r3636229', 'r3311614' ]
    var expected = [ 'w299709373', 'w299709375', 'n3037893162', 'r3636229', 'r20313' ]
    var index_outside_bbox = [ 2, 3, 4, 5, 8 ]
    var bbox = {
            minlon: 16.3384616,
            minlat: 48.1990347,
            maxlon: 16.3386118,
            maxlat: 48.1991437
          }

    overpassFrontend.get(query.concat([]), { properties: OverpassFrontend.ALL, bbox: bbox },
        function(err, result, index) {
          if (result === false && index_outside_bbox.indexOf(index) == -1)
              assert(false, 'Index ' + index + ' should return a valid result (' + query[index] + ')')

          if(result !== false && expected.indexOf(result.id) == -1)
            assert(false, 'Returning object ' + result.id + ' which should not be returned')
        },
        function(err) {
          done()
        }
    )
  })

  it('Second call', function(done) {
    var query = [ 'w299709373', 'w299709375', 'w4583442', 'w299704585', 'n2832485845', 'n3037882439', 'n3037893162' ]
    var expected = [ 'w299709375', 'w299704585' ]
    var index_outside_bbox = [ 0, 2, 4, 5, 6 ]
    var bbox = {
            minlat: 48.1996955,
            minlon: 16.3381572,
            maxlat: 48.1998337,
            maxlon: 16.3382651
          }

    overpassFrontend.get(query.concat([]), { properties: OverpassFrontend.ALL, bbox: bbox },
        function(err, result, index) {
          if (result === false && index_outside_bbox.indexOf(index) == -1)
              assert(false, 'Index ' + index + ' should return a valid result (' + query[index] + ')')

          if(result !== false && expected.indexOf(result.id) == -1)
            assert(false, 'Returning object ' + result.id + ' which should not be returned')
        },
        function(err) {
          done()
        }
    )
  })
})

describe('Overpass objects structure', function() {
  describe('Node', function() {
    it('Overpass.ID_ONLY', function(done) {
      overpassFrontend.removeFromCache('n3037893169')
      overpassFrontend.get('n3037893169', { properties: OverpassFrontend.ID_ONLY },
        function(err, result, index) {
          assert.equal('n3037893169', result.id)
          assert.equal(3037893169, result.osm_id)
          assert.equal('node', result.type)
        },
        function(err) {
          done()
        }
      )
    })
    it('Overpass.TAGS', function(done) {
      overpassFrontend.removeFromCache('n3037893169')
      overpassFrontend.get('n3037893169', { properties: OverpassFrontend.TAGS },
        function(err, result, index) {
          assert.deepEqual({
            "amenity": "bench",
            "backrest": "yes",
            "material": "wood",
            "source": "survey"
          }, result.tags)
        },
        function(err) {
          done()
        }
      )
    })
    it('Overpass.META', function(done) {
      overpassFrontend.removeFromCache('n3037893169')
      overpassFrontend.get('n3037893169', { properties: OverpassFrontend.META },
        function(err, result, index) {
          assert.deepEqual({
	    "changeset": 24967165,
	    "timestamp": "2014-08-23T23:04:34Z",
	    "uid": 770238,
	    "user": "Kevin Kofler",
	    "version": 1
          }, result.meta)
        },
        function(err) {
          done()
        }
      )
    })
    it('Overpass.MEMBERS', function(done) {
      overpassFrontend.removeFromCache('n3037893169')
      overpassFrontend.get('n3037893169', { properties: OverpassFrontend.MEMBERS },
        function(err, result, index) {
          assert.deepEqual([], result.member_ids())
        },
        function(err) {
          done()
        }
      )
    })
    it('Overpass.BBOX', function(done) {
      overpassFrontend.removeFromCache('n3037893169')
      overpassFrontend.get('n3037893169', { properties: OverpassFrontend.BBOX },
        function(err, result, index) {
          assert.deepEqual({
	    "maxlat": 48.1984802,
	    "maxlon": 16.3384675,
	    "minlat": 48.1984802,
	    "minlon": 16.3384675
          }, result.bounds.bounds)
	  // TODO: knowledge of internal structure of BoundingBox necessary?
        },
        function(err) {
          done()
        }
      )
    })
    it('Overpass.GEOM', function(done) {
      overpassFrontend.removeFromCache('n3037893169')
      overpassFrontend.get('n3037893169', { properties: OverpassFrontend.GEOM },
        function(err, result, index) {
          assert.deepEqual({
	    "lat": 48.1984802,
	    "lon": 16.3384675
          }, result.geometry)
        },
        function(err) {
          done()
        }
      )
    })
    it('Overpass.CENTER', function(done) {
      overpassFrontend.removeFromCache('n3037893169')
      overpassFrontend.get('n3037893169', { properties: OverpassFrontend.CENTER },
        function(err, result, index) {
          assert.deepEqual({
	    "lat": 48.1984802,
	    "lon": 16.3384675
          }, result.center)
        },
        function(err) {
          done()
        }
      )
    })
    it('Overpass.ALL', function(done) {
      overpassFrontend.removeFromCache('n3037893169')
      overpassFrontend.get('n3037893169', { properties: OverpassFrontend.ALL },
        function(err, result, index) {
          assert.equal('n3037893169', result.id)
          assert.equal(3037893169, result.osm_id)
          assert.equal('node', result.type)
          assert.deepEqual({
            "amenity": "bench",
            "backrest": "yes",
            "material": "wood",
            "source": "survey"
          }, result.tags)
          assert.deepEqual({
	    "changeset": 24967165,
	    "timestamp": "2014-08-23T23:04:34Z",
	    "uid": 770238,
	    "user": "Kevin Kofler",
	    "version": 1
          }, result.meta)
          assert.deepEqual([], result.member_ids())
          assert.deepEqual({
	    "maxlat": 48.1984802,
	    "maxlon": 16.3384675,
	    "minlat": 48.1984802,
	    "minlon": 16.3384675
          }, result.bounds.bounds)
	  // TODO: knowledge of internal structure of BoundingBox necessary?
          assert.deepEqual({
	    "lat": 48.1984802,
	    "lon": 16.3384675
          }, result.geometry)
          assert.deepEqual({
	    "lat": 48.1984802,
	    "lon": 16.3384675
          }, result.center)
        },
        function(err) {
          done()
        }
      )
    })

    it('method isVisible()', function (done) {
      overpassFrontend.get('n3037893169', { properties: OverpassFrontend.BBOX },
        function (err, result, index) {
          assert.equal(true, result.isVisible(new BoundingBox({
              minlat: 48.198,
              maxlat: 48.199,
              minlon: 16.338,
              maxlon: 16.339
            }
          )))
          assert.equal(false, result.isVisible(new BoundingBox({
              minlat: 48.197,
              maxlat: 48.198,
              minlon: 16.338,
              maxlon: 16.339
            }
          )))
        },
        function (err) {
          done()
        }
      )
    })
  })

  describe('Way', function() {
    it('Overpass.BBOX', function(done) {
      overpassFrontend.removeFromCache('w299709373')
      overpassFrontend.get('w299709373', { properties: OverpassFrontend.BBOX },
        function(err, result, index) {
          assert.deepEqual({
	    "maxlat": 48.1996439,
	    "maxlon": 16.3386136,
	    "minlat": 48.1983024,
	    "minlon": 16.3380308
          }, result.bounds.bounds)
        },
        function(err) {
          done()
        }
      )
    })

    it('method isVisible()', function (done) {
      overpassFrontend.get('w299709373', { properties: OverpassFrontend.BBOX },
        function (err, result, index) {
          assert.equal(true, result.isVisible(new BoundingBox({
              minlat: 48.198,
              maxlat: 48.199,
              minlon: 16.338,
              maxlon: 16.339
            }
          )))
          assert.equal(false, result.isVisible(new BoundingBox({
              minlat: 48.197,
              maxlat: 48.198,
              minlon: 16.338,
              maxlon: 16.339
            }
          )))
        },
        function (err) {
          done()
        }
      )
    })
  })

  describe('Relation', function() {
    it('Overpass.BBOX', function(done) {
      overpassFrontend.removeFromCache('r1980077')
      overpassFrontend.get('r1980077', { properties: OverpassFrontend.BBOX },
        function(err, result, index) {
          assert.deepEqual({
	    "maxlat": 48.1987724,
	    "maxlon": 16.3390104,
	    "minlat": 48.1982148,
	    "minlon": 16.3380726
          }, result.bounds.bounds)
        },
        function(err) {
          done()
        }
      )
    })

    it('method isVisible()', function (done) {
      overpassFrontend.get('r1980077', { properties: OverpassFrontend.BBOX },
        function (err, result, index) {
          assert.equal(true, result.isVisible(new BoundingBox({
              minlat: 48.198,
              maxlat: 48.199,
              minlon: 16.338,
              maxlon: 16.339
            }
          )))
          assert.equal(false, result.isVisible(new BoundingBox({
              minlat: 48.197,
              maxlat: 48.198,
              minlon: 16.338,
              maxlon: 16.339
            }
          )))
        },
        function (err) {
          done()
        }
      )
    })
  })

  describe('Special objects', function() {
    it('Relation without bounds -> bounds is undefined', function(done) {
      overpassFrontend.removeFromCache('r20313')
      overpassFrontend.get('r20313', { properties: OverpassFrontend.ALL },
        function(err, result, index) {
          assert.equal(undefined, result.bounds)
        },
        function(err) {
          done()
        }
      )
    })

    it('method isVisible()', function (done) {
      overpassFrontend.get('r20313', { properties: OverpassFrontend.BBOX },
        function (err, result, index) {
          assert.equal(null, result.isVisible(new BoundingBox({
              minlat: 48.198,
              maxlat: 48.199,
              minlon: 16.338,
              maxlon: 16.339
            }
          )))
          assert.equal(null, result.isVisible(new BoundingBox({
              minlat: 48.197,
              maxlat: 48.198,
              minlon: 16.338,
              maxlon: 16.339
            }
          )))
        },
        function (err) {
          done()
        }
      )
    })
  })

  /*
  describe('Serial requests', function() {
    it('x', function (done) {
      overpass.BBoxQuery(
        'node[amenity=bench];',
        {
          minlon: 16.3384616,
          minlat: 48.1990347,
          maxlon: 16.3386118,
          maxlat: 48.1991437
        },
        {
          properties: OverpassFrontend.ID_ONLY
        },
        function(err, result, index) {
        },
        function(err) {
        }
      )
      overpass.BBoxQuery(
        'node[amenity=restaurant];',
        {
          minlon: 16.3384616,
          minlat: 48.1990347,
          maxlon: 16.3386118,
          maxlat: 48.1991437
        },
        {
          properties: OverpassFrontend.ID_ONLY
        },
        function(err, result, index) {
        },
        function(err) {
          done()
        }
      )
    })
  })
  */

  describe('Error handling', function() {
    it('Illegal BBoxQuery', function (done) {
      overpassFrontend.BBoxQuery(
        'node[amenity=bench',
        {
          minlon: 16.3384616,
          minlat: 48.1990347,
          maxlon: 16.3386118,
          maxlat: 48.1991437
        },
        {
          properties: OverpassFrontend.ID_ONLY
        },
        function(err, result, index) {
          assert(false, 'Query wrong, feature_callback should not be called')
        },
        function(err) {
          if(err === null)
            done('Query wrong, should not be successful')

          else if(err == "line 2: parse error: ']' expected - ')' found.\n" +
            "line 4: parse error: Unexpected end of input.\n" +
            "line 4: parse error: Unexpected end of input.\n" +
            "line 4: parse error: Unexpected end of input.\n\n")
            done()

          else
            done('Wrong error message: ' + err)
        }
      )
    })

    it('Illegal ID', function (done) {
      overpassFrontend.get([ 'na' ],
        {
          properties: OverpassFrontend.ID_ONLY
        },
        function(err, result, index) {
          assert(false, 'Query wrong, feature_callback should not be called')
        },
        function(err) {
          if(err === null)
            done('Query wrong, should not be successful')

          else if(err == "line 2: parse error: Unknown query clause\n" +
            "line 2: parse error: ')' expected - 'a' found.\n" +
            "line 2: parse error: An empty query is not allowed\n\n")
            done()

          else
            done('Wrong error message: ' + err)
        }
      )
    })
  })

  describe('OverpassFrontend, misc functions', function() {
    it('regexpEscape()', function() {
      var input = 'bank+atm'
      var expected = 'bank\\+atm'

      assert.equal(expected, overpassFrontend.regexpEscape(input))

      return true
    })
  })

  describe('OverpassRequest', function() {
    it('get() should return OverpassRequest object', function (done) {
      var req = overpassFrontend.get([ 'n3037893169' ],
        {
          properties: OverpassFrontend.ID_ONLY
        },
        function(err, result, index) {
        },
        function(err) {
          done()
        }
      )

      assert.equal('OverpassRequest', req.constructor.name)
    })

    it('abort() should abort a "get" request', function (done) {
      var req = overpassFrontend.get([ 'n3037893161' ],
        {
          properties: OverpassFrontend.ID_ONLY
        },
        function(err, result, index) {
          assert(false, 'Should not call feature_callback, as request gets aborted.')
        },
        function(err) {
          assert.equal('abort', err)
          done()
        }
      )

      req.abort()
    })

    it('abort() should abort a "get" request (even when object has already been loaded)', function (done) {
      var req = overpassFrontend.get([ 'n3037893169' ],
        {
          properties: OverpassFrontend.ID_ONLY
        },
        function(err, result, index) {
          assert(false, 'Should not call feature_callback, as request gets aborted.')
        },
        function(err) {
          assert.equal('abort', err)
          done()
        }
      )

      req.abort()
    })

    it('abort() should abort a "BBoxQuery" request', function (done) {
      var req = overpassFrontend.BBoxQuery(
        'node[natural=tree];',
        {
          minlon: 16.338,
          minlat: 48.199,
          maxlon: 16.339,
          maxlat: 48.200
        },
        {
          properties: OverpassFrontend.ID_ONLY
        },
        function(err, result, index) {
          assert(false, 'Should not call feature_callback, as request gets aborted.')
        },
        function(err) {
          assert.equal('abort', err)
          done()
        }
      )

      req.abort()
    })

    it('abort() should abort a "BBoxQuery" request', function (done) {
      var req = overpassFrontend.BBoxQuery(
        'node[natural=tree];',
        {
          minlon: 16.338,
          minlat: 48.199,
          maxlon: 16.339,
          maxlat: 48.200
        },
        {
          properties: OverpassFrontend.ID_ONLY
        },
        function(err, result, index) {
          assert(false, 'Should not call feature_callback, as request gets aborted.')
        },
        function(err) {
          assert.equal('abort', err)
          done()
        }
      )

      req.abort()
    })
  })
})
