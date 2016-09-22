var fs = require('fs')
var conf = JSON.parse(fs.readFileSync('test/conf.json', 'utf8'));

var assert = require('assert')

var Overpass = require('../src/Overpass')
var BoundingBox = require('boundingbox')
var overpass = new Overpass(conf.url)


describe('Overpass get', function() {
  describe('single id', function() {
    it('should return an existing relation', function(done) {
      overpass.get('r910885', { properties: Overpass.ALL },
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
      overpass.get('r32', { properties: Overpass.ALL },
        function(err, result, index) {
          if(result !== null) {
            done('r32 should not exist!')
          }
        },
        function(err) {
          done(err);
        })
    })
  })

  describe('GeoJSON', function() {
    it('node', function(done) {
      overpass.get('n3037893169', { properties: Overpass.ALL },
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
      overpass.get('w146678749', { properties: Overpass.ALL },
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

      overpass.bbox_query(
        'node[amenity=bench];',
        {
          minlon: 16.3384616,
          minlat: 48.1990347,
          maxlon: 16.3386118,
          maxlat: 48.1991437
        },
        {
          properties: Overpass.ID_ONLY
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
      var expected = [ 'w299709373', 'w299709375' ]

      overpass.bbox_query(
        'way[highway=footway];',
        {
          minlon: 16.3384616,
          minlat: 48.1990347,
          maxlon: 16.3386118,
          maxlat: 48.1991437
        },
        {
          properties: Overpass.ID_ONLY
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

    overpass.get(query.concat([]), { properties: Overpass.ALL, bbox: bbox },
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

    overpass.get(query.concat([]), { properties: Overpass.ALL, bbox: bbox },
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
      overpass.removeFromCache('n3037893169')
      overpass.get('n3037893169', { properties: Overpass.ID_ONLY },
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
      overpass.removeFromCache('n3037893169')
      overpass.get('n3037893169', { properties: Overpass.TAGS },
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
      overpass.removeFromCache('n3037893169')
      overpass.get('n3037893169', { properties: Overpass.META },
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
      overpass.removeFromCache('n3037893169')
      overpass.get('n3037893169', { properties: Overpass.MEMBERS },
        function(err, result, index) {
          assert.deepEqual([], result.member_ids())
        },
        function(err) {
          done()
        }
      )
    })
    it('Overpass.BBOX', function(done) {
      overpass.removeFromCache('n3037893169')
      overpass.get('n3037893169', { properties: Overpass.BBOX },
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
      overpass.removeFromCache('n3037893169')
      overpass.get('n3037893169', { properties: Overpass.GEOM },
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
      overpass.removeFromCache('n3037893169')
      overpass.get('n3037893169', { properties: Overpass.CENTER },
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
      overpass.removeFromCache('n3037893169')
      overpass.get('n3037893169', { properties: Overpass.ALL },
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
      overpass.get('n3037893169', { properties: Overpass.BBOX },
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
      overpass.removeFromCache('w299709373')
      overpass.get('w299709373', { properties: Overpass.BBOX },
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
      overpass.get('w299709373', { properties: Overpass.BBOX },
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
      overpass.removeFromCache('r1980077')
      overpass.get('r1980077', { properties: Overpass.BBOX },
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
      overpass.get('r1980077', { properties: Overpass.BBOX },
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
      overpass.removeFromCache('r20313')
      overpass.get('r20313', { properties: Overpass.ALL },
        function(err, result, index) {
          assert.equal(undefined, result.bounds)
        },
        function(err) {
          done()
        }
      )
    })

    it('method isVisible()', function (done) {
      overpass.get('r20313', { properties: Overpass.BBOX },
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
})
