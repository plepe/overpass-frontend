var fs = require('fs')
var conf = JSON.parse(fs.readFileSync('test/conf.json', 'utf8'));

if (!conf.generator) {
  console.error('Set correct "generator" string in test/conf.json!')
  process.exit(0)
}

var assert = require('assert')
var async = require('async')

var OverpassFrontend = require('../src/OverpassFrontend')
var BoundingBox = require('boundingbox')
var overpassFrontend = new OverpassFrontend(conf.url)

describe('Lon180 (query objects near lon180)', function() {
  it('Check that cache is cleared', function (done) {
    overpassFrontend.clearCache()
    assert.equal(overpassFrontend.hasStretchLon180, false)

    done()
  })

  it('All lakes (not cached)', function (done) {
    var finalCalled = 0
    var expected = [ 'w660439767', 'r3237099', 'w62065034', 'w62065032' ]
    var found = []
    var error = ''

    var expectedSubRequestCount = 2
    var foundSubRequestCount = 0

    function compileListener (subrequest) {
      foundSubRequestCount++
    }

    let request = overpassFrontend.BBoxQuery(
      "nwr[natural=water]",
      {
	"minlat": 65,
	"maxlat": 66,
	"minlon": 179,
	"maxlon": -179
      },
      {
          properties: OverpassFrontend.MEMBERS | OverpassFrontend.GEOM | OverpassFrontend.TAGS
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

        assert.equal(overpassFrontend.hasStretchLon180, true)

        assert.equal(foundSubRequestCount, expectedSubRequestCount, 'Wrong count of sub requests!')

        request.off('subrequest-compile', compileListener)

        done()
      }
    )

    request.on('subrequest-compile', compileListener)
  })

  it('All lakes (fully cached)', function (done) {
    var finalCalled = 0
    var expected = [ 'w660439767', 'r3237099', 'w62065034', 'w62065032' ]
    var found = []
    var error = ''

    var expectedSubRequestCount = 0
    var foundSubRequestCount = 0

    function compileListener (subrequest) {
      foundSubRequestCount++
    }

    let request = overpassFrontend.BBoxQuery(
      "nwr[natural=water]",
      {
	"minlat": 65,
	"maxlat": 66,
	"minlon": 179,
	"maxlon": -179
      },
      {
          properties: OverpassFrontend.MEMBERS | OverpassFrontend.GEOM | OverpassFrontend.TAGS
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

        assert.equal(overpassFrontend.hasStretchLon180, true)

        assert.equal(foundSubRequestCount, expectedSubRequestCount, 'Wrong count of sub requests!')

        request.off('subrequest-compile', compileListener)

        done()
      }
    )

    request.on('subrequest-compile', compileListener)
  })
})
