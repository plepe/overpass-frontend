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
          query: 'node[name~"foo"](around:20,48.19058,16.33721)',
          expected: [ 'n395262', 'n643386609', 'n1599448219', 'n1871276160', 'n3765072046' ],
          expectedSubRequestCount: 1
        }, done)
      })

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

      it('combining two', function (done) {
        test({
          mode,
          query: 'node(around:20,48.19058,16.33761)(around:20,48.19058,16.33721)',
          expected: [ 'n1599448219', 'n1871276160', 'n643386609' ],
          expectedSubRequestCount: 1
        }, done)
      })
    })

    describe('Filter "bbox"', function () {
      it('simple', function (done) {
        test({
          mode,
          query: 'node(48.1904,16.3370,48.1907,16.3374)',
          expected: [ 'n1599448219', 'n1871276160', 'n3765072046', 'n395262', 'n643386609' ],
          expectedSubRequestCount: 1
        }, done)
      })

      it('simple (fully cached)', function (done) {
        test({
          mode,
          query: 'node(48.1904,16.3370,48.1907,16.3374)',
          expected: [ 'n1599448219', 'n1871276160', 'n3765072046', 'n395262', 'n643386609' ],
          expectedSubRequestCount: 0
        }, done)
      })

      it('simple (fully included in cache)', function (done) {
        test({
          mode,
          query: 'node(48.19045,16.33705,48.19065,16.33735)',
          expected: [ 'n395262' ],
          expectedSubRequestCount: 1 // TODO: 0
        }, done)
      })

      it('Mixed node/way', function (done) {
        test({
          mode,
          query: '(node(48.19045,16.33705,48.19065,16.33735);way(48.19045,16.33705,48.19065,16.33735);)',
          expected: [ 'n395262','w31275229' ],
          expectedViaFile: [ 'n395262', 'w31275229', 'w383507544' ],
          // Overpass Server won't include ways, where no nodes are inside the bounding box. Overpass-Frontend will include theses ways.
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
    },
    (err) => {
      const expected = (options.mode === 'via-server' ? options.expectedViaServer : options.expectedViaFile) || options.expected
      assert.deepEqual(found.sort(), expected.sort(), 'List of found objects wrong!')
      if (options.mode === 'via-server') {
        assert.equal(foundSubRequestCount, options.expectedSubRequestCount, 'Wrong count of sub requests!')
      }

      request.off('subrequest-compile', compileListener)
      callback(err)
    }
  )

  request.on('subrequest-compile', compileListener)
  console.log(JSON.stringify(request.filterQuery, null, '  '))
  console.log(JSON.stringify(request.filterQuery.caches()))
}
