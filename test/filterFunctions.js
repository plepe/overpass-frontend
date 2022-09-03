var fs = require('fs')
var conf = JSON.parse(fs.readFileSync('test/conf.json', 'utf8'));

var assert = require('assert')
var async = require('async')

var OverpassFrontend = require('../src/OverpassFrontend')
var BoundingBox = require('boundingbox')
var overpassFrontend

;['via-server', 'via-file'].forEach(mode => {
  describe('Test filter functions ' + mode, function () {
    describe('initalize', function () {
      if (mode === 'via-server') {
        it('load', function () {
          overpassFrontend = new OverpassFrontend(conf.url)
        })
      } else {
        it('load', function (done) {
          this.timeout(20000)
          overpassFrontend = new OverpassFrontend('test/data.osm.bz2')
          overpassFrontend.once('load', () => done())
        })
      }
    })

    describe('Filter by id', function () {
      it('numeric', function (done) {
        test({
          mode,
          query: 'node(378440)',
          expected: [ 'n378440' ],
          expectedSubRequestCount: 1
        }, done)
      })
    })
  })
})

function test (options, callback) {
  const found = []
  let foundSubRequestCount = 0

  function compileListener (subrequest) {
    foundSubRequestCount++
  }

  const request = overpassFrontend.BBoxQuery(options.query, null, {},
    (err, ob) => {
      found.push(ob.id)

      if (!options.expected.includes(ob.id)) {
        assert.fail('Object ' + ob.id + ' should not be found!')
      }
    },
    (err) => {
      assert.equal(found.length, options.expected.length, 'Wrong count of objects found!')
      if (options.mode === 'via-server') {
        assert.equal(foundSubRequestCount, options.expectedSubRequestCount, 'Wrong count of sub requests!')
      }

      request.off('subrequest-compile', compileListener)
      callback(err)
    }
  )

  request.on('subrequest-compile', compileListener)
}
