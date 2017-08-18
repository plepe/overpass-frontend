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
      overpassFrontend.get('r910885',
        {
          properties: OverpassFrontend.ALL
        },
        function(err, result, index) {
          assert.equal(err, null, 'Error should be null')
          assert.equal(result.id, 'r910885', 'Wrong object returned: ' + result.id)
        },
        function(err) {
          done(err)
        })
    })

    it('should return null for a missing object', function(done) {
      overpassFrontend.get('r32',
        {
          properties: OverpassFrontend.ALL
        },
        function(err, result, index) {
          assert.equal(err, null, 'Error should be null')
          assert.equal(result, null, 'r32 should not exist!')
        },
        function(err) {
          done(err)
        })
    })

    it('should return null for illegal objects', function(done) {
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
          done(err)
        })
    })

    it('should handle several simultaneous requests', function(done) {
      async.parallel([
        function(callback) {
          overpassFrontend.get('r910886',
            {
              properties: OverpassFrontend.ALL
            },
            function(err, result, index) {
              assert.equal(err, null, 'Error should be null')
              assert.equal('r910886', result.id, 'Wrong object ' + result.id + '?')
            },
            function(err) {
              callback(err)
            }
          )
        },
        function(callback) {
          overpassFrontend.get('n79721398',
            {
              properties: OverpassFrontend.ALL
            },
            function(err, result, index) {
              assert.equal(err, null, 'Error should be null')
              assert.equal(result.id, 'n79721398', 'Wrong object ' + result.id + '?')
            },
            function(err) {
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
          assert.equal(expected.length, lastIndex + 1, 'Should return ' + expected.length + ' elements')

          done(err)
        })
    })

    it('option "sort": should return ordered by id (sortDir: "desc")', function(done) {
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
          assert.equal(expected.length, lastIndex + 1, 'Should return ' + expected.length + ' elements')

          done(err)
        })
    })

    it('option "sort"="BBoxDiagonalLength"', function(done) {
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
          assert.equal(expected.length, lastIndex + 1, 'Should return ' + expected.length + ' elements')

          done(err)
        })
    })

    it('option "sort"="BBoxDiagonalLength", sortDir "desc"', function(done) {
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

    it('relation', function(done) {
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
          assert.equal(expected.length, found.length, 'Wrong count of objects found!')

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
          assert.deepEqual(expected.sort(), found.sort(), 'Wrong count of objects found!')

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
          if(expected.indexOf(result.id) === -1 &&
             might.indexOf(result.id) === -1) {
            assert(false, 'Object ' + result.id + ' should not be found!')
          }

          if (expected.indexOf(result.id) !== -1) {
            found.push(result.id)
          }
        },
        function(err) {
          assert.equal(expected.length, found.length, 'Wrong count of objects found!')

          done()
        }
      )
    })

    it('should return a list of way features (2nd try, partly cached)', function(done) {
      var found = []
      var expected = [ 'w299709373' ]
      var might = [ 'w299709375' ] // correct, if only bbox check is used

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
          if(expected.indexOf(result.id) === -1 &&
             might.indexOf(result.id) === -1) {
            assert(false, 'Object ' + result.id + ' should not be found!')
          }

          if (expected.indexOf(result.id) !== -1) {
            found.push(result.id)
          }
        },
        function(err) {
          assert.equal(expected.length, found.length, 'Wrong count of objects found!')

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

    it('should return a list of way features, ordered by BBoxDiagonalLength', function(done) {
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
            assert(false, 'Object ' + result.id + ' should not be found!')
        },
        function(err) {
          if (found.length != expected.length)
            assert(false, 'Wrong count of objects found!')

          done()
        }
      )
    })

    it('should return a list of node features (request splitted)', function(done) {
      var found = []
      var expected = [ 'n1853730762', 'n1853730763', 'n1853730777', 'n1853730779', 'n1853730785', 'n1853730792', 'n1853730797', 'n1853730821' ]

      overpassFrontend.BBoxQuery(
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
            assert(false, 'Object ' + result.id + ' should not be found!')
        },
        function(err) {
          assert.deepEqual(expected.sort(), found.sort(), 'Wrong count of objects found!')

          done()
        }
      )
    })

    it('should handle simultaneous requests gracefully (overlapping area; partyly known; requests splitted)', function(done) {
      var found1 = []
      var found2 = []
      var expected1 = [ 'n1853730762', 'n1853730763', 'n1853730777', 'n1853730779', 'n1853730785', 'n1853730792', 'n1853730797', 'n1853730821', 'n1853730767', 'n1853730778', 'n1853730787', 'n1853730801', 'n1853730774', 'n1853730788', 'n1853730816', 'n1853730828', 'n1853730831', 'n1853730842', 'n1853730843' ]
      var expected2 = [ 'n1853730762', 'n1853730763', 'n1853730777', 'n1853730779', 'n1853730785', 'n1853730792', 'n1853730797', 'n1853730821', 'n1853730767', 'n1853730778', 'n1853730787', 'n1853730801', 'n1853730774', 'n1853730788', 'n1853730816', 'n1853730828', 'n1853730831', 'n1853730842', 'n1853730843', 'n1853730825' ]

      async.parallel([
        function (callback) {
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
              console.log('got1', result.id)
              found1.push(result.id)

              if(expected1.indexOf(result.id) == -1)
                assert(false, '(1) Object ' + result.id + ' should not be found!')
            },
            function(err) {
              assert.deepEqual(expected1.sort(), found1.sort(), '(1) Wrong count of objects found!')

              callback()
            }
          )
        },
        function (callback) {
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
              console.log('got2', result.id)
              found2.push(result.id)

              if(expected2.indexOf(result.id) == -1)
                assert(false, '(2) Object ' + result.id + ' should not be found!')
            },
            function(err) {
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

describe('Overpass query by id with bbox option', function() {
  it('First call', function(done) {
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
              assert(false, 'Index ' + index + ' should return a valid result (' + query[index] + ')')

          if (result === null && index_non_existant.indexOf(index) === -1) {
            assert(false, 'Index ' + index + ' should not return a non-existant object (' + query[index] + ')')
          }

          if (result !== false && result !== null && expected.indexOf(result.id) == -1) {
            assert(false, 'Returning object ' + result.id + ' which should not be returned')
          }
        },
        function(err) {
          done()
        }
    )
  })

  it('Second call', function(done) {
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
              assert(false, 'Index ' + index + ' should return a valid result (' + query[index] + ')')

          if (result === null && index_non_existant.indexOf(index) === -1) {
            assert(false, 'Index ' + index + ' should not return a non-existant object (' + query[index] + ')')
          }

          if (result !== false && result !== null && expected.indexOf(result.id) == -1) {
            assert(false, 'Returning object ' + result.id + ' which should not be returned')
          }
        },
        function(err) {
          done()
        }
    )
  })

  it('Check data of outside objects', function(done) {
    var query = [ 'n2832485845', 'n3037882439' ]

    overpassFrontend.get(query.concat([]), { properties: OverpassFrontend.ID_ONLY },
        function(err, result, index) {
          assert.equal(OverpassFrontend.BBOX | OverpassFrontend.CENTER, result.properties, 'Element ' + result.id + ' which was loaded outside bbox, should only have BBOX data')
        },
        function(err) {
          done()
        }
    )

  })

    it('should handle several simultaneous requests', function(done) {
      var items1 = [ 'n3037893167', 'n3037893166' ]
      var items2 = [ 'n3037893165' ]
      var items3 = [ 'n1853730723' ]

      overpassFrontend.removeFromCache(items1)
      overpassFrontend.removeFromCache(items2)
      overpassFrontend.removeFromCache(items3)

      async.parallel([
        function(callback) {
          var done = []

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
              assert.equal(done.length, items1.length, '2nd request should return ' + items1.length + ' items')
              callback(err)
            }
          )
        },
        function(callback) {
          var done = []

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
              assert.equal(done.length, items2.length, '2nd request should return ' + items2.length + ' items')
              callback(err)
            }
          )
        },
        function(callback) {
          var done = []

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
              assert.equal(done.length, items1.length, '2nd request should return ' + items1.length + ' items')
              callback(err)
            }
          )
        },
        function(callback) {
          var done = []

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
              assert.equal(done.length, items2.length, '2nd request should return ' + items2.length + ' items')
              callback(err)
            }
          )
        },
        function(callback) {
          var done = []

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
    overpassFrontend.clearBBoxQuery("node")

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

  it('Simple queries - all nodes (cached)', function (done) {
    overpassFrontend.clearBBoxQuery("node")

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
    overpassFrontend.clearBBoxQuery("(node[amenity=restaurant];way[amenity=restaurant];relation[amenity=restaurant];)")

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

  it('Simple queries - all restaurants (cached)', function (done) {
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
          assert.deepEqual([], result.member_ids())
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
      overpassFrontend.removeFromCache('r1980077')
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
	    [
	      {
		"lat": 48.1982148,
		"lon": 16.3382648
	      },
	      [
		{
		  "lat": 48.1983967,
		  "lon": 16.3390104
		},
		{
		  "lat": 48.1983357,
		  "lon": 16.3387535
		},
		{
		  "lat": 48.1983024,
		  "lon": 16.3386136
		},
		{
		  "lat": 48.1982664,
		  "lon": 16.3384619
		},
		{
		  "lat": 48.198255,
		  "lon": 16.3384203
		},
		{
		  "lat": 48.1982449,
		  "lon": 16.3383811
		},
		{
		  "lat": 48.1982148,
		  "lon": 16.3382648
		}
	      ],
	      [
		{
		  "lat": 48.1987724,
		  "lon": 16.3380726
		},
		{
		  "lat": 48.1983261,
		  "lon": 16.3382355
		},
		{
		  "lat": 48.1982148,
		  "lon": 16.3382648
		}
	      ]
	    ]
	  )
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

    it('Server not available - get request', function (done) {
      var of = new OverpassFrontend('http://domaindoesnotexist.foo')
      of.get([ 'r910885' ],
        {
          properties: OverpassFrontend.ID_ONLY
        },
        function(err, result, index) {
          assert(false, 'feature_callback should not be called')
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
          assert(false, 'feature_callback should not be called')
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
      var of = new OverpassFrontend('foo://bar')
      of.get(['r910885'],
        {
          properties: OverpassFrontend.ID_ONLY
        },
        function(err, result, index) {
          assert(false, 'feature_callback should not be called')
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
          assert(false, 'Should not call feature_callback, as request gets aborted.')
        },
        function(err) {
          assert.equal('abort', err)
          done()
        }
      )

      req.abort()
    })

    it('request list should be empty', function () {
      removeNullEntries(overpassFrontend.overpassRequests)

      assert.deepEqual(overpassFrontend.overpassRequests, [], 'request list should be empty')
      return true
    })
  })
})
