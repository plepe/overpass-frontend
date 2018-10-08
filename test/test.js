var fs = require('fs')
var conf = JSON.parse(fs.readFileSync('test/conf.json', 'utf8'));

var assert = require('assert')
var async = require('async')

var OverpassFrontend = require('../src/OverpassFrontend')
var BoundingBox = require('boundingbox')
var overpassFrontend = new OverpassFrontend(conf.url)
var removeNullEntries = require('../src/removeNullEntries')

describe('Overpass get', function() {
  describe('single id', function() {
    it('should return an existing relation', function(done) {
      var finalCalled = 0

      overpassFrontend.get('r910885',
        {
          properties: OverpassFrontend.ALL
        },
        function(err, result, index) {
          assert.equal(err, null, 'Error should be null')
          assert.equal(result.id, 'r910885', 'Wrong object returned: ' + result.id)
        },
        function(err) {
          assert.equal(finalCalled++, 0, 'Final function called ' + finalCalled + ' times!')
          done(err)
        })
    })

    it('should return null for a missing object', function(done) {
      var finalCalled = 0

      overpassFrontend.get('r32',
        {
          properties: OverpassFrontend.ALL
        },
        function(err, result, index) {
          assert.equal(err, null, 'Error should be null')
          assert.equal(result, null, 'r32 should not exist!')
        },
        function(err) {
          assert.equal(finalCalled++, 0, 'Final function called ' + finalCalled + ' times!')
          done(err)
        })
    })

    it('should return null for illegal objects', function(done) {
      var finalCalled = 0
      var tests = [ 'o32', 'na', 'r1234a' ]

      overpassFrontend.get(tests,
        {
          properties: OverpassFrontend.ALL
        },
        function(err, result, index) {
          assert.equal(err, null, 'Error should be null')
          assert.equal(result, null, tests[index] + ' should not exist!')
        },
        function(err) {
          assert.equal(finalCalled++, 0, 'Final function called ' + finalCalled + ' times!')
          done(err)
        })
    })

    it('should handle several simultaneous requests', function(done) {
      async.parallel([
        function(callback) {
          var finalCalled = 0
          overpassFrontend.get('r910886',
            {
              properties: OverpassFrontend.ALL
            },
            function(err, result, index) {
              assert.equal(err, null, 'Error should be null')
              assert.equal('r910886', result.id, 'Wrong object ' + result.id + '?')
            },
            function(err) {
              assert.equal(finalCalled++, 0, 'Final function called ' + finalCalled + ' times!')
              callback(err)
            }
          )
        },
        function(callback) {
          var finalCalled = 0
          overpassFrontend.get('n79721398',
            {
              properties: OverpassFrontend.ALL
            },
            function(err, result, index) {
              assert.equal(err, null, 'Error should be null')
              assert.equal(result.id, 'n79721398', 'Wrong object ' + result.id + '?')
            },
            function(err) {
              assert.equal(finalCalled++, 0, 'Final function called ' + finalCalled + ' times!')
              callback(err)
            }
          )
        }],
        function(err) {
          done(err)
        }
      )
    })

    it('option "sort": should return ordered by id (even when cached)', function(done) {
      var finalCalled = 0
      var items = [ 'r910885', 'n3037893169', 'r910885', 'w146678749', 'w12345' ]
      var expected = [ 'r910885', 'n3037893169', 'r910885', 'w146678749', null ]
      var lastIndex = null

      overpassFrontend.get(
        items,
        {
          sort: true,
          properties: OverpassFrontend.ID_ONLY
        },
        function(err, result, index) {
          assert.equal(err, null, 'Error should be null')

          if (result === null) {
            assert.equal(result, expected[index], 'Index ' + index + ' should be null!')
          } else {
            var p = expected.indexOf(result.id)
            assert.notEqual(p, -1, 'Object ' + result.id + ' should not be found')
            assert.equal(result.id, expected[index], 'Object ' + result.id + ': wrong index ' + index + '!')
          }

          if (lastIndex === null) {
            assert.equal(index, 0, 'Object ' + (result ? result.id : 'null') + ' (Index ' + index + '): should not be first element')
          } else {
            assert.equal(index, lastIndex + 1, 'Object ' + (result ? result.id : 'null') + ' (Index ' + index + '): should not come after ' + lastIndex)
          }
          lastIndex = index
        },
        function(err) {
          assert.equal(finalCalled++, 0, 'Final function called ' + finalCalled + ' times!')
          assert.equal(expected.length, lastIndex + 1, 'Should return ' + expected.length + ' elements')

          done(err)
        })
    })

    it('option "sort": should return ordered by id (sortDir: "desc")', function(done) {
      var finalCalled = 0
      var items = [ 'r910885', 'n3037893169', 'r910885', 'w146678749', 'w12345' ]
      var expected = [ null, 'w146678749', 'r910885', 'n3037893169', 'r910885' ]
      var lastIndex = null

      overpassFrontend.get(
        items,
        {
          sort: true,
          sortDir: 'desc',
          properties: OverpassFrontend.ID_ONLY
        },
        function(err, result, index) {
          assert.equal(err, null, 'Error should be null')

          if (result === null) {
            assert.equal(result, expected[index], 'Index ' + index + ' should be null!')
          } else {
            var p = expected.indexOf(result.id)
            assert.notEqual(p, -1, 'Object ' + result.id + ' should not be found')
            assert.equal(result.id, expected[index], 'Object ' + result.id + ': wrong index ' + index + '!')
          }

          if (lastIndex === null) {
            assert.equal(index, 0, 'Object ' + (result ? result.id : 'null') + ' (Index ' + index + '): should not be first element')
          } else {
            assert.equal(index, lastIndex + 1, 'Object ' + (result ? result.id : 'null') + ' (Index ' + index + '): should not come after ' + lastIndex)
          }
          lastIndex = index
        },
        function(err) {
          assert.equal(finalCalled++, 0, 'Final function called ' + finalCalled + ' times!')
          assert.equal(expected.length, lastIndex + 1, 'Should return ' + expected.length + ' elements')

          done(err)
        })
    })

    it('option "sort"="BBoxDiagonalLength"', function(done) {
      var finalCalled = 0
      var items = [ 'w125586435', 'w299696929', 'w174711686', 'w247954720', 'w12345' ]
      var expected = [ null, 'w247954720', 'w174711686', 'w125586435', 'w299696929' ]
      var lastIndex = null

      overpassFrontend.get(
        items,
        {
          sort: 'BBoxDiagonalLength',
          sortDir: 'asc',
          properties: OverpassFrontend.ID_ONLY
        },
        function(err, result, index) {
          assert.equal(err, null, 'Error should be null')

          if (result === null) {
            assert.equal(result, expected[index], 'Index ' + index + ' should be null!')
          } else {
            var p = expected.indexOf(result.id)
            assert.notEqual(p, -1, 'Object ' + result.id + ' should not be found')
            assert.equal(result.id, expected[index], 'Object ' + result.id + ': wrong index ' + index + '!')
          }

          if (lastIndex === null) {
            assert.equal(index, 0, 'Object ' + (result ? result.id : 'null') + ' (Index ' + index + '): should not be first element')
          } else {
            assert.equal(index, lastIndex + 1, 'Object ' + (result ? result.id : 'null') + ' (Index ' + index + '): should not come after ' + lastIndex)
          }
          lastIndex = index
        },
        function(err) {
          assert.equal(finalCalled++, 0, 'Final function called ' + finalCalled + ' times!')
          assert.equal(expected.length, lastIndex + 1, 'Should return ' + expected.length + ' elements')

          done(err)
        })
    })

    it('option "sort"="BBoxDiagonalLength", sortDir "desc"', function(done) {
      var finalCalled = 0
      var items = [ 'w125586435', 'w299696929', 'w174711686', 'w247954720' ]
      var expected = [ 'w299696929', 'w125586435', 'w174711686', 'w247954720' ]
      var lastIndex = null

      overpassFrontend.get(
        items,
        {
          sort: 'BBoxDiagonalLength',
          sortDir: 'desc',
          properties: OverpassFrontend.BBOX
        },
        function(err, result, index) {
          assert.equal(err, null, 'Error should be null')

          if (result === null) {
            assert.equal(result, expected[index], 'Index ' + index + ' should be null!')
          } else {
            var p = expected.indexOf(result.id)
            assert.notEqual(p, -1, 'Object ' + result.id + ' should not be found')
            assert.equal(result.id, expected[index], 'Object ' + result.id + ': wrong index ' + index + '!')
          }

          if (lastIndex === null) {
            assert.equal(index, 0, 'Object ' + (result ? result.id : 'null') + ' (Index ' + index + '): should not be first element')
          } else {
            assert.equal(index, lastIndex + 1, 'Object ' + (result ? result.id : 'null') + ' (Index ' + index + '): should not come after ' + lastIndex)
          }
          lastIndex = index
        },
        function(err) {
          assert.equal(finalCalled++, 0, 'Final function called ' + finalCalled + ' times!')
          assert.equal(expected.length, lastIndex + 1, 'Should return ' + expected.length + ' elements')

          done(err)
        })
    })
  })

  describe('GeoJSON', function() {
    it('node', function(done) {
      var finalCalled = 0
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
              "@osm3s:copyright": "The data included in this document is from www.openstreetmap.org. The data is made available under ODbL.",
              "@osm3s:generator": "Overpass API",
              "@osm3s:version": 0.6,
              "@osm3s:timestamp_osm_base": "",
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
          assert.equal(finalCalled++, 0, 'Final function called ' + finalCalled + ' times!')
        })
    })

    it('way', function(done) {
      var finalCalled = 0
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
              "@osm3s:copyright": "The data included in this document is from www.openstreetmap.org. The data is made available under ODbL.",
              "@osm3s:generator": "Overpass API",
              "@osm3s:version": 0.6,
              "@osm3s:timestamp_osm_base": "",
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
          assert.equal(finalCalled++, 0, 'Final function called ' + finalCalled + ' times!')
        })
    })

    it('relation', function(done) {
      var finalCalled = 0
      overpassFrontend.get('r3854502', { properties: OverpassFrontend.ALL },
        function(err, result, index) {
	  var geojson = result.GeoJSON();

          assert.deepEqual({
	    "type": "Feature",
	    "id": "relation/3854502",
	    "geometry": {
              "type": "GeometryCollection",
              "geometries": [
                {
                  "type": "LineString",
                  "coordinates": [
                    [
                      16.3401188,
                      48.1943668
                    ],
                    [
                      16.3409734,
                      48.1946786
                    ]
                  ]
                },
                {
                  "type": "Point",
                  "coordinates": [
                    16.3401188,
                    48.1943668
                  ]
                },
                {
                  "type": "LineString",
                  "coordinates": [
                    [
                      16.3398155,
                      48.1944888
                    ],
                    [
                      16.3399651,
                      48.1944683
                    ],
                    [
                      16.3400559,
                      48.1944373
                    ],
                    [
                      16.3401188,
                      48.1943668
                    ]
                  ]
                }
              ]
	    },
	    "properties": {
	      "@changeset": 32165173,
	      "@id": "relation/3854502",
              "@osm3s:copyright": "The data included in this document is from www.openstreetmap.org. The data is made available under ODbL.",
              "@osm3s:generator": "Overpass API",
              "@osm3s:version": 0.6,
              "@osm3s:timestamp_osm_base": "",
	      "@timestamp": "2015-06-23T16:09:42Z",
	      "@uid": 161619,
	      "@user": "FvGordon",
	      "@version": 2,
	      "note": "applies only to cyclists against oneway",
	      "restriction:bicycle": "no_right_turn",
	      "type": "restriction"
	    }
	  },
          geojson);

          done();
        },
        function(err) {
          assert.equal(finalCalled++, 0, 'Final function called ' + finalCalled + ' times!')
        })
    })
  })

  describe('bbox query', function() {
    it('should return a list of node features', function(done) {
      var finalCalled = 0
      var found = []
      var expected = [ 'n3037893162', 'n3037893163', 'n3037893164' ]
      var expectedSubRequestCount = 1
      var foundSubRequestCount = 0

      function compileListener (subrequest) {
        foundSubRequestCount++
      }

      var request = overpassFrontend.BBoxQuery(
        'node[amenity=bench];',
        {
          minlon: 16.3384616,
          minlat: 48.1990347,
          maxlon: 16.3386118,
          maxlat: 48.1991437
        },
        {
          properties: OverpassFrontend.TAGS
        },
        function(err, result, index) {
          found.push(result.id)

          if(expected.indexOf(result.id) == -1)
            assert.fail('Object ' + result.id + ' should not be found!')
        },
        function(err) {
          assert.equal(finalCalled++, 0, 'Final function called ' + finalCalled + ' times!')
          assert.equal(expected.length, found.length, 'Wrong count of objects found!')
          assert.equal(foundSubRequestCount, expectedSubRequestCount, 'Wrong count of sub requests!')

          request.off('subrequest-compile', compileListener)
          done()
        }
      )

      request.on('subrequest-compile', compileListener)
    })

    it('should return a list of node features (2nd try, partly cached)', function(done) {
      return done() // disabled until https://github.com/Turfjs/turf/issues/1393 is fixed
      var finalCalled = 0
      var found = []
      var expected = [ 'n3037893162', 'n3037893163', 'n3037893164', 'n3037893159', 'n3037893160' ]

      var expectedSubRequestCount = 0
      var foundSubRequestCount = 0

      function compileListener (subrequest) {
        foundSubRequestCount++
      }

      var request = overpassFrontend.BBoxQuery(
        'node[amenity=bench];',
        {
          minlon: 16.3382616,
          minlat: 48.1990347,
          maxlon: 16.3386118,
          maxlat: 48.1991437
        },
        {
          properties: OverpassFrontend.TAGS
        },
        function(err, result, index) {
          found.push(result.id)

          if(expected.indexOf(result.id) == -1)
            assert.fail('Object ' + result.id + ' should not be found!')
        },
        function(err) {
          assert.equal(finalCalled++, 0, 'Final function called ' + finalCalled + ' times!')
          assert.deepEqual(expected.sort(), found.sort(), 'Wrong count of objects found!')
          assert.equal(foundSubRequestCount, expectedSubRequestCount, 'Wrong count of sub requests!')

          request.off('subrequest-compile', compileListener)
          done()
        }
      )

      request.on('subrequest-compile', compileListener)
    })

    it('should return a list of node features (3rd try, partly cached)', function(done) {
      var finalCalled = 0
      var found = []
      var expected = [ 'n3037893162', 'n3037893163', 'n3037893164' ]
      var expectedSubRequestCount = 0
      var foundSubRequestCount = 0

      function compileListener (subrequest) {
        foundSubRequestCount++
      }

      var request = overpassFrontend.BBoxQuery(
        'node[amenity=bench];',
        {
          minlon: 16.3384816,
          minlat: 48.1990547,
          maxlon: 16.3386018,
          maxlat: 48.1991237
        },
        {
          properties: OverpassFrontend.TAGS
        },
        function(err, result, index) {
          found.push(result.id)

          if(expected.indexOf(result.id) == -1)
            assert.fail('Object ' + result.id + ' should not be found!')
        },
        function(err) {
          assert.equal(finalCalled++, 0, 'Final function called ' + finalCalled + ' times!')
          assert.equal(expected.length, found.length, 'Wrong count of objects found!')
          assert.equal(foundSubRequestCount, expectedSubRequestCount, 'Wrong count of sub requests!')

          request.off('subrequest-compile', compileListener)
          done()
        }
      )

      request.on('subrequest-compile', compileListener)
    })

    it('should return a list of way features', function(done) {
      var finalCalled = 0
      var found = []
      var expected = [ 'w299709373' ]
      var might = [ 'w299709375' ] // correct, if only bbox check is used

      var request = overpassFrontend.BBoxQuery(
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
          if(expected.indexOf(result.id) === -1 &&
             might.indexOf(result.id) === -1) {
            assert.fail('Object ' + result.id + ' should not be found!')
          }

          if (expected.indexOf(result.id) !== -1) {
            found.push(result.id)
          }
        },
        function(err) {
          assert.equal(finalCalled++, 0, 'Final function called ' + finalCalled + ' times!')
          assert.equal(1, request.callCount, 'Server should be called once')
          assert.equal(expected.length, found.length, 'Wrong count of objects found!')

          done()
        }
      )
    })

    it('should return a list of way features (2nd try, partly cached)', function(done) {
      return done() // disabled until https://github.com/Turfjs/turf/issues/1393 is fixed
      var finalCalled = 0
      var found = []
      var expected = [ 'w299709373' ]
      var might = [ 'w299709375' ] // correct, if only bbox check is used

      var request = overpassFrontend.BBoxQuery(
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
          if(expected.indexOf(result.id) === -1 &&
             might.indexOf(result.id) === -1) {
            assert.fail('Object ' + result.id + ' should not be found!')
          }

          if (expected.indexOf(result.id) !== -1) {
            found.push(result.id)
          }
        },
        function(err) {
          assert.equal(finalCalled++, 0, 'Final function called ' + finalCalled + ' times!')
          assert.equal(1, request.callCount, 'Server should be called once')
          assert.equal(expected.length, found.length, 'Wrong count of objects found!')

          done()
        }
      )
    })

    it('should return a list of way features (3rd try, fully cached)', function(done) {
      return done() // disabled until https://github.com/Turfjs/turf/issues/1393 is fixed
      var finalCalled = 0
      var expectedFound = []
      var expected = [ 'w299709373' ]
      var might = [ 'w299709375' ] // correct, if only bbox check is used

      var request = overpassFrontend.BBoxQuery(
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
            assert.fail('Object ' + result.id + ' should not be found!')
        },
        function(err) {
          assert.equal(finalCalled++, 0, 'Final function called ' + finalCalled + ' times!')
          assert.equal(0, request.callCount, 'Server should be not be called (fully cached)')
          if(expectedFound.length != expected.length)
            assert.fail('Wrong count of objects found!')

          done()
        }
      )
    })

    it('should return a list of way features, ordered by BBoxDiagonalLength', function(done) {
      var finalCalled = 0
      var found = []
      var expected = [ 'w243704615', 'w125586430', 'w313063294', 'w172236247' ]

      overpassFrontend.BBoxQuery(
        'way[building];',
        {
          minlon: 16.3375,
          minlat: 48.1995,
          maxlon: 16.3385,
          maxlat: 48.2005
        },
        {
          properties: OverpassFrontend.ID_ONLY,
          sort: 'BBoxDiagonalLength'
        },
        function(err, result, index) {
          found.push(result.id)

          if (expected.indexOf(result.id) === -1)
            assert.fail('Object ' + result.id + ' should not be found!')
        },
        function(err) {
          assert.equal(finalCalled++, 0, 'Final function called ' + finalCalled + ' times!')
          if (found.length != expected.length)
            assert.fail('Wrong count of objects found!')

          done()
        }
      )
    })

    it('should return a list of node features (request splitted)', function(done) {
      var loadCount = 0
      var expectedLoadCount = 3
      overpassFrontend.on('load', function (osm3sMeta) {
        loadCount++
      })
      var finalCalled = 0
      var found = []
      var expected = [ 'n1853730762', 'n1853730763', 'n1853730777', 'n1853730779', 'n1853730785', 'n1853730792', 'n1853730797', 'n1853730821' ]
      var expectedSubRequestCount = 3
      var foundSubRequestCount = 0

      var req = overpassFrontend.BBoxQuery(
        'node[natural=tree];',
        {
          minlon: 16.3384,
          minlat: 48.1990,
          maxlon: 16.3387,
          maxlat: 48.1993
        },
        {
          properties: OverpassFrontend.ID_ONLY,
          split: 3
        },
        function(err, result, index) {
          found.push(result.id)

          if(expected.indexOf(result.id) == -1)
            assert.fail('Object ' + result.id + ' should not be found!')
        },
        function(err) {
          assert.equal(finalCalled++, 0, 'Final function called ' + finalCalled + ' times!')
          assert.deepEqual(expected.sort(), found.sort(), 'Wrong count of objects found!')
          assert.equal(foundSubRequestCount, expectedSubRequestCount, 'Wrong count of subrequests')
          assert.equal(loadCount, expectedLoadCount, 'Wrong count of load events')

          done()
        }
      )

      req.on('subrequest-finish', function (subRequest) {
        // console.log(subRequest.query)
        // console.log('-> got ' + subRequest.parts[0].count + ' results')
        foundSubRequestCount++
      })
    })

    it('should handle simultaneous requests gracefully (overlapping area; partyly known; requests splitted)', function(done) {
      return done() // disabled until https://github.com/Turfjs/turf/issues/1393 is fixed
      var found1 = []
      var found2 = []
      var expected1 = [ 'n1853730762', 'n1853730763', 'n1853730777', 'n1853730779', 'n1853730785', 'n1853730792', 'n1853730797', 'n1853730821', 'n1853730767', 'n1853730778', 'n1853730787', 'n1853730801', 'n1853730774', 'n1853730788', 'n1853730816', 'n1853730828', 'n1853730831', 'n1853730842', 'n1853730843' ]
      var expected2 = [ 'n1853730762', 'n1853730763', 'n1853730777', 'n1853730779', 'n1853730785', 'n1853730792', 'n1853730797', 'n1853730821', 'n1853730767', 'n1853730778', 'n1853730787', 'n1853730801', 'n1853730774', 'n1853730788', 'n1853730816', 'n1853730828', 'n1853730831', 'n1853730842', 'n1853730843', 'n1853730825' ]

      async.parallel([
        function (callback) {
          var finalCalled = 0
          overpassFrontend.BBoxQuery(
            'node[natural=tree];',
            {
              minlon: 16.3380,
              minlat: 48.1990,
              maxlon: 16.3387,
              maxlat: 48.1993
            },
            {
              properties: OverpassFrontend.ID_ONLY,
              split: 3
            },
            function(err, result, index) {
              found1.push(result.id)

              if(expected1.indexOf(result.id) == -1)
                assert.fail('(1) Object ' + result.id + ' should not be found!')
            },
            function(err) {
              assert.equal(finalCalled++, 0, 'Final function called ' + finalCalled + ' times!')
              assert.deepEqual(expected1.sort(), found1.sort(), '(1) Wrong count of objects found!')

              callback()
            }
          )
        },
        function (callback) {
          var finalCalled = 0
          overpassFrontend.BBoxQuery(
            'node[natural=tree];',
            {
              minlon: 16.3377,
              minlat: 48.1990,
              maxlon: 16.3387,
              maxlat: 48.1993
            },
            {
              properties: OverpassFrontend.ID_ONLY,
              split: 3
            },
            function(err, result, index) {
              found2.push(result.id)

              if(expected2.indexOf(result.id) == -1)
                assert.fail('(2) Object ' + result.id + ' should not be found!')
            },
            function(err) {
              assert.equal(finalCalled++, 0, 'Final function called ' + finalCalled + ' times!')
              assert.deepEqual(expected2.sort(), found2.sort(), '(2) Wrong count of objects found!')

              callback()
            }
          )
        }
      ], function () {
        done()
      })
    })
  })
  describe('removeFromCache()', function() {
    // TODO: Missing!
  })
})

describe('Overpass getCached()', function () {
  it('an existing feature (after cache clear)', function () {
    overpassFrontend.clearCache()

    let ob = overpassFrontend.getCached('r910885',
      {
        properties: OverpassFrontend.TAGS
      }
    )

    assert.equal(ob, false, 'Cache clear -> false')
  })

  it('a non-existing feature (after cache clear)', function () {
    let ob = overpassFrontend.getCached('n123456',
      {
        properties: OverpassFrontend.TAGS
      }
    )

    assert.equal(ob, false, 'Cache clear -> false')
  })

  it('load features via async call', function (done) {
    let ob = overpassFrontend.get([ 'r910885', 'n123456' ],
      {
        properties: OverpassFrontend.TAGS
      },
      function (err, ob) {
      },
      function (err) {
        done()
      }
    )
  })

  it('an existing feature (after load)', function () {
    let ob = overpassFrontend.getCached('r910885',
      {
        properties: OverpassFrontend.TAGS
      }
    )

    assert.equal(ob.id, 'r910885', 'wrong id')
  })

  it('a non-existing feature (after load)', function () {
    let ob = overpassFrontend.getCached('n123456',
      {
        properties: OverpassFrontend.ALL
      }
    )

    assert.equal(ob, null, 'Non existant: null')
  })

  it('an existing feature - wrong properties (after load)', function () {
    let ob = overpassFrontend.getCached('r910885',
      {
        properties: OverpassFrontend.META
      }
    )

    assert.equal(ob, false, 'not fully loaded')
  })

  it('a non-existing feature - wrong properties (after load)', function () {
    let ob = overpassFrontend.getCached('n123456',
      {
        properties: OverpassFrontend.META
      }
    )

    assert.equal(ob, null, 'Non existant: null')
  })
})

describe('Overpass query by id with bbox option', function() {
  it('First call', function(done) {
    var finalCalled = 0
    var query = [ 'w299709373', 'w299709375', 'w4583442', 'w299704585', 'n2832485845', 'n3037893162', 'r20313', 'r3636229', 'r3311614', 'w12345' ]
    var expected = [ 'w299709373', 'n3037893162' ]
    var index_outside_bbox = [ 1, 2, 3, 4, 5, 6, 7, 8 ]
    var index_non_existant = [ 9 ]
    var bbox = {
            minlon: 16.3384616,
            minlat: 48.1990347,
            maxlon: 16.3386118,
            maxlat: 48.1991437
          }

    // make sure, that elements are not loaded
    query.forEach(function (item) {
      overpassFrontend.removeFromCache(item)
    })

    overpassFrontend.get(query.concat([]), { properties: OverpassFrontend.ALL, bbox: bbox },
        function(err, result, index) {
          if (result === false && index_outside_bbox.indexOf(index) == -1)
              assert.fail('Index ' + index + ' should return a valid result (' + query[index] + ')')

          if (result === null && index_non_existant.indexOf(index) === -1) {
            assert.fail('Index ' + index + ' should not return a non-existant object (' + query[index] + ')')
          }

          if (result !== false && result !== null && expected.indexOf(result.id) == -1) {
            assert.fail('Returning object ' + result.id + ' which should not be returned')
          }
        },
        function(err) {
          assert.equal(finalCalled++, 0, 'Final function called ' + finalCalled + ' times!')
          done()
        }
    )
  })

  it('Second call', function(done) {
    var finalCalled = 0
    var query = [ 'w299709373', 'w299709375', 'w4583442', 'w299704585', 'n2832485845', 'n3037882439', 'n3037893162', 'w12345' ]
    var expected = [ 'w299709375', 'w299704585' ]
    var index_outside_bbox = [ 0, 1, 2, 4, 5, 6 ]
    var index_non_existant = [ 7 ]
    var bbox = {
            minlat: 48.1996955,
            minlon: 16.3381572,
            maxlat: 48.1998337,
            maxlon: 16.3382651
          }

    overpassFrontend.get(query.concat([]), { properties: OverpassFrontend.ALL, bbox: bbox },
        function(err, result, index) {
          if (result === false && index_outside_bbox.indexOf(index) == -1)
              assert.fail('Index ' + index + ' should return a valid result (' + query[index] + ')')

          if (result === null && index_non_existant.indexOf(index) === -1) {
            assert.fail('Index ' + index + ' should not return a non-existant object (' + query[index] + ')')
          }

          if (result !== false && result !== null && expected.indexOf(result.id) == -1) {
            assert.fail('Returning object ' + result.id + ' which should not be returned')
          }
        },
        function(err) {
          assert.equal(finalCalled++, 0, 'Final function called ' + finalCalled + ' times!')
          done()
        }
    )
  })

  it('Check data of outside objects', function(done) {
    var finalCalled = 0
    var query = [ 'n2832485845', 'n3037882439' ]

    overpassFrontend.get(query.concat([]), { properties: OverpassFrontend.ID_ONLY },
        function(err, result, index) {
          // has GEOM, because for nodes lat/lon is geom, bbox and center
          assert.equal(OverpassFrontend.GEOM | OverpassFrontend.BBOX | OverpassFrontend.CENTER, result.properties, 'Element ' + result.id + ' which was loaded outside bbox, should only have BBOX data')
        },
        function(err) {
          assert.equal(finalCalled++, 0, 'Final function called ' + finalCalled + ' times!')
          done()
        }
    )

  })

    it('should handle several simultaneous requests', function(done) {
      var items1 = [ 'n3037893167', 'n3037893166' ]
      var items2 = [ 'n3037893165', 'n3037893166' ]
      var items3 = [ 'n1853730723' ]

      overpassFrontend.removeFromCache(items1)
      overpassFrontend.removeFromCache(items2)
      overpassFrontend.removeFromCache(items3)

      async.parallel([
        function(callback) {
          var done = []
          var finalCalled = 0

          overpassFrontend.get(items1,
            {
              properties: OverpassFrontend.ALL,
              bbox: {
                minlon: 16.3375,
                minlat: 48.1985,
                maxlon: 16.3385,
                maxlat: 48.2005
              }
            },
            function(err, result, index) {
              assert.equal(null, err, err)
              assert.notEqual(items1.indexOf(result.id), -1, 'Item should not be returned by 1st request: ' + result.id)
              done.push(result.id)
            },
            function(err) {
              assert.equal(done.length, items1.length, '1st request should return ' + items1.length + ' items')
              assert.equal(finalCalled++, 0, 'Final function called ' + finalCalled + ' times!')
              assert.equal(done.length, items1.length, '2nd request should return ' + items1.length + ' items')
              callback(err)
            }
          )
        },
        function(callback) {
          var done = []
          var finalCalled = 0

          overpassFrontend.get(items2,
            {
              properties: OverpassFrontend.ALL,
              bbox: {
                minlon: 16.3375,
                minlat: 48.1985,
                maxlon: 16.3385,
                maxlat: 48.2005
              }
            },
            function(err, result, index) {
              assert.equal(null, err, err)
              assert.notEqual(items2.indexOf(result.id), -1, 'Item should not be returned by 2nd request: ' + result.id)
              done.push(result.id)
            },
            function(err) {
              assert.equal(finalCalled++, 0, 'Final function called ' + finalCalled + ' times!')
              assert.equal(done.length, items2.length, '2nd request should return ' + items2.length + ' items')
              callback(err)
            }
          )
        },
        function(callback) {
          var done = []
          var finalCalled = 0

          overpassFrontend.get(items3,
            {
              properties: OverpassFrontend.ALL,
              bbox: {
                minlon: 16.3375,
                minlat: 48.1985,
                maxlon: 16.3385,
                maxlat: 48.2005
              }
            },
            function(err, result, index) {
              assert.equal(null, err, err)
              assert.notEqual(items3.indexOf(result.id), -1, 'Item should not be returned by 3rd request: ' + result.id)
              done.push(result.id)
            },
            function(err) {
              assert.equal(finalCalled++, 0, 'Final function called ' + finalCalled + ' times!')
              assert.equal(done.length, items3.length, '3nd request should return ' + items3.length + ' items')
              callback(err)
            }
          )
        }],
        function(err) {
          done(err)
        }
      )
    })

    it('should handle several simultaneous requests with too much effort', function(done) {
      var items1 = [ 'n3037893167', 'n3037893166' ]
      var items2 = [ 'n3037893165' ]
      var items3 = [ 'n1853730723' ]

      overpassFrontend.removeFromCache(items1)
      overpassFrontend.removeFromCache(items2)
      overpassFrontend.removeFromCache(items3)
      overpassFrontend.options.effortPerRequest = 2

      async.parallel([
        function(callback) {
          var done = []
          var finalCalled = 0

          overpassFrontend.get(items1,
            {
              properties: OverpassFrontend.ALL,
              bbox: {
                minlon: 16.3375,
                minlat: 48.1985,
                maxlon: 16.3385,
                maxlat: 48.2005
              }
            },
            function(err, result, index) {
              assert.equal(null, err, err)
              assert.notEqual(items1.indexOf(result.id), -1, 'Item should not be returned by 1st request: ' + result.id)
              done.push(result.id)
            },
            function(err) {
              assert.equal(finalCalled++, 0, 'Final function called ' + finalCalled + ' times!')
              assert.equal(done.length, items1.length, '2nd request should return ' + items1.length + ' items')
              callback(err)
            }
          )
        },
        function(callback) {
          var done = []
          var finalCalled = 0

          overpassFrontend.get(items2,
            {
              properties: OverpassFrontend.ALL,
              bbox: {
                minlon: 16.3375,
                minlat: 48.1985,
                maxlon: 16.3385,
                maxlat: 48.2005
              }
            },
            function(err, result, index) {
              assert.equal(null, err, err)
              assert.notEqual(items2.indexOf(result.id), -1, 'Item should not be returned by 2nd request: ' + result.id)
              done.push(result.id)
            },
            function(err) {
              assert.equal(finalCalled++, 0, 'Final function called ' + finalCalled + ' times!')
              assert.equal(done.length, items2.length, '2nd request should return ' + items2.length + ' items')
              callback(err)
            }
          )
        },
        function(callback) {
          var done = []
          var finalCalled = 0

          overpassFrontend.get(items3,
            {
              properties: OverpassFrontend.ALL,
              bbox: {
                minlon: 16.3375,
                minlat: 48.1985,
                maxlon: 16.3385,
                maxlat: 48.2005
              }
            },
            function(err, result, index) {
              assert.equal(null, err, err)
              assert.notEqual(items3.indexOf(result.id), -1, 'Item should not be returned by 3rd request: ' + result.id)
              done.push(result.id)
            },
            function(err) {
              assert.equal(finalCalled++, 0, 'Final function called ' + finalCalled + ' times!')
              assert.equal(done.length, items3.length, '3nd request should return ' + items3.length + ' items')
              callback(err)
            }
          )
        }],
        function(err) {
          overpassFrontend.options.effortPerRequest = 1000
          done(err)
        }
      )
    })
})

describe('Overpass BBoxQuery', function() {
  it('Simple queries - all nodes', function (done) {
    var finalCalled = 0
    var expected = [ 'n3037893169', 'n3037431649' ]
    var found = []
    var error = ''

    overpassFrontend.BBoxQuery(
      "node",
      {
	"maxlat": 48.19852,
	"maxlon": 16.33853,
	"minlat": 48.19848,
	"minlon": 16.33846
      },
      {
      },
      function (err, result) {
        found.push(result.id)

        if (expected.indexOf(result.id) === -1) {
          error += 'Unexpected result ' + result.id + '\n'
        }
      },
      function (err) {
        assert.equal(finalCalled++, 0, 'Final function called ' + finalCalled + ' times!')
        if (err) {
          return done(err)
        }

        if (error) {
          return done(error)
        }

        if (found.length !== expected.length) {
          return done('Wrong count of objects returned:\n' +
               'Expected: ' + expected.join(', ') + '\n' +
               'Found: ' + found.join(', '))
        }

        done()
      }
    )
  })

  it('Simple queries - all restaurants', function (done) {
    var finalCalled = 0
    var expected = [ 'n441576820', 'n442066582', 'n442972880', 'n1467109667', 'n355123976', 'n1955278832', 'n441576823', 'n2083468740', 'n2099023017', 'w369989037', 'w370577069' ]
    var found = []
    var error = ''

    overpassFrontend.BBoxQuery(
      "(node[amenity=restaurant];way[amenity=restaurant];relation[amenity=restaurant];)",
      {
	"maxlat": 48.200,
	"maxlon": 16.345,
	"minlat": 48.195,
	"minlon": 16.335
      },
      {
      },
      function (err, result) {
        found.push(result.id)

        if (expected.indexOf(result.id) === -1) {
          error += 'Unexpected result ' + result.id + '\n'
        }
      },
      function (err) {
        assert.equal(finalCalled++, 0, 'Final function called ' + finalCalled + ' times!')
        console.log(found)
        if (err) {
          return done(err)
        }

        if (error) {
          return done(error)
        }

        if (found.length !== expected.length) {
          return done('Wrong count of objects returned:\n' +
               'Expected: ' + expected.join(', ') + '\n' +
               'Found: ' + found.join(', '))
        }

        done()
      }
    )
  })

  it('Bug: Query without results does not call finalCallback', function (done) {
    var expected = []
    var expectedMembers = []
    var found = []
    var foundMembers = []
    var error = ''
    var bbox = {
	"maxlat": 48.19953,
	"maxlon": 15.33506,
	"minlat": 48.19800,
	"minlon": 15.32581,
      }

    var expectedSubRequestCount = 1
    var foundSubRequestCount = 0

    function compileListener (subRequest) {
      foundSubRequestCount++
    }

    var request = overpassFrontend.BBoxQuery(
      "relation[type=route][route=bicycle]",
      bbox,
      {
        "members": true,
        "properties": OverpassFrontend.TAGS | OverpassFrontend.MEMBERS,
        "memberProperties": OverpassFrontend.ALL,
        "memberBounds": bbox,
        "memberCallback": function (err, result) {
          foundMembers.push(result.id)

          if (expectedMembers.indexOf(result.id) === -1) {
            error += 'Unexpected member result ' + result.id + '\n'
          }
        }
      },
      function (err, result) {
        found.push(result.id)

        if (expected.indexOf(result.id) === -1) {
          error += 'Unexpected result ' + result.id + '\n'
        }
      },
      function (err) {
        if (err) {
          return done(err)
        }

        if (error) {
          return done(error)
        }

        if (found.length !== expected.length) {
          return done('Wrong count of objects returned:\n' +
               'Expected: ' + expected.join(', ') + '\n' +
               'Found: ' + found.join(', '))
        }

        if (foundMembers.length !== expectedMembers.length) {
          return done('Wrong count of member objects returned:\n' +
               'Expected: ' + expectedMembers.join(', ') + '\n' +
               'Found: ' + foundMembers.join(', '))
        }

        assert.equal(foundSubRequestCount, expectedSubRequestCount, 'Wrong count of sub requests!')

        request.off('subrequest-compile', compileListener)

        done()
      }
    )

    request.on('subrequest-compile', compileListener)
  })
})

describe('Overpass BBoxQuery - with filter', function() {
  it('Simple queries - all restaurants with additional filter (has cuisine tag)', function (done) {
    overpassFrontend.clearCache()

    var expected = [ 'n441576820', 'n442066582', 'n355123976', 'n1955278832', 'n2083468740', 'n2099023017' ]
    var found = []
    var error = ''

    var expectedSubRequestCount = 1
    var foundSubRequestCount = 0

    function compileListener (subRequest) {
      foundSubRequestCount++
    }

    var request = overpassFrontend.BBoxQuery(
      "(node[amenity=restaurant];way[amenity=restaurant];relation[amenity=restaurant];)",
      {
	"maxlat": 48.200,
	"maxlon": 16.345,
	"minlat": 48.195,
	"minlon": 16.335
      },
      {
        'filter': [
          {
            'key': 'cuisine',
            'op': 'has_key'
          }
        ]
      },
      function (err, result) {
        found.push(result.id)

        if (expected.indexOf(result.id) === -1) {
          error += 'Unexpected result ' + result.id + '\n'
        }
      },
      function (err) {
        if (err) {
          return done(err)
        }

        if (error) {
          return done(error)
        }

        if (found.length !== expected.length) {
          return done('Wrong count of objects returned:\n' +
               'Expected: ' + expected.join(', ') + '\n' +
               'Found: ' + found.join(', '))
        }

        assert.equal(foundSubRequestCount, expectedSubRequestCount, 'Wrong count of sub requests!')

        request.off('subrequest-compile', compileListener)

        done()
      }
    )

    request.on('subrequest-compile', compileListener)
  })

  it('Simple queries - all restaurants with additional filter (has cuisine tag) (fully cached)', function (done) {
    var expected = [ 'n441576820', 'n442066582', 'n355123976', 'n1955278832', 'n2083468740', 'n2099023017' ]
    var found = []
    var error = ''

    var expectedSubRequestCount = 0
    var foundSubRequestCount = 0

    function compileListener (subRequest) {
      foundSubRequestCount++
    }

    var request = overpassFrontend.BBoxQuery(
      "(node[amenity=restaurant];way[amenity=restaurant];relation[amenity=restaurant];)",
      {
	"maxlat": 48.200,
	"maxlon": 16.345,
	"minlat": 48.195,
	"minlon": 16.335
      },
      {
        'filter': [
          {
            'key': 'cuisine',
            'op': 'has_key'
          }
        ]
      },
      function (err, result) {
        found.push(result.id)

        if (expected.indexOf(result.id) === -1) {
          error += 'Unexpected result ' + result.id + '\n'
        }
      },
      function (err) {
        if (err) {
          return done(err)
        }

        if (error) {
          return done(error)
        }

        if (found.length !== expected.length) {
          return done('Wrong count of objects returned:\n' +
               'Expected: ' + expected.join(', ') + '\n' +
               'Found: ' + found.join(', '))
        }

        assert.equal(foundSubRequestCount, expectedSubRequestCount, 'Wrong count of sub requests!')

        request.off('subrequest-compile', compileListener)

        done()
      }
    )

    request.on('subrequest-compile', compileListener)
  })

  it('Simple queries - all restaurants without additional filter (partly cached because of filter)', function (done) {
    var expected = [ 'n441576820', 'n442066582', 'n442972880', 'n1467109667', 'n355123976', 'n1955278832', 'n441576823', 'n2083468740', 'n2099023017', 'w369989037', 'w370577069' ]
    var found = []
    var error = ''

    var expectedSubRequestCount = 1
    var foundSubRequestCount = 0

    function compileListener (subRequest) {
      foundSubRequestCount++
    }

    var request = overpassFrontend.BBoxQuery(
      "(node[amenity=restaurant];way[amenity=restaurant];relation[amenity=restaurant];)",
      {
	"maxlat": 48.200,
	"maxlon": 16.345,
	"minlat": 48.195,
	"minlon": 16.335
      },
      {},
      function (err, result) {
        found.push(result.id)

        if (expected.indexOf(result.id) === -1) {
          error += 'Unexpected result ' + result.id + '\n'
        }
      },
      function (err) {
        if (err) {
          return done(err)
        }

        if (error) {
          return done(error)
        }

        if (found.length !== expected.length) {
          return done('Wrong count of objects returned:\n' +
               'Expected: ' + expected.join(', ') + '\n' +
               'Found: ' + found.join(', '))
        }

        assert.equal(foundSubRequestCount, expectedSubRequestCount, 'Wrong count of sub requests!')

        request.off('subrequest-compile', compileListener)

        done()
      }
    )

    request.on('subrequest-compile', compileListener)
  })

  it('Simple queries - all restaurants with additional filter (has cuisine tag; cached by previous full request)', function (done) {
    var expected = [ 'n441576820', 'n442066582', 'n355123976', 'n1955278832', 'n2083468740', 'n2099023017' ]
    var found = []
    var error = ''

    var expectedSubRequestCount = 0
    var foundSubRequestCount = 0

    function compileListener (subRequest) {
      foundSubRequestCount++
    }

    var request = overpassFrontend.BBoxQuery(
      "(node[amenity=restaurant];way[amenity=restaurant];relation[amenity=restaurant];)",
      {
	"maxlat": 48.200,
	"maxlon": 16.345,
	"minlat": 48.195,
	"minlon": 16.335
      },
      {
        'filter': [
          {
            'key': 'cuisine',
            'op': 'has_key'
          }
        ]
      },
      function (err, result) {
        found.push(result.id)

        if (expected.indexOf(result.id) === -1) {
          error += 'Unexpected result ' + result.id + '\n'
        }
      },
      function (err) {
        if (err) {
          return done(err)
        }

        if (error) {
          return done(error)
        }

        if (found.length !== expected.length) {
          return done('Wrong count of objects returned:\n' +
               'Expected: ' + expected.join(', ') + '\n' +
               'Found: ' + found.join(', '))
        }

        assert.equal(foundSubRequestCount, expectedSubRequestCount, 'Wrong count of sub requests!')

        request.off('subrequest-compile', compileListener)

        done()
      }
    )

    request.on('subrequest-compile', compileListener)
 })
})

describe('Overpass BBoxQuery - Relation with members in BBOX', function() {
  it('Simple queries - routes', function (done) {
    var expected = [ 'r910885', 'r910886', 'r1306732', 'r1306733' ]
    var expectedMembers = [ 'n2293993991', 'n2293993859', 'n2293993867' , 'n2293993929', 'w122580925', 'w220270706', 'w220270708', 'w220270709', 'w220270714', 'w232881263', 'w232881441', 'w261111319', 'w220270696', 'w220270713', 'w383292582' ]
    var found = []
    var foundMembers = []
    var error = ''
    var bbox = {
	"maxlat": 48.19953,
	"maxlon": 16.33506,
	"minlat": 48.19800,
	"minlon": 16.32581,
      }

    var expectedSubRequestCount = 2
    var foundSubRequestCount = 0

    function compileListener (subRequest) {
      foundSubRequestCount++
    }

    var request = overpassFrontend.BBoxQuery(
      "relation[type=route][route=tram]",
      bbox,
      {
        "members": true,
        "properties": OverpassFrontend.TAGS | OverpassFrontend.MEMBERS,
        "memberProperties": OverpassFrontend.TAGS | OverpassFrontend.GEOM,
        "memberBounds": bbox,
        "memberCallback": function (err, result) {
          foundMembers.push(result.id)

          result.memberOf.forEach(memberOf => {
            if (found.indexOf(memberOf.relation.id) === -1) {
              assert.fail('memberCallback for ' + result.id + ' called before featureCallback for ' + memberOf.relation.id)
            }
          })

          if (expectedMembers.indexOf(result.id) === -1) {
            error += 'Unexpected member result ' + result.id + '\n'
          }
        }
      },
      function (err, result) {
        found.push(result.id)

        if (expected.indexOf(result.id) === -1) {
          error += 'Unexpected result ' + result.id + '\n'
        }
      },
      function (err) {
        if (err) {
          return done(err)
        }

        if (error) {
          return done(error)
        }

        if (found.length !== expected.length) {
          return done('Wrong count of objects returned:\n' +
               'Expected: ' + expected.join(', ') + '\n' +
               'Found: ' + found.join(', '))
        }

        if (foundMembers.length !== expectedMembers.length) {
          return done('Wrong count of member objects returned:\n' +
               'Expected: ' + expectedMembers.join(', ') + '\n' +
               'Found: ' + foundMembers.join(', '))
        }

        assert.equal(foundSubRequestCount, expectedSubRequestCount, 'Wrong count of sub requests!')

        request.off('subrequest-compile', compileListener)

        done()
      }
    )

    request.on('subrequest-compile', compileListener)
  })

  it('Simple queries - routes (with empty cache)', function (done) {
    overpassFrontend.clearCache()
    var expected = [ 'r910885', 'r910886', 'r1306732', 'r1306733' ]
    var expectedMembers = [ 'n2293993991', 'n2293993859', 'n2293993867' , 'n2293993929', 'w122580925', 'w220270706', 'w220270708', 'w220270709', 'w220270714', 'w232881263', 'w232881441', 'w261111319', 'w220270696', 'w220270713', 'w383292582' ]
    var found = []
    var foundMembers = []
    var error = ''
    var bbox = {
	"maxlat": 48.19953,
	"maxlon": 16.33506,
	"minlat": 48.19800,
	"minlon": 16.32581,
      }

    var expectedSubRequestCount = 2
    var foundSubRequestCount = 0

    function compileListener (subRequest) {
      foundSubRequestCount++
    }

    var request = overpassFrontend.BBoxQuery(
      "relation[type=route][route=tram]",
      bbox,
      {
        "members": true,
        "properties": OverpassFrontend.TAGS | OverpassFrontend.MEMBERS,
        "memberProperties": OverpassFrontend.TAGS | OverpassFrontend.GEOM,
        "memberBounds": bbox,
        "memberCallback": function (err, result) {
          console.log('got', result.id)
          foundMembers.push(result.id)

          result.memberOf.forEach(memberOf => {
            if (found.indexOf(memberOf.relation.id) === -1) {
              assert.fail('memberCallback for ' + result.id + ' called before featureCallback for ' + memberOf.relation.id)
            }
          })

          if (expectedMembers.indexOf(result.id) === -1) {
            error += 'Unexpected member result ' + result.id + '\n'
          }
        }
      },
      function (err, result) {
        found.push(result.id)

        if (expected.indexOf(result.id) === -1) {
          error += 'Unexpected result ' + result.id + '\n'
        }
      },
      function (err) {
        if (err) {
          return done(err)
        }

        if (error) {
          return done(error)
        }

        if (found.length !== expected.length) {
          return done('Wrong count of objects returned:\n' +
               'Expected: ' + expected.join(', ') + '\n' +
               'Found: ' + found.join(', '))
        }

        if (foundMembers.length !== expectedMembers.length) {
          return done('Wrong count of member objects returned:\n' +
               'Expected: ' + expectedMembers.join(', ') + '\n' +
               'Found: ' + foundMembers.join(', '))
        }

        assert.equal(foundSubRequestCount, expectedSubRequestCount, 'Wrong count of sub requests!')

        request.off('subrequest-compile', compileListener)

        done()
      })

      request.on('subrequest-compile', compileListener)
  })

  it('Simple queries - routes (fully cached)', function (done) {
    var expected = [ 'r910885', 'r910886', 'r1306732', 'r1306733' ]
    var expectedMembers = [ 'n2293993991', 'n2293993859', 'n2293993867' , 'n2293993929', 'w122580925', 'w220270706', 'w220270708', 'w220270709', 'w220270714', 'w232881263', 'w232881441', 'w261111319', 'w220270696', 'w220270713', 'w383292582' ]
    var found = []
    var foundMembers = []
    var error = ''
    var bbox = {
	"maxlat": 48.19953,
	"maxlon": 16.33506,
	"minlat": 48.19800,
	"minlon": 16.32581,
      }

    var expectedSubRequestCount = 0
    var foundSubRequestCount = 0

    function compileListener (subRequest) {
      foundSubRequestCount++
    }

    var request = overpassFrontend.BBoxQuery(
      "relation[type=route][route=tram]",
      bbox,
      {
        "members": true,
        "properties": OverpassFrontend.TAGS | OverpassFrontend.MEMBERS,
        "memberProperties": OverpassFrontend.TAGS | OverpassFrontend.GEOM,
        "memberBounds": bbox,
        "memberCallback": function (err, result) {
          foundMembers.push(result.id)

          result.memberOf.forEach(memberOf => {
            if (found.indexOf(memberOf.relation.id) === -1) {
              assert.fail('memberCallback for ' + result.id + ' called before featureCallback for ' + memberOf.relation.id)
            }
          })

          if (expectedMembers.indexOf(result.id) === -1) {
            error += 'Unexpected member result ' + result.id + '\n'
          }
        }
      },
      function (err, result) {
        found.push(result.id)

        if (expected.indexOf(result.id) === -1) {
          error += 'Unexpected result ' + result.id + '\n'
        }
      },
      function (err) {
        if (err) {
          return done(err)
        }

        if (error) {
          return done(error)
        }

        if (found.length !== expected.length) {
          return done('Wrong count of objects returned:\n' +
               'Expected: ' + expected.join(', ') + '\n' +
               'Found: ' + found.join(', '))
        }

        if (foundMembers.length !== expectedMembers.length) {
          return done('Wrong count of member objects returned:\n' +
               'Expected: ' + expectedMembers.join(', ') + '\n' +
               'Found: ' + foundMembers.join(', '))
        }

        request.off('subrequest-compile', compileListener)

        done()
      }
    )

    request.on('subrequest-compile', compileListener)
  })

  it('Simple queries - routes with different area', function (done) {
    var expected = [ 'r1306732', 'r1306733' ]
    var expectedMembers = [ 'w232881441', 'w383292582', 'n2411909898', 'n2411911256' ]
    var found = []
    var foundMembers = []
    var error = ''
    var bbox = {
        "maxlat": 48.20400,
        "maxlon": 16.33106,
        "minlat": 48.19940,
        "minlon": 16.32281,
      }

    var expectedSubRequestCount = 1
    var foundSubRequestCount = 0

    function compileListener (subRequest) {
      foundSubRequestCount++
    }

    var request = overpassFrontend.BBoxQuery(
      "relation[type=route][route=tram]",
      bbox,
      {
        "members": true,
        "properties": OverpassFrontend.TAGS | OverpassFrontend.MEMBERS,
        "memberProperties": OverpassFrontend.TAGS | OverpassFrontend.GEOM,
        "memberBounds": bbox,
        "memberCallback": function (err, result) {
          foundMembers.push(result.id)

          result.memberOf.forEach(memberOf => {
            if (found.indexOf(memberOf.relation.id) === -1) {
              assert.fail('memberCallback for ' + result.id + ' called before featureCallback for ' + memberOf.relation.id)
            }
          })

          if (expectedMembers.indexOf(result.id) === -1) {
            error += 'Unexpected member result ' + result.id + '\n'
          }
        }
      },
      function (err, result) {
        found.push(result.id)

        if (expected.indexOf(result.id) === -1) {
          error += 'Unexpected result ' + result.id + '\n'
        }
      },
      function (err) {
        if (err) {
          return done(err)
        }

        if (error) {
          return done(error)
        }

        if (found.length !== expected.length) {
          return done('Wrong count of objects returned:\n' +
               'Expected: ' + expected.join(', ') + '\n' +
               'Found: ' + found.join(', '))
        }

        if (foundMembers.length !== expectedMembers.length) {
          return done('Wrong count of member objects returned:\n' +
               'Expected: ' + expectedMembers.join(', ') + '\n' +
               'Found: ' + foundMembers.join(', '))
        }

        assert.equal(foundSubRequestCount, expectedSubRequestCount, 'Wrong count of sub requests!')

        request.off('subrequest-compile', compileListener)

        done()
      }
    )

    request.on('subrequest-compile', compileListener)
  })

  it('Simple queries - routes with different area', function (done) {
    var expected = [ 'r1306732', 'r1306733' ]
    var expectedMembers = [ 'w232881441', 'w383292582' ]
    var found = []
    var foundMembers = []
    var error = ''
    var bbox = {
        "maxlat": 48.19980,
        "maxlon": 16.33106,
        "minlat": 48.19940,
        "minlon": 16.32281,
      }

    var expectedSubRequestCount = 1 // 0!
    var foundSubRequestCount = 0

    function compileListener (subRequest) {
      console.log(subRequest.query)
      foundSubRequestCount++
    }

    var request = overpassFrontend.BBoxQuery(
      "relation[type=route][route=tram]",
      bbox,
      {
        "members": true,
        "properties": OverpassFrontend.TAGS | OverpassFrontend.MEMBERS,
        "memberProperties": OverpassFrontend.TAGS | OverpassFrontend.GEOM,
        "memberBounds": bbox,
        "memberCallback": function (err, result) {
          foundMembers.push(result.id)

          result.memberOf.forEach(memberOf => {
            if (found.indexOf(memberOf.relation.id) === -1) {
              assert.fail('memberCallback for ' + result.id + ' called before featureCallback for ' + memberOf.relation.id)
            }
          })

          if (expectedMembers.indexOf(result.id) === -1) {
            error += 'Unexpected member result ' + result.id + '\n'
          }
        }
      },
      function (err, result) {
        found.push(result.id)

        if (expected.indexOf(result.id) === -1) {
          error += 'Unexpected result ' + result.id + '\n'
        }
      },
      function (err) {
        if (err) {
          return done(err)
        }

        if (error) {
          return done(error)
        }

        if (found.length !== expected.length) {
          return done('Wrong count of objects returned:\n' +
               'Expected: ' + expected.join(', ') + '\n' +
               'Found: ' + found.join(', '))
        }

        if (foundMembers.length !== expectedMembers.length) {
          return done('Wrong count of member objects returned:\n' +
               'Expected: ' + expectedMembers.join(', ') + '\n' +
               'Found: ' + foundMembers.join(', '))
        }

        assert.equal(foundSubRequestCount, expectedSubRequestCount, 'Wrong count of sub requests!')

        request.off('subrequest-compile', compileListener)

        done()
      }
    )

    request.on('subrequest-compile', compileListener)
  })

  it('Simple queries - routes with different area (and more routes)', function (done) {
    var expected = [ 'r1306732', 'r1306733', 'r1809913', 'r1990861', 'r1809912', 'r1990860', 'r2005432' ]
    var expectedMembers = [ 'n287235515', 'n2208875393', 'w210599976', 'w125586446', 'w141233631', 'w210848994', 'w26231340', 'w26231341', 'w88093287', 'w146678761', 'w146678770', 'w235999782', 'w236000375', 'w236000518' ]
    var found = []
    var foundMembers = []
    var error = ''
    var bbox = {
        "maxlat": 48.19900,
        "maxlon": 16.34025,
        "minlat": 48.19698,
        "minlon": 16.33791
      }

    var expectedSubRequestCount = 2
    var foundSubRequestCount = 0

    function compileListener (subRequest) {
      foundSubRequestCount++
    }

    var request = overpassFrontend.BBoxQuery(
      "relation[type=route][route=tram]",
      bbox,
      {
        "members": true,
        "properties": OverpassFrontend.TAGS | OverpassFrontend.MEMBERS,
        "memberProperties": OverpassFrontend.TAGS | OverpassFrontend.GEOM,
        "memberBounds": bbox,
        "memberCallback": function (err, result) {
          foundMembers.push(result.id)

          result.memberOf.forEach(memberOf => {
            if (found.indexOf(memberOf.relation.id) === -1) {
              assert.fail('memberCallback for ' + result.id + ' called before featureCallback for ' + memberOf.relation.id)
            }
          })

          if (expectedMembers.indexOf(result.id) === -1) {
            error += 'Unexpected member result ' + result.id + '\n'
          }
        }
      },
      function (err, result) {
        found.push(result.id)

        if (expected.indexOf(result.id) === -1) {
          error += 'Unexpected result ' + result.id + '\n'
        }
      },
      function (err) {
        if (err) {
          return done(err)
        }

        if (error) {
          return done(error)
        }

        if (found.length !== expected.length) {
          return done('Wrong count of objects returned:\n' +
               'Expected: ' + expected.join(', ') + '\n' +
               'Found: ' + found.join(', '))
        }

        if (foundMembers.length !== expectedMembers.length) {
          return done('Wrong count of member objects returned:\n' +
               'Expected: ' + expectedMembers.join(', ') + '\n' +
               'Found: ' + foundMembers.join(', '))
        }

        assert.equal(foundSubRequestCount, expectedSubRequestCount, 'Wrong count of sub requests!')

        request.off('subrequest-compile', compileListener)

        done()
      }
    )

    request.on('subrequest-compile', compileListener)
  })

  it('Simple queries - routes with split', function (done) {
    overpassFrontend.clearBBoxQuery("relation[type=route][route=tram]")
    var expected = [ 'r910885', 'r910886', 'r1306732', 'r1306733' ]
    var expectedMembers = [ 'n2293993991', 'n2293993859', 'n2293993867' , 'n2293993929', 'w122580925', 'w220270706', 'w220270708', 'w220270709', 'w220270714', 'w232881263', 'w232881441', 'w261111319', 'w220270696', 'w220270713', 'w383292582' ]
    var found = []
    var foundMembers = []
    var error = ''
    var bbox = {
	"maxlat": 48.19953,
	"maxlon": 16.33506,
	"minlat": 48.19800,
	"minlon": 16.32581,
      }

    var expectedSubRequestCount = 1
    var foundSubRequestCount = 0

    function compileListener (subRequest) {
      foundSubRequestCount++
    }

    var request = overpassFrontend.BBoxQuery(
      "relation[type=route][route=tram]",
      bbox,
      {
        "members": true,
        "properties": OverpassFrontend.TAGS | OverpassFrontend.MEMBERS,
        "memberProperties": OverpassFrontend.TAGS | OverpassFrontend.GEOM,
        "memberBounds": bbox,
        "split": 1,
        "memberCallback": function (err, result) {
          foundMembers.push(result.id)

          result.memberOf.forEach(memberOf => {
            if (found.indexOf(memberOf.relation.id) === -1) {
              assert.fail('memberCallback for ' + result.id + ' called before featureCallback for ' + memberOf.relation.id)
            }
          })

          if (expectedMembers.indexOf(result.id) === -1) {
            error += 'Unexpected member result ' + result.id + '\n'
          }
        }
      },
      function (err, result) {
        found.push(result.id)

        if (expected.indexOf(result.id) === -1) {
          error += 'Unexpected result ' + result.id + '\n'
        }
      },
      function (err) {
        if (err) {
          return done(err)
        }

        if (error) {
          return done(error)
        }

        if (found.length !== expected.length) {
          return done('Wrong count of objects returned:\n' +
               'Expected: ' + expected.join(', ') + '\n' +
               'Found: ' + found.join(', '))
        }

        if (foundMembers.length !== expectedMembers.length) {
          return done('Wrong count of member objects returned:\n' +
               'Expected: ' + expectedMembers.join(', ') + '\n' +
               'Found: ' + foundMembers.join(', '))
        }

        assert.equal(foundSubRequestCount, expectedSubRequestCount, 'Wrong count of sub requests!')

        request.off('subrequest-compile', compileListener)

        done()
      }
    )

    request.on('subrequest-compile', compileListener)
  })

  it('Simple queries - routes with memberSplit', function (done) {
    overpassFrontend.clearBBoxQuery("relation[type=route][route=tram]")
    var expected = [ 'r910885', 'r910886', 'r1306732', 'r1306733' ]
    var expectedMembers = [ 'n2293993991', 'n2293993859', 'n2293993867' , 'n2293993929', 'w122580925', 'w220270706', 'w220270708', 'w220270709', 'w220270714', 'w232881263', 'w232881441', 'w261111319', 'w220270696', 'w220270713', 'w383292582' ]
    var found = []
    var foundMembers = []
    var error = ''
    var bbox = {
	"maxlat": 48.19953,
	"maxlon": 16.33506,
	"minlat": 48.19800,
	"minlon": 16.32581,
      }

    var expectedSubRequestCount = 1
    var foundSubRequestCount = 0

    function compileListener (subRequest) {
      foundSubRequestCount++
    }

    var request = overpassFrontend.BBoxQuery(
      "relation[type=route][route=tram]",
      bbox,
      {
        "members": true,
        "properties": OverpassFrontend.TAGS | OverpassFrontend.MEMBERS,
        "memberProperties": OverpassFrontend.TAGS | OverpassFrontend.GEOM,
        "memberSplit": 5,
        "memberBounds": bbox,
        "memberCallback": function (err, result) {
          foundMembers.push(result.id)

          result.memberOf.forEach(memberOf => {
            if (found.indexOf(memberOf.relation.id) === -1) {
              assert.fail('memberCallback for ' + result.id + ' called before featureCallback for ' + memberOf.relation.id)
            }
          })

          if (expectedMembers.indexOf(result.id) === -1) {
            error += 'Unexpected member result ' + result.id + '\n'
          }
        }
      },
      function (err, result) {
        found.push(result.id)

        if (expected.indexOf(result.id) === -1) {
          error += 'Unexpected result ' + result.id + '\n'
        }
      },
      function (err) {
        if (err) {
          return done(err)
        }

        if (error) {
          return done(error)
        }

        if (found.length !== expected.length) {
          return done('Wrong count of objects returned:\n' +
               'Expected: ' + expected.join(', ') + '\n' +
               'Found: ' + found.join(', '))
        }

        if (foundMembers.length !== expectedMembers.length) {
          return done('Wrong count of member objects returned:\n' +
               'Expected: ' + expectedMembers.join(', ') + '\n' +
               'Found: ' + foundMembers.join(', '))
        }

        assert.equal(foundSubRequestCount, expectedSubRequestCount, 'Wrong count of sub requests!')

        request.off('subrequest-compile', compileListener)

        done()
      }
    )

    request.on('subrequest-compile', compileListener)
  })

  it('Simple queries - routes with split and memberSplit', function (done) {
    overpassFrontend.clearBBoxQuery("relation[type=route][route=tram]")
    var expected = [ 'r910885', 'r910886', 'r1306732', 'r1306733' ]
    var expectedMembers = [ 'n2293993991', 'n2293993859', 'n2293993867' , 'n2293993929', 'w122580925', 'w220270706', 'w220270708', 'w220270709', 'w220270714', 'w232881263', 'w232881441', 'w261111319', 'w220270696', 'w220270713', 'w383292582' ]
    var found = []
    var foundMembers = []
    var error = ''
    var bbox = {
	"maxlat": 48.19953,
	"maxlon": 16.33506,
	"minlat": 48.19800,
	"minlon": 16.32581,
      }

    var expectedSubRequestCount = 1
    var foundSubRequestCount = 0

    function compileListener (subRequest) {
      foundSubRequestCount++
    }

    var request = overpassFrontend.BBoxQuery(
      "relation[type=route][route=tram]",
      bbox,
      {
        "members": true,
        "properties": OverpassFrontend.TAGS | OverpassFrontend.MEMBERS,
        "memberProperties": OverpassFrontend.TAGS | OverpassFrontend.GEOM,
        "memberBounds": bbox,
        "split": 1,
        "memberSplit": 5,
        "memberCallback": function (err, result) {
          foundMembers.push(result.id)

          result.memberOf.forEach(memberOf => {
            if (found.indexOf(memberOf.relation.id) === -1) {
              assert.fail('memberCallback for ' + result.id + ' called before featureCallback for ' + memberOf.relation.id)
            }
          })

          if (expectedMembers.indexOf(result.id) === -1) {
            error += 'Unexpected member result ' + result.id + '\n'
          }
        }
      },
      function (err, result) {
        found.push(result.id)

        if (expected.indexOf(result.id) === -1) {
          error += 'Unexpected result ' + result.id + '\n'
        }
      },
      function (err) {
        if (err) {
          return done(err)
        }

        if (error) {
          return done(error)
        }

        if (found.length !== expected.length) {
          return done('Wrong count of objects returned:\n' +
               'Expected: ' + expected.join(', ') + '\n' +
               'Found: ' + found.join(', '))
        }

        if (foundMembers.length !== expectedMembers.length) {
          return done('Wrong count of member objects returned:\n' +
               'Expected: ' + expectedMembers.join(', ') + '\n' +
               'Found: ' + foundMembers.join(', '))
        }

        assert.equal(foundSubRequestCount, expectedSubRequestCount, 'Wrong count of sub requests!')

        request.off('subrequest-compile', compileListener)

        done()
      }
    )

    request.on('subrequest-compile', compileListener)
  })

  it('Simple queries - routes without members to fill cache', function (done) {
    overpassFrontend.clearBBoxQuery("relation[type=route][route=tram]")
    var expected = [ 'r910885', 'r910886', 'r1306732', 'r1306733' ]
    var found = []
    var error = ''
    var bbox = {
	"maxlat": 48.19953,
	"maxlon": 16.33506,
	"minlat": 48.19800,
	"minlon": 16.32581,
      }

    var expectedSubRequestCount = 0
    var foundSubRequestCount = 0

    function compileListener (subRequest) {
      foundSubRequestCount++
    }

    var request = overpassFrontend.BBoxQuery(
      "relation[type=route][route=tram]",
      bbox,
      {
        "properties": OverpassFrontend.TAGS | OverpassFrontend.MEMBERS,
        "memberBounds": bbox
      },
      function (err, result) {
        found.push(result.id)

        if (expected.indexOf(result.id) === -1) {
          error += 'Unexpected result ' + result.id + '\n'
        }
      },
      function (err) {
        if (err) {
          return done(err)
        }

        if (error) {
          return done(error)
        }

        if (found.length !== expected.length) {
          return done('Wrong count of objects returned:\n' +
               'Expected: ' + expected.join(', ') + '\n' +
               'Found: ' + found.join(', '))
        }

        assert.equal(foundSubRequestCount, expectedSubRequestCount, 'Wrong count of sub requests!')

        request.off('subrequest-compile', compileListener)

        done()
      }
    )

    request.on('subrequest-compile', compileListener)
  })

  it('Simple queries - routes with members after cache for parents full', function (done) {
    var expected = [ 'r910885', 'r910886', 'r1306732', 'r1306733' ]
    var expectedMembers = [ 'n2293993991', 'n2293993859', 'n2293993867' , 'n2293993929', 'w122580925', 'w220270706', 'w220270708', 'w220270709', 'w220270714', 'w232881263', 'w232881441', 'w261111319', 'w220270696', 'w220270713', 'w383292582' ]
    var found = []
    var foundMembers = []
    var error = ''
    var bbox = {
	"maxlat": 48.19953,
	"maxlon": 16.33506,
	"minlat": 48.19800,
	"minlon": 16.32581,
      }

    var expectedSubRequestCount = 1
    var foundSubRequestCount = 0

    function compileListener (subRequest) {
      foundSubRequestCount++
    }

    var request = overpassFrontend.BBoxQuery(
      "relation[type=route][route=tram]",
      bbox,
      {
        "members": true,
        "properties": OverpassFrontend.TAGS | OverpassFrontend.MEMBERS,
        "memberProperties": OverpassFrontend.TAGS | OverpassFrontend.GEOM,
        "memberBounds": bbox,
        "memberCallback": function (err, result) {
          foundMembers.push(result.id)

          result.memberOf.forEach(memberOf => {
            if (found.indexOf(memberOf.relation.id) === -1) {
              assert.fail('memberCallback for ' + result.id + ' called before featureCallback for ' + memberOf.relation.id)
            }
          })

          if (expectedMembers.indexOf(result.id) === -1) {
            error += 'Unexpected member result ' + result.id + '\n'
          }
        }
      },
      function (err, result) {
        found.push(result.id)

        if (expected.indexOf(result.id) === -1) {
          error += 'Unexpected result ' + result.id + '\n'
        }
      },
      function (err) {
        if (err) {
          return done(err)
        }

        if (error) {
          return done(error)
        }

        if (found.length !== expected.length) {
          return done('Wrong count of objects returned:\n' +
               'Expected: ' + expected.join(', ') + '\n' +
               'Found: ' + found.join(', '))
        }

        if (foundMembers.length !== expectedMembers.length) {
          return done('Wrong count of member objects returned:\n' +
               'Expected: ' + expectedMembers.join(', ') + '\n' +
               'Found: ' + foundMembers.join(', '))
        }

        assert.equal(foundSubRequestCount, expectedSubRequestCount, 'Wrong count of sub requests!')

        request.off('subrequest-compile', compileListener)

        done()
      }
    )

    request.on('subrequest-compile', compileListener)
  })

  it('Simple queries - routes with members - default properties', function (done) {
    overpassFrontend.clearBBoxQuery("relation[type=route][route=tram]")
    overpassFrontend.removeFromCache('r910885')
    overpassFrontend.removeFromCache('n2293993991')
    overpassFrontend.removeFromCache('w220270696')
    var expected = [ 'r910885', 'r910886', 'r1306732', 'r1306733' ]
    var expectedMembers = [ 'n2293993991', 'n2293993859', 'n2293993867' , 'n2293993929', 'w122580925', 'w220270706', 'w220270708', 'w220270709', 'w220270714', 'w232881263', 'w232881441', 'w261111319', 'w220270696', 'w220270713', 'w383292582' ]
    var found = []
    var foundMembers = []
    var error = ''
    var bbox = {
	"maxlat": 48.19953,
	"maxlon": 16.33506,
	"minlat": 48.19800,
	"minlon": 16.32581,
      }

    var expectedSubRequestCount = 2
    var foundSubRequestCount = 0

    function compileListener (subRequest) {
      foundSubRequestCount++
    }

    var request = overpassFrontend.BBoxQuery(
      "relation[type=route][route=tram]",
      bbox,
      {
        "members": true,
        "memberBounds": bbox,
        "memberCallback": function (err, result) {
          foundMembers.push(result.id)

          if (expectedMembers.indexOf(result.id) === -1) {
            error += 'Unexpected member result ' + result.id + '\n'
          }

// TODO: when removing objects from cache remove memberOf references
//          result.memberOf.forEach(memberOf => {
//            if (found.indexOf(memberOf.relation.id) === -1) {
//              assert.fail('memberCallback for ' + result.id + ' called before featureCallback for ' + memberOf.relation.id)
//            }
//          })

          assert.equal(OverpassFrontend.DEFAULT, result.properties&OverpassFrontend.DEFAULT)
        }
      },
      function (err, result) {
        found.push(result.id)

        if (expected.indexOf(result.id) === -1) {
          error += 'Unexpected result ' + result.id + '\n'
        }

        assert.equal(OverpassFrontend.DEFAULT, result.properties&OverpassFrontend.DEFAULT)
      },
      function (err) {
        if (err) {
          return done(err)
        }

        if (error) {
          return done(error)
        }

        if (found.length !== expected.length) {
          return done('Wrong count of objects returned:\n' +
               'Expected: ' + expected.join(', ') + '\n' +
               'Found: ' + found.join(', '))
        }

        if (foundMembers.length !== expectedMembers.length) {
          return done('Wrong count of member objects returned:\n' +
               'Expected: ' + expectedMembers.join(', ') + '\n' +
               'Found: ' + foundMembers.join(', '))
        }

        assert.equal(foundSubRequestCount, expectedSubRequestCount, 'Wrong count of sub requests!')

        request.off('subrequest-compile', compileListener)

        done()
      }
    )

    request.on('subrequest-compile', compileListener)
  })

  it('Simple queries - without memberBounds', function (done) {
    var expected = [ 'r910885', 'r910886', 'r1306732', 'r1306733' ]
    var expectedMembers = [ 'n2293993867', 'w122580925', 'w220270706', 'w220270709', 'n2293993859', 'w261111319', 'n2293993929', 'n79721398', 'w220270708', 'w220270714', 'w220270713', 'n2411911256', 'w232881441', 'n2411909898', 'w232881263', 'w383292582', 'n2510471036', 'n2510471049', 'n2510471146', 'n2510471157', 'n2510471164', 'n2510471174', 'n2510471090', 'n2510471122', 'n2509620147', 'n2510471103', 'n2293993855', 'n2293993868', 'n2293993991', 'n287235515', 'n430450310', 'n430450314', 'n2711859002', 'n647991', 'n2705819745', 'n1100482424', 'n1321314195', 'n4076152498', 'n4076152499', 'n2288199701', 'n2288199703', 'n2329827456', 'n2331960742', 'n2293993866', 'n2293994066', 'n2285911704', 'n2285911663', 'n2285911667', 'n2285911665', 'n2285911692', 'n2285911702', 'n1546106141', 'n1546106157', 'n2223156317', 'n2285945342', 'n2423365127', 'n473167212', 'n1630416816', 'n2216507460', 'n2216530088', 'n1394529428', 'n2293993848', 'n2293994095', 'n2287963578', 'n2293993846', 'n2293994047', 'n2287963583', 'n2296833061', 'n2296833110', 'n276171350', 'n2211384239', 'n2296833085', 'n2296833114', 'n2296833122', 'n2296833143', 'n2407351716', 'n2407351717', 'n2407231833', 'n2407231834', 'n2407325778', 'n252511595', 'n253233651', 'n2292452224', 'n2411950477', 'n269541925', 'n2407260774', 'n2407325779', 'n60676388', 'w219680833', 'w265532169', 'w122580876', 'w122580924', 'w141233631', 'w210848994', 'w26231341', 'w88093287', 'w146678770', 'w236000518', 'w25585625', 'w27999826', 'w27999830', 'w58993078', 'w58993079', 'w140549303', 'w140549310', 'w264935316', 'w264935317', 'w264935318', 'w265532639', 'w358479330', 'w25585623', 'w25585675', 'w25585676', 'w235853811', 'w235853813', 'w251163470', 'w251163471', 'w265532171', 'w243573842', 'w25585622', 'w243575581', 'w140994821', 'w140994822', 'w217210755', 'w217210756', 'w220270704', 'w220270712', 'w122504890', 'w122504891', 'w263674444', 'w219430764', 'w219431980', 'w220270696', 'w383292589', 'w263674442', 'w5004103', 'w26617432', 'w26617436', 'w30090106', 'w30090108', 'w138647474', 'w141233626', 'w141233628', 'w141233629', 'w148759704', 'w212471618', 'w219431979', 'w228788310', 'w228788312', 'w229818937', 'w141233627', 'w146985784', 'w232385437', 'w232385442', 'w20447121', 'w148759701', 'w211680460', 'w211680461', 'w211682606', 'w211685484', 'w232385434', 'w232385435', 'w232385436', 'w244147727', 'w244148096', 'w244148097', 'w24877453', 'w25585539', 'w125586439', 'w220270694', 'w220270705', 'w228707690', 'w228707696', 'w243704616', 'w243705593', 'w228707705', 'w228707706', 'w219652645', 'w228707687', 'w228707710', 'w243702669', 'w146836190', 'w243702668', 'w251518413', 'w251518415', 'w122729040', 'w122729041', 'w219652646', 'w239913341', 'w251518411', 'w251518414', 'w251518416', 'w384007076', 'w384007077', 'w384007078', 'w384007079', 'w25585540', 'w139442068', 'w239913340', 'w251518410', 'w251518412', 'w384007081', 'w180696708', 'w232385441', 'w383292593', 'w383292591', 'w232372749', 'w232372750', 'w232381392', 'w232382707', 'w232382712', 'w380821195', 'w220063906', 'w232382706', 'w232382709', 'w250584757', 'w380935815', 'w23320744', 'w220063909', 'w220063912', 'w232884024', 'w232884025', 'w232884028', 'w232884029', 'w232884030', 'w232884207', 'w232884208', 'w380598626', 'w380598640', 'w175441902', 'w180696709', 'w232381393', 'w232382708', 'w232382710', 'w25452759', 'w25498434', 'w25498436', 'w47800671', 'w58993077', 'w263063495', 'w417105647' ]
    var found = []
    var foundMembers = []
    var error = ''
    var bbox = {
	"maxlat": 48.19953,
	"maxlon": 16.33506,
	"minlat": 48.19800,
	"minlon": 16.32581,
      }

    var expectedSubRequestCount = 1
    var foundSubRequestCount = 0

    function compileListener (subRequest) {
      foundSubRequestCount++
    }

    var request = overpassFrontend.BBoxQuery(
      "relation[type=route][route=tram]",
      bbox,
      {
        "members": true,
        "properties": OverpassFrontend.TAGS | OverpassFrontend.MEMBERS,
        "memberProperties": OverpassFrontend.TAGS | OverpassFrontend.GEOM,
        "memberCallback": function (err, result) {
          foundMembers.push(result.id)

          result.memberOf.forEach(memberOf => {
            let relId = memberOf.relation.id
            if (expected.indexOf(relId) !== -1 && found.indexOf(relId) === -1) {
              assert.fail('memberCallback for ' + result.id + ' called before featureCallback for ' + memberOf.relation.id)
            }
          })

          if (expectedMembers.indexOf(result.id) === -1) {
            error += 'Unexpected member result ' + result.id + '\n'
          }
        }
      },
      function (err, result) {
        found.push(result.id)

        if (expected.indexOf(result.id) === -1) {
          error += 'Unexpected result ' + result.id + '\n'
        }
      },
      function (err) {
        if (err) {
          return done(err)
        }

        if (error) {
          return done(error)
        }

        if (found.length !== expected.length) {
          return done('Wrong count of objects returned:\n' +
               'Expected: ' + expected.join(', ') + '\n' +
               'Found: ' + found.join(', '))
        }

        if (foundMembers.length !== expectedMembers.length) {
          return done('Wrong count of member objects returned:\n' +
               'Expected: ' + expectedMembers.join(', ') + '\n' +
               'Found: ' + foundMembers.join(', '))
        }

        assert.equal(foundSubRequestCount, expectedSubRequestCount, 'Wrong count of sub requests!')

        request.off('subrequest-compile', compileListener)

        done()
      }
    )

    request.on('subrequest-compile', compileListener)
  })

  describe('DB objects, which are referenced by Relation', function() {
    it('check that missing elements are in the cache after loading parent relation', function (done) {
      overpassFrontend.clearCache()

      overpassFrontend.get('r1306966',
        {
          properties: OverpassFrontend.MEMBERS
        },
        function(err, result, index) {
        },
        function(err) {
          assert.equal('n1476773069' in overpassFrontend.cacheElements, true, 'Member object should exist in cache')
          assert.equal('n1022300101' in overpassFrontend.cacheElements, true, 'Member object should exist in cache')

          done(err)
        })
    })

    it('load member object via id', function(done) {
      var finalCalled = 0
      var expectedSubRequestCount = 1
      var foundSubRequestCount = 0
      var expected = [ 'n1022300101' ]
      var expectedNullCount = 1
      var found = []
      var foundNullCount = 0

      function compileListener (subrequest) {
        foundSubRequestCount++
      }

      let request = overpassFrontend.get([ 'n1476773069', 'n1022300101' ],
        {
          properties: OverpassFrontend.ALL
        },
        function(err, result, index) {
          if (result === null) {
            foundNullCount++
          } else {
            assert.equal(expected.indexOf(result.id) === -1, false, 'Object ' + result.id + ' should not be found')
          }
        },
        function(err) {
          assert.equal(finalCalled++, 0, 'Final function called ' + finalCalled + ' times!')
          assert.equal(foundSubRequestCount, expectedSubRequestCount, 'Wrong count of sub requests!')
          assert.equal(foundNullCount, expectedNullCount, 'Wrong count of null objects')

          request.off('subrequest-compile', compileListener)
          done(err)
        })

      request.on('subrequest-compile', compileListener)
    })

    it('load member object via id (all cached)', function(done) {
      var finalCalled = 0
      var expectedSubRequestCount = 0
      var foundSubRequestCount = 0
      var expected = [ 'n1022300101' ]
      var expectedNullCount = 1
      var found = []
      var foundNullCount = 0

      function compileListener (subrequest) {
        foundSubRequestCount++
      }

      let request = overpassFrontend.get([ 'n1476773069', 'n1022300101' ],
        {
          properties: OverpassFrontend.ALL
        },
        function(err, result, index) {
          if (result === null) {
            foundNullCount++
          } else {
            assert.equal(expected.indexOf(result.id) === -1, false, 'Object ' + result.id + ' should not be found')
          }
        },
        function(err) {
          assert.equal(finalCalled++, 0, 'Final function called ' + finalCalled + ' times!')
          assert.equal(foundSubRequestCount, expectedSubRequestCount, 'Wrong count of sub requests!')
          assert.equal(foundNullCount, expectedNullCount, 'Wrong count of null objects')

          request.off('subrequest-compile', compileListener)
          done(err)
        })

      request.on('subrequest-compile', compileListener)
    })
  })

  describe('Check calling events on members', function (done) {
    let member
    let callCount = 0

    function updateCall () {
      callCount++
    }

    it('First request a member', function (done) {
      overpassFrontend.clearCache()

      var request = overpassFrontend.get(
        'w141233631',
        {
          properties: OverpassFrontend.ALL
        },
        (err, result) => {
          member = result
          member.on('update', updateCall)
        },
        done
      )
    })

    it('Now, request a relation', function (done) {
      var request = overpassFrontend.get(
        'r1990860',
        {
          properties: OverpassFrontend.MEMBERS | OverpassFrontend.TAGS
        },
        (err, result) => {
        },
        (err) => {
          assert.equal(callCount, 1)
          member.off('update', updateCall)
          done(err)
        }
      )
    })
  })
})

describe('Overpass Get - Relation with members in BBOX', function() {

  it('Simple queries - routes (cache cleared)', function (done) {
    overpassFrontend.clearCache()

    var expected = [ 'r910885', 'r910886', 'r1306732', 'r1306733' ]
    var expectedMembers = [ 'n2293993867', 'w122580925', 'w220270706', 'w220270709', 'n2293993859', 'w261111319', 'n2293993929', 'n79721398', 'w220270708', 'w220270714', 'w220270713', 'n2411911256', 'w232881441', 'n2411909898', 'w232881263', 'w383292582', 'n2510471036', 'n2510471049', 'n2510471146', 'n2510471157', 'n2510471164', 'n2510471174', 'n2510471090', 'n2510471122', 'n2509620147', 'n2510471103', 'n2293993855', 'n2293993868', 'n2293993991', 'n287235515', 'n430450310', 'n430450314', 'n2711859002', 'n647991', 'n2705819745', 'n1100482424', 'n1321314195', 'n4076152498', 'n4076152499', 'n2288199701', 'n2288199703', 'n2329827456', 'n2331960742', 'n2293993866', 'n2293994066', 'n2285911704', 'n2285911663', 'n2285911667', 'n2285911665', 'n2285911692', 'n2285911702', 'n1546106141', 'n1546106157', 'n2223156317', 'n2285945342', 'n2423365127', 'n473167212', 'n1630416816', 'n2216507460', 'n2216530088', 'n1394529428', 'n2293993848', 'n2293994095', 'n2287963578', 'n2293993846', 'n2293994047', 'n2287963583', 'n2296833061', 'n2296833110', 'n276171350', 'n2211384239', 'n2296833085', 'n2296833114', 'n2296833122', 'n2296833143', 'n2407351716', 'n2407351717', 'n2407231833', 'n2407231834', 'n2407325778', 'n252511595', 'n253233651', 'n2292452224', 'n2411950477', 'n269541925', 'n2407260774', 'n2407325779', 'n60676388', 'w219680833', 'w265532169', 'w122580876', 'w122580924', 'w141233631', 'w210848994', 'w26231341', 'w88093287', 'w146678770', 'w236000518', 'w25585625', 'w27999826', 'w27999830', 'w58993078', 'w58993079', 'w140549303', 'w140549310', 'w264935316', 'w264935317', 'w264935318', 'w265532639', 'w358479330', 'w25585623', 'w25585675', 'w25585676', 'w235853811', 'w235853813', 'w251163470', 'w251163471', 'w265532171', 'w243573842', 'w25585622', 'w243575581', 'w140994821', 'w140994822', 'w217210755', 'w217210756', 'w220270704', 'w220270712', 'w122504890', 'w122504891', 'w263674444', 'w219430764', 'w219431980', 'w220270696', 'w383292589', 'w263674442', 'w5004103', 'w26617432', 'w26617436', 'w30090106', 'w30090108', 'w138647474', 'w141233626', 'w141233628', 'w141233629', 'w148759704', 'w212471618', 'w219431979', 'w228788310', 'w228788312', 'w229818937', 'w141233627', 'w146985784', 'w232385437', 'w232385442', 'w20447121', 'w148759701', 'w211680460', 'w211680461', 'w211682606', 'w211685484', 'w232385434', 'w232385435', 'w232385436', 'w244147727', 'w244148096', 'w244148097', 'w24877453', 'w25585539', 'w125586439', 'w220270694', 'w220270705', 'w228707690', 'w228707696', 'w243704616', 'w243705593', 'w228707705', 'w228707706', 'w219652645', 'w228707687', 'w228707710', 'w243702669', 'w146836190', 'w243702668', 'w251518413', 'w251518415', 'w122729040', 'w122729041', 'w219652646', 'w239913341', 'w251518411', 'w251518414', 'w251518416', 'w384007076', 'w384007077', 'w384007078', 'w384007079', 'w25585540', 'w139442068', 'w239913340', 'w251518410', 'w251518412', 'w384007081', 'w180696708', 'w232385441', 'w383292593', 'w383292591', 'w232372749', 'w232372750', 'w232381392', 'w232382707', 'w232382712', 'w380821195', 'w220063906', 'w232382706', 'w232382709', 'w250584757', 'w380935815', 'w23320744', 'w220063909', 'w220063912', 'w232884024', 'w232884025', 'w232884028', 'w232884029', 'w232884030', 'w232884207', 'w232884208', 'w380598626', 'w380598640', 'w175441902', 'w180696709', 'w232381393', 'w232382708', 'w232382710', 'w25452759', 'w25498434', 'w25498436', 'w47800671', 'w58993077', 'w263063495', 'w417105647' ]
    var found = []
    var foundMembers = []
    var error = ''

    overpassFrontend.get(
      expected,
      {
        "members": true,
        "properties": OverpassFrontend.TAGS | OverpassFrontend.MEMBERS,
        "memberProperties": OverpassFrontend.TAGS | OverpassFrontend.GEOM,
        "memberCallback": function (err, result) {
          foundMembers.push(result.id)

          if (expectedMembers.indexOf(result.id) === -1) {
            error += 'Unexpected member result ' + result.id + '\n'
          }
        }
      },
      function (err, result) {
        found.push(result.id)

        if (expected.indexOf(result.id) === -1) {
          error += 'Unexpected result ' + result.id + '\n'
        }
      },
      function (err) {
        if (err) {
          return done(err)
        }

        if (error) {
          return done(error)
        }

        if (found.length !== expected.length) {
          return done('Wrong count of objects returned:\n' +
               'Expected: (' + expected.length + ') ' + expected.join(', ') + '\n' +
               'Found: (' + found.length + ') ' + found.join(', '))
        }

        if (foundMembers.length !== expectedMembers.length) {
          return done('Wrong count of member objects returned:\n' +
               'Expected: (' + expectedMembers.length + ') ' + expectedMembers.join(', ') + '\n' +
               'Found: (' + foundMembers.length + ') ' + foundMembers.join(', '))
        }

        done()
      }
    )
  })

  it('Simple queries - routes (fully cached)', function (done) {
    var expected = [ 'r910885', 'r910886', 'r1306732', 'r1306733' ]
    var expectedMembers = [ 'n2293993867', 'w122580925', 'w220270706', 'w220270709', 'n2293993859', 'w261111319', 'n2293993929', 'n79721398', 'w220270708', 'w220270714', 'w220270713', 'n2411911256', 'w232881441', 'n2411909898', 'w232881263', 'w383292582', 'n2510471036', 'n2510471049', 'n2510471146', 'n2510471157', 'n2510471164', 'n2510471174', 'n2510471090', 'n2510471122', 'n2509620147', 'n2510471103', 'n2293993855', 'n2293993868', 'n2293993991', 'n287235515', 'n430450310', 'n430450314', 'n2711859002', 'n647991', 'n2705819745', 'n1100482424', 'n1321314195', 'n4076152498', 'n4076152499', 'n2288199701', 'n2288199703', 'n2329827456', 'n2331960742', 'n2293993866', 'n2293994066', 'n2285911704', 'n2285911663', 'n2285911667', 'n2285911665', 'n2285911692', 'n2285911702', 'n1546106141', 'n1546106157', 'n2223156317', 'n2285945342', 'n2423365127', 'n473167212', 'n1630416816', 'n2216507460', 'n2216530088', 'n1394529428', 'n2293993848', 'n2293994095', 'n2287963578', 'n2293993846', 'n2293994047', 'n2287963583', 'n2296833061', 'n2296833110', 'n276171350', 'n2211384239', 'n2296833085', 'n2296833114', 'n2296833122', 'n2296833143', 'n2407351716', 'n2407351717', 'n2407231833', 'n2407231834', 'n2407325778', 'n252511595', 'n253233651', 'n2292452224', 'n2411950477', 'n269541925', 'n2407260774', 'n2407325779', 'n60676388', 'w219680833', 'w265532169', 'w122580876', 'w122580924', 'w141233631', 'w210848994', 'w26231341', 'w88093287', 'w146678770', 'w236000518', 'w25585625', 'w27999826', 'w27999830', 'w58993078', 'w58993079', 'w140549303', 'w140549310', 'w264935316', 'w264935317', 'w264935318', 'w265532639', 'w358479330', 'w25585623', 'w25585675', 'w25585676', 'w235853811', 'w235853813', 'w251163470', 'w251163471', 'w265532171', 'w243573842', 'w25585622', 'w243575581', 'w140994821', 'w140994822', 'w217210755', 'w217210756', 'w220270704', 'w220270712', 'w122504890', 'w122504891', 'w263674444', 'w219430764', 'w219431980', 'w220270696', 'w383292589', 'w263674442', 'w5004103', 'w26617432', 'w26617436', 'w30090106', 'w30090108', 'w138647474', 'w141233626', 'w141233628', 'w141233629', 'w148759704', 'w212471618', 'w219431979', 'w228788310', 'w228788312', 'w229818937', 'w141233627', 'w146985784', 'w232385437', 'w232385442', 'w20447121', 'w148759701', 'w211680460', 'w211680461', 'w211682606', 'w211685484', 'w232385434', 'w232385435', 'w232385436', 'w244147727', 'w244148096', 'w244148097', 'w24877453', 'w25585539', 'w125586439', 'w220270694', 'w220270705', 'w228707690', 'w228707696', 'w243704616', 'w243705593', 'w228707705', 'w228707706', 'w219652645', 'w228707687', 'w228707710', 'w243702669', 'w146836190', 'w243702668', 'w251518413', 'w251518415', 'w122729040', 'w122729041', 'w219652646', 'w239913341', 'w251518411', 'w251518414', 'w251518416', 'w384007076', 'w384007077', 'w384007078', 'w384007079', 'w25585540', 'w139442068', 'w239913340', 'w251518410', 'w251518412', 'w384007081', 'w180696708', 'w232385441', 'w383292593', 'w383292591', 'w232372749', 'w232372750', 'w232381392', 'w232382707', 'w232382712', 'w380821195', 'w220063906', 'w232382706', 'w232382709', 'w250584757', 'w380935815', 'w23320744', 'w220063909', 'w220063912', 'w232884024', 'w232884025', 'w232884028', 'w232884029', 'w232884030', 'w232884207', 'w232884208', 'w380598626', 'w380598640', 'w175441902', 'w180696709', 'w232381393', 'w232382708', 'w232382710', 'w25452759', 'w25498434', 'w25498436', 'w47800671', 'w58993077', 'w263063495', 'w417105647' ]
    var found = []
    var foundMembers = []
    var error = ''

    overpassFrontend.get(
      expected,
      {
        "members": true,
        "properties": OverpassFrontend.TAGS | OverpassFrontend.MEMBERS,
        "memberProperties": OverpassFrontend.TAGS | OverpassFrontend.GEOM,
        "memberCallback": function (err, result) {
          foundMembers.push(result.id)

          if (expectedMembers.indexOf(result.id) === -1) {
            error += 'Unexpected member result ' + result.id + '\n'
          }
        }
      },
      function (err, result) {
        found.push(result.id)

        if (expected.indexOf(result.id) === -1) {
          error += 'Unexpected result ' + result.id + '\n'
        }
      },
      function (err) {
        if (err) {
          return done(err)
        }

        if (error) {
          return done(error)
        }

        if (found.length !== expected.length) {
          return done('Wrong count of objects returned:\n' +
               'Expected: (' + expected.length + ') ' + expected.join(', ') + '\n' +
               'Found: (' + found.length + ') ' + found.join(', '))
        }

        if (foundMembers.length !== expectedMembers.length) {
          return done('Wrong count of member objects returned:\n' +
               'Expected: (' + expectedMembers.length + ') ' + expectedMembers.join(', ') + '\n' +
               'Found: (' + foundMembers.length + ') ' + foundMembers.join(', '))
        }

        done()
      }
    )
  })

  it('Simple queries - routes with memberBounds', function (done) {
    var expected = [ 'r910885', 'r910886', 'r1306732', 'r1306733' ]
    var expectedMembers = [ 'n2293993867', 'n2293993991', 'w122580925', 'w220270696', 'w220270706', 'w220270709', 'n2293993859', 'w261111319', 'n2293993929', 'w220270708', 'w220270714', 'w220270713', 'w232881441', 'w232881263', 'w383292582' ]
    var found = []
    var foundMembers = []
    var error = ''
    var bbox = {
	"maxlat": 48.19953,
	"maxlon": 16.33506,
	"minlat": 48.19800,
	"minlon": 16.32581
    }

    overpassFrontend.get(
      expected,
      {
        "members": true,
        "properties": OverpassFrontend.TAGS | OverpassFrontend.MEMBERS,
        "memberProperties": OverpassFrontend.TAGS | OverpassFrontend.GEOM,
        "memberBounds": bbox,
        "memberCallback": function (err, result) {
          foundMembers.push(result.id)

          if (expectedMembers.indexOf(result.id) === -1) {
            error += 'Unexpected member result ' + result.id + '\n'
          }
        }
      },
      function (err, result) {
        found.push(result.id)

        if (expected.indexOf(result.id) === -1) {
          error += 'Unexpected result ' + result.id + '\n'
        }
      },
      function (err) {
        console.log(foundMembers.join("', '"))
        if (err) {
          return done(err)
        }

        if (error) {
          return done(error)
        }

        if (found.length !== expected.length) {
          return done('Wrong count of objects returned:\n' +
               'Expected: ' + expected.join(', ') + '\n' +
               'Found: ' + found.join(', '))
        }

        if (foundMembers.length !== expectedMembers.length) {
          return done('Wrong count of member objects returned:\n' +
               'Expected: ' + expectedMembers.join(', ') + '\n' +
               'Found: ' + foundMembers.join(', '))
        }

        done()
      }
    )
  })
})

describe('notifyMemberUpdate', function () {
  describe('OverpassWay', function () {
    let expected
    let way

    it('First load the way to see final result', (done) => {
      overpassFrontend.clearCache()

      overpassFrontend.get('w272672836',
        {
          properties: OverpassFrontend.ALL
        },
        (err, result) => {
          if (err) {
            return done(err)
          }

          expected = result
        },
        done
      )
    })

    it('Then cache clear and re-request way without GEOM', (done) => {
      overpassFrontend.clearCache()

      overpassFrontend.get('w272672836',
        {
          properties: OverpassFrontend.TAGS | OverpassFrontend.MEMBERS
        },
        (err, result) => {
          if (err) {
            return done(err)
          }

          way = result

          assert.equal(way.properties, OverpassFrontend.TAGS | OverpassFrontend.MEMBERS, 'Way: Only TAGS and MEMBERS should be known')
          assert.equal(way.geometry, undefined, 'Way: Geometry should not be known')
          assert.equal(way.bounds, undefined, 'Way: Bounds should not be known')
        },
        done
      )
    })

    it('Load one of the nodes -> geometry of way should be partly known', (done) => {
      overpassFrontend.get('n252548491',
        {
          properties: OverpassFrontend.GEOM
        },
        (err, result) => {
          if (err) {
            return done(err)
          }
        },
        (err) => {
          assert.equal(way.properties, OverpassFrontend.TAGS | OverpassFrontend.MEMBERS, 'Way: Only TAGS and MEMBERS should be known')
          assert.deepEqual(way.geometry[1], { lat: 48.1983261, lon: 16.3382355 }, 'Geometry should be partly known')
          assert.deepEqual(way.bounds, { minlat: 48.1983261, maxlat: 48.1983261, minlon: 16.3382355, maxlon: 16.3382355 }, 'Bounds should not be known')

          done(err)
        }
      )
    })

    it('Load the other nodes -> geometry of way should be fully known', (done) => {
      overpassFrontend.get([ 'n378462', 'n2776073558' ],
        {
          properties: OverpassFrontend.GEOM
        },
        (err, result) => {
          if (err) {
            return done(err)
          }
        },
        (err) => {
          assert.equal(way.properties, OverpassFrontend.TAGS | OverpassFrontend.MEMBERS | OverpassFrontend.GEOM | OverpassFrontend.BBOX | OverpassFrontend.CENTER, 'Way: Now, also BBOX, CENTER and GEOM should be known')
          assert.deepEqual(way.geometry, expected.geometry, 'Geometry should be fully known')
          assert.deepEqual(way.bounds, expected.bounds, 'Bounds should be known')
          assert.deepEqual(way.center, expected.center, 'Center should be known')

          done(err)
        }
      )
    })
  })
})

describe('Events', function () {
  describe('OverpassRelation', function () {
    it('Should emit "update" when loading member elements', function (done) {
      overpassFrontend.clearCache()

      let updateCalls = 0
      function countUpdateCalls () {
        if (updateCalls === null) {
          throw new Error('Function should not have been called after finishing test')
        }

        updateCalls++
      }
      
      overpassFrontend.get('r910885',
        {
          properties: OverpassFrontend.MEMBERS | OverpassFrontend.GEOM
        },
        function (err, result) {
          if (err) {
            done(err)
          }

          assert.equal(result.memberFeatures.length, 63, 'Wrong count of member features')
          assert.equal(result.memberFeatures[0].properties, OverpassFrontend.GEOM | OverpassFrontend.BBOX | OverpassFrontend.CENTER, 'Member features has more than GEOM properties')

          result.on('update', countUpdateCalls)

          overpassFrontend.get([ 'w58993078', 'n2329827456' ],
            {
              properties: OverpassFrontend.TAGS
            },
            function (err, result) {
              if (err) {
                done(err)
              }

              if (result.type === 'node') {
                assert.equal(result.properties, OverpassFrontend.GEOM | OverpassFrontend.BBOX | OverpassFrontend.CENTER | OverpassFrontend.TAGS, 'Should know GEOM from relation and TAGS from direct request (node)')
              } else if (result.type === 'way') {
                assert.equal(result.properties, OverpassFrontend.GEOM | OverpassFrontend.BBOX | OverpassFrontend.CENTER | OverpassFrontend.TAGS, 'Should know GEOM from relation and TAGS from direct request (way)')
              }
            },
            function (err) {
              if (err) {
                done(err)
              }

              assert.equal(updateCalls, 1, 'Event "update" should have been called once on relation')

              updateCalls = null
              result.off('update', countUpdateCalls)

              done()
            }
          )
        },
        function (err) {
          if (err) {
            done(err)
          }
        }
      )
    })
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
          assert.deepEqual([], result.memberIds())
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
          }, result.bounds)
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
          assert.deepEqual([], result.memberIds())
          assert.deepEqual({
	    "maxlat": 48.1984802,
	    "maxlon": 16.3384675,
	    "minlat": 48.1984802,
	    "minlon": 16.3384675
          }, result.bounds)
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

    it('method intersects()', function (done) {
      overpassFrontend.get('n3037893169', { properties: OverpassFrontend.BBOX },
        function (err, result, index) {
          assert.equal(2, result.intersects(new BoundingBox({
              minlat: 48.198,
              maxlat: 48.199,
              minlon: 16.338,
              maxlon: 16.339
            }
          )))
          assert.equal(0, result.intersects(new BoundingBox({
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
          }, result.bounds)
        },
        function(err) {
          done()
        }
      )
    })

    it('Overpass.MEMBERS', function(done) {
      overpassFrontend.removeFromCache('w358545531')
      overpassFrontend.get('w358545531', { properties: OverpassFrontend.MEMBERS },
        function(err, result, index) {
          assert.deepEqual(result.nodes,
            [ 252548492, 252548493, 3636794383, 3037366507, 1750886218 ],
            'List of node-IDs wrong!')
          assert.deepEqual(result.members, [
              {
                "id": "n252548492",
                "ref": 252548492,
                "type": "node"
              },
              {
                "id": "n252548493",
                "ref": 252548493,
                "type": "node"
              },
              {
                "id": "n3636794383",
                "ref": 3636794383,
                "type": "node"
              },
              {
                "id": "n3037366507",
                "ref": 3037366507,
                "type": "node"
              },
              {
                "id": "n1750886218",
                "ref": 1750886218,
                "type": "node"
              }
            ]
          )
        },
        function(err) {
          done()
        }
      )
    })

    it('Overpass.GEOM', function(done) {
      overpassFrontend.removeFromCache('w358545531')
      overpassFrontend.get('w358545531', { properties: OverpassFrontend.GEOM },
        function(err, result, index) {
          assert.deepEqual(result.geometry, 
	    [
	      {
		"lat": 48.1984776,
		"lon": 16.3387818
	      },
	      {
		"lat": 48.1986881,
		"lon": 16.3387314
	      },
	      {
		"lat": 48.1991344,
		"lon": 16.33858
	      },
	      {
		"lat": 48.1995912,
		"lon": 16.3383945
	      },
	      {
		"lat": 48.1996981,
		"lon": 16.3383497
	      }
	    ]
	  )
        },
        function(err) {
          done()
        }
      )
    })

    it('method intersects()', function (done) {
      overpassFrontend.get('w299709373', { properties: OverpassFrontend.BBOX },
        function (err, result, index) {
          assert.equal(1, result.intersects(new BoundingBox({
              minlat: 48.198,
              maxlat: 48.199,
              minlon: 16.338,
              maxlon: 16.339
            }
          )))
          assert.equal(0, result.intersects(new BoundingBox({
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
      overpassFrontend.clearCache()
      overpassFrontend.get('r1980077', { properties: OverpassFrontend.BBOX },
        function(err, result, index) {
          assert.deepEqual({
	    "maxlat": 48.1987724,
	    "maxlon": 16.3390104,
	    "minlat": 48.1982148,
	    "minlon": 16.3380726
          }, result.bounds)
        },
        function(err) {
          done()
        }
      )
    })

    it('Overpass.MEMBERS', function(done) {
      overpassFrontend.removeFromCache('r1980077')
      overpassFrontend.get('r1980077', { properties: OverpassFrontend.MEMBERS },
        function(err, result, index) {
          assert.deepEqual(result.members, [
	      {
		"type": "node",
		"ref": 378462,
		"role": "via",
		"id": "n378462"
	      },
	      {
		"type": "way",
		"ref": 4583442,
		"role": "to",
		"id": "w4583442"
	      },
	      {
		"type": "way",
		"ref": 272672836,
		"role": "from",
		"id": "w272672836"
	      }
	    ]
          )

          assert.equal('w4583442' in overpassFrontend.cacheElements, true, 'should have loaded member feature w4583442')

          let member = overpassFrontend.cacheElements['w4583442']
          assert.equal(member.properties, OverpassFrontend.ID_ONLY, 'member w4583442 should have ID_ONLY info')
        },
        function(err) {
          done()
        }
      )
    })

    it('Overpass.GEOM', function(done) {
      overpassFrontend.removeFromCache('r1980077')
      overpassFrontend.get('r1980077', { properties: OverpassFrontend.GEOM | OverpassFrontend.MEMBERS },
        function(err, result, index) {
          assert.deepEqual(result.geometry, 
            {
              "type": "FeatureCollection",
              "features": [
                {
                  "type": "Feature",
                  "id": "way/4583442",
                  "properties": {
                    "id": "way/4583442"
                  },
                  "geometry": {
                    "type": "LineString",
                    "coordinates": [
                      [
                        16.3390104,
                        48.1983967
                      ],
                      [
                        16.3387535,
                        48.1983357
                      ],
                      [
                        16.3386136,
                        48.1983024
                      ],
                      [
                        16.3384619,
                        48.1982664
                      ],
                      [
                        16.3384203,
                        48.198255
                      ],
                      [
                        16.3383811,
                        48.1982449
                      ],
                      [
                        16.3382648,
                        48.1982148
                      ]
                    ]
                  }
                },
                {
                  "type": "Feature",
                  "id": "way/272672836",
                  "properties": {
                    "id": "way/272672836"
                  },
                  "geometry": {
                    "type": "LineString",
                    "coordinates": [
                      [
                        16.3380726,
                        48.1987724
                      ],
                      [
                        16.3382355,
                        48.1983261
                      ],
                      [
                        16.3382648,
                        48.1982148
                      ]
                    ]
                  }
                },
                {
                  "type": "Feature",
                  "id": "node/378462",
                  "properties": {
                    "id": "node/378462"
                  },
                  "geometry": {
                    "type": "Point",
                    "coordinates": [
                      16.3382648,
                      48.1982148
                    ]
                  }
                }
              ]
            }
          )

          assert.equal('w4583442' in overpassFrontend.cacheElements, true, 'should have loaded member feature w4583442')

          let member = overpassFrontend.cacheElements['w4583442']
          assert.equal(member.properties, OverpassFrontend.GEOM | OverpassFrontend.BBOX | OverpassFrontend.CENTER, 'member w4583442 should have GEOM info')
        },
        function(err) {
          done()
        }
      )
    })

    it('method intersects() - BBox only', function (done) {
      overpassFrontend.removeFromCache('r1980077')
      overpassFrontend.get('r1980077', { properties: OverpassFrontend.BBOX },
        function (err, result, index) {
          assert.equal(1, result.intersects(new BoundingBox({
              minlat: 48.198,
              maxlat: 48.199,
              minlon: 16.338,
              maxlon: 16.339
            }
          )))
          assert.equal(0, result.intersects(new BoundingBox({
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

    it('method intersects() - full geometry', function (done) {
      overpassFrontend.get('r1980077', { properties: OverpassFrontend.ALL },
        function (err, result, index) {
          assert.equal(2, result.intersects(new BoundingBox({
              minlat: 48.198,
              maxlat: 48.199,
              minlon: 16.338,
              maxlon: 16.339
            }
          )))
          assert.equal(0, result.intersects(new BoundingBox({
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

    it('method intersects()', function (done) {
      overpassFrontend.get('r20313', { properties: OverpassFrontend.BBOX },
        function (err, result, index) {
          assert.equal(1, result.intersects(new BoundingBox({
              minlat: 48.198,
              maxlat: 48.199,
              minlon: 16.338,
              maxlon: 16.339
            }
          )))
          assert.equal(1, result.intersects(new BoundingBox({
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
      var finalCalled = 0
      overpassFrontend.BBoxQuery(
        'node[amenity=bench',
        {
          minlon: 16.3384616,
          minlat: 48.1990347,
          maxlon: 16.3386118,
          maxlat: 48.1991437
        },
        {
          noCacheQuery: true,
          properties: OverpassFrontend.ID_ONLY
        },
        function(err, result, index) {
          assert.fail('Query wrong, feature_callback should not be called')
        },
        function(err) {
          if(err === null)
            done('Query wrong, should not be successful')

          else if(err == "line 2: parse error: ']' expected - ';' found.\n" +
            "line 4: parse error: Unexpected end of input.\n" +
            "line 4: parse error: Unexpected end of input.\n" +
            "line 4: parse error: Unexpected end of input.\n\n")
            done()

          else
            done('Wrong error message: ' + err)
        }
      )
    })

    it('Server not available - get request', function (done) {
      this.timeout(5000)
      var finalCalled = 0
      var of = new OverpassFrontend('http://domaindoesnotexist.foo')
      of.get([ 'r910885' ],
        {
          properties: OverpassFrontend.ID_ONLY
        },
        function(err, result, index) {
          assert.fail('feature_callback should not be called')
        },
        function(err) {
          if(err === null) {
            done('Query wrong, should not be successful')
          } else {
            done()
          }
        }
      )
    })

    it('Server not available - BBoxQuery request', function (done) {
      var finalCalled = 0
      var of = new OverpassFrontend('invalid')
      of.BBoxQuery(
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
          assert.fail('feature_callback should not be called')
        },
        function(err) {
          if(err === null) {
            done('Query wrong, should not be successful')
          } else {
            done()
          }
        }
      )
    })

    it('http error', function (done) {
      var finalCalled = 0
      var of = new OverpassFrontend('foo://bar')
      of.get(['r910885'],
        {
          properties: OverpassFrontend.ID_ONLY
        },
        function(err, result, index) {
          assert.fail('feature_callback should not be called')
        },
        function(err) {
          if(err === null) {
            done('Query wrong, should not be successful')
          } else {
            done()
          }
        }
      )
    })
  })

  describe('OverpassFrontend, misc functions', function() {
    it('regexpEscape()', function() {
      var finalCalled = 0
      var input = 'bank+atm'
      var expected = 'bank\\+atm'

      assert.equal(expected, overpassFrontend.regexpEscape(input))

      return true
    })
  })

  describe('Request', function() {
    it('get() should return RequestGet object', function (done) {
      var finalCalled = 0
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

      assert.equal('RequestGet', req.constructor.name)
    })

    it('abort() should abort a "get" request', function (done) {
      var finalCalled = 0
      var req = overpassFrontend.get([ 'n3037893161' ],
        {
          properties: OverpassFrontend.ID_ONLY
        },
        function(err, result, index) {
          assert.fail('Should not call feature_callback, as request gets aborted.')
        },
        function(err) {
          done('finalCallback should not be called')
        }
      )

      req.on('abort', () => {
        done()
      })

      req.abort()
    })

    it('abort() should abort a "get" request (even when object has already been loaded)', function (done) {
      var finalCalled = 0
      var req = overpassFrontend.get([ 'n3037893169' ],
        {
          properties: OverpassFrontend.ID_ONLY
        },
        function(err, result, index) {
          assert.fail('Should not call feature_callback, as request gets aborted.')
        },
        function(err) {
          done('finalCallback should not be called')
        }
      )

      req.on('abort', () => {
        done()
      })

      req.abort()
    })

    it('abort() should abort a "BBoxQuery" request', function (done) {
      var finalCalled = 0
      overpassFrontend.clearBBoxQuery('node[natural=tree];')
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
          assert.fail('Should not call feature_callback, as request gets aborted.')
        },
        function(err) {
          done('finalCallback should not be called')
        }
      )

      req.on('abort', () => {
        done()
      })

      req.abort()
    })

    it('abort() should abort a "BBoxQuery" request', function (done) {
      var finalCalled = 0
      overpassFrontend.clearBBoxQuery('node[natural=tree];')
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
          assert.fail('Should not call feature_callback, as request gets aborted.')
        },
        function(err) {
          done('finalCallback should not be called')
        }
      )

      req.on('abort', () => {
        done()
      })

      req.abort()
    })

    it('abortAllRequests() should abort requests', function (done) {
      var finalCalled = 0
      var req = overpassFrontend.get([ 'n3037893161' ],
        {
          properties: OverpassFrontend.ID_ONLY
        },
        function(err, result, index) {
          assert.fail('Should not call feature_callback, as request gets aborted.')
        },
        function(err) {
          done('finalCallback should not be called')
        }
      )

      req.on('abort', () => {
        done()
      })

      overpassFrontend.abortAllRequests()
    })

    it('request list should be empty', function () {
      var finalCalled = 0
      removeNullEntries(overpassFrontend.requests)

      assert.deepEqual(overpassFrontend.requests, [], 'request list should be empty')
      return true
    })
  })
})
