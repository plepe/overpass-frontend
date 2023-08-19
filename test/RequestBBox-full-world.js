var fs = require('fs')
var conf = JSON.parse(fs.readFileSync('test/conf.json', 'utf8'));

if (!conf.generator) {
  console.error('Set correct "generator" string in test/conf.json!')
  process.exit(0)
}

var assert = require('assert')

var OverpassFrontend = require('../src/OverpassFrontend')
var overpassFrontend = new OverpassFrontend(conf.url)

describe('BBoxQuery with GeoJSON bounds', function () {
  it('init', function () {
    overpassFrontend.clearCache()
  })

  it('should return a list of node features', function(done) {
    var finalCalled = 0
    var found = []
    var expected = [ 'r1990599' ]

    var expectedSubRequestCount = 1
    var foundSubRequestCount = 0

    function compileListener (subrequest) {
      foundSubRequestCount++
    }

    overpassFrontend.once('start', (e, context) => {
      assert.equal(context.queryOptions, '[out:json]')
    })

    var request = overpassFrontend.BBoxQuery(
      'relation["ref:at:gkz"=91501];',
      null,
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
        assert.equal(found.length, expected.length, 'Wrong count of objects found!')
        assert.equal(foundSubRequestCount, expectedSubRequestCount, 'Wrong count of sub requests!')

        request.off('subrequest-compile', compileListener)
        done()
      }
    )

    request.on('subrequest-compile', compileListener)
  })

  it('should return a list of node features (fully cached)', function(done) {
    var finalCalled = 0
    var found = []
    var expected = [ 'r1990599' ]

    var expectedSubRequestCount = 0
    var foundSubRequestCount = 0

    function compileListener (subrequest) {
      foundSubRequestCount++
    }

    var request = overpassFrontend.BBoxQuery(
      'relation["ref:at:gkz"=91501];',
      null,
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
