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

      it('numeric (fully cached)', function (done) {
        test({
          mode,
          query: 'node(378440)',
          expected: [ 'n378440' ],
          expectedSubRequestCount: 0
        }, done)
      })

      it('id: (single)', function (done) {
        test({
          mode,
          query: 'node(id:378440)',
          expected: [ 'n378440' ],
          expectedSubRequestCount: 1 // TODO: 0
        }, done)
      })

      it('id: (multiple)', function (done) {
        test({
          mode,
          query: 'node(id:378440,647991,393161,1234)',
          expected: [ 'n378440', 'n647991', 'n393161' ],
          expectedSubRequestCount: 1
        }, done)
      })

      it('id: (known from other query)', function (done) {
        test({
          mode,
          query: 'node(id:647991)',
          expected: [ 'n647991' ],
          expectedSubRequestCount: 1 // TODO: 0
        }, done)
      })

      it('id: (non-existant, known from other query)', function (done) {
        test({
          mode,
          query: 'node(id:1234)',
          expected: [],
          expectedSubRequestCount: 1 // TODO: 0
        }, done)
      })
    })

    describe('Filter "around"', function () {
      it('simple', function (done) {
        test({
          mode,
          query: 'node(around:20,48.19058,16.33721)',
          expected: [ 'n395262', 'n643386609', 'n1599448219', 'n1871276160', 'n3765072046' ],
          expectedSubRequestCount: 1
        }, done)
      })

      it('simple (fully cached)', function (done) {
        test({
          mode,
          query: 'node(around:20,48.19058,16.33721)',
          expected: [ 'n395262', 'n643386609', 'n1599448219', 'n1871276160', 'n3765072046' ],
          expectedSubRequestCount: 0
        }, done)
      })

      it('simple (smaller area, should be cached)', function (done) {
        test({
          mode,
          query: 'node(around:10,48.19058,16.33721)',
          expected: [ 'n395262' ],
          expectedSubRequestCount: 1 // TODO: 0
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
