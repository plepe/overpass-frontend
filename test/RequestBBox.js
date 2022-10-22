var fs = require('fs')
var conf = JSON.parse(fs.readFileSync('test/conf.json', 'utf8'));

if (!conf.generator) {
  console.error('Set correct "generator" string in test/conf.json!')
  process.exit(0)
}

var assert = require('assert')
var async = require('async')

var OverpassFrontend = require('../src/OverpassFrontend')
var overpassFrontend = new OverpassFrontend(conf.url)

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

  it('Simple queries - all restaurants with additional filter (cuisine=chinese) (fully cached)', function (done) {
    var expected = [ 'n441576820', 'n442066582', 'n2083468740' ]
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
            'op': '=',
            'value': 'chinese',
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
  describe('bbox query - key regexp', function() {
    it('key regexp matches (not cached)', function(done) {
      overpassFrontend.clearCache()
      var finalCalled = 0
      var found = []
      var expected = [ 'n3037893162', 'n3037893163', 'n3037893164' ]
      var expectedSubRequestCount = 1
      var foundSubRequestCount = 0

      function compileListener (subrequest) {
        foundSubRequestCount++
      }

      var request = overpassFrontend.BBoxQuery(
        '(nwr[~"amenity"~"."];);',
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
    it('key regexp matches (fully cached)', function(done) {
      var finalCalled = 0
      var found = []
      var expected = [ 'n3037893162', 'n3037893163', 'n3037893164' ]
      var expectedSubRequestCount = 0
      var foundSubRequestCount = 0

      function compileListener (subrequest) {
        foundSubRequestCount++
      }

      var request = overpassFrontend.BBoxQuery(
        '(nwr[~"amenity"~"."];);',
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
    it('key regexp matches (fully cached, different bbox)', function(done) {
      var finalCalled = 0
      var found = []
      var expected = [ 'n3037893162', 'n3037893163', 'n3037893164' ]
      var expectedSubRequestCount = 0
      var foundSubRequestCount = 0

      function compileListener (subrequest) {
        foundSubRequestCount++
      }

      var request = overpassFrontend.BBoxQuery(
        '(nwr[~"amenity"~"."];);',
        {
          minlon: 16.3384716,
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
  })
})

describe('BBoxQuery - Consecutive queries with different properties', function () {
  it('clear cache', function () {
    overpassFrontend.clearCache()
  })

  it('first query', function (done) {
    var expected = ['n441576820', 'n442066582', 'n442972880', 'n1467109667', 'n355123976', 'n1955278832', 'n441576823', 'n2083468740', 'n2099023017', 'w369989037', 'w370577069']
    var found = []
    var error = ''

    var expectedSubRequestCount = 1
    var foundSubRequestCount = 0

    function compileListener (subRequest) {
      foundSubRequestCount++
    }

    var request = overpassFrontend.BBoxQuery(
      "nwr[amenity=restaurant]",
      {
        "maxlat": 48.200,
        "maxlon": 16.345,
        "minlat": 48.195,
        "minlon": 16.335
      },
      {
        properties: 0
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

  it('second query (fully cached)', function (done) {
    var expected = ['n441576820', 'n442066582', 'n442972880', 'n1467109667', 'n355123976', 'n1955278832', 'n441576823', 'n2083468740', 'n2099023017', 'w369989037', 'w370577069']
    var found = []
    var error = ''

    var expectedSubRequestCount = 0
    var foundSubRequestCount = 0

    function compileListener (subRequest) {
      foundSubRequestCount++
    }

    var request = overpassFrontend.BBoxQuery(
      "nwr[amenity=restaurant]",
      {
        "maxlat": 48.200,
        "maxlon": 16.345,
        "minlat": 48.195,
        "minlon": 16.335
      },
      {
        properties: 0
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
