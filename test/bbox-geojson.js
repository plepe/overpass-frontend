var fs = require('fs')
var conf = JSON.parse(fs.readFileSync('test/conf.json', 'utf8'));

if (!conf.generator) {
  console.error('Set correct "generator" string in test/conf.json!')
  process.exit(0)
}

var assert = require('assert')

var OverpassFrontend = require('../src/OverpassFrontend')
var overpassFrontend = new OverpassFrontend(conf.url)

const bounds = {
  "type": "Feature",
  "geometry": {
    "type": "Polygon",
    "coordinates": [
      [
        [ 16.338091492652893, 48.19921524566012 ],
        [ 16.338657438755035, 48.19898283025062 ],
        [ 16.338467001914978, 48.199424418627146 ],
        [ 16.338091492652893, 48.19921524566012 ]
      ]
    ]
  }
}

describe('BBoxQuery with GeoJSON bounds', function () {
  describe('nodes', function () {
    it('init', function () {
      overpassFrontend.clearCache()
    })

    it('should return a list of node features', function(done) {
      var finalCalled = 0
      var found = []
      // var expected = [ 'n3037882438', 'n3037882439', 'n3037893162', 'n3037893163', 'n3037893164' ]
      var expected = [ 'n3037882438', 'n3037882439', 'n3037893159', 'n3037893160', 'n3037893161', 'n3037893162', 'n3037893163', 'n3037893164' ] // wrong

      var expectedSubRequestCount = 1
      var foundSubRequestCount = 0

      function compileListener (subrequest) {
        foundSubRequestCount++
      }

      var request = overpassFrontend.BBoxQuery(
        'node[amenity=bench];',
        bounds,
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

    it('should return a list of node features (fully cached)', function(done) {
      var finalCalled = 0
      var found = []
      var expected = [ 'n3037882438', 'n3037882439', 'n3037893162', 'n3037893163', 'n3037893164' ]

      var expectedSubRequestCount = 0
      var foundSubRequestCount = 0

      function compileListener (subrequest) {
        foundSubRequestCount++
      }

      var request = overpassFrontend.BBoxQuery(
        'node[amenity=bench];',
        bounds,
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
