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
          expectedSubRequestCount: 1,
          expectedCacheInfo: [{
            type: 'node',
            filters: '',
            ids: [378440]
          }]
        }, done)
      })

      it('numeric (fully cached)', function (done) {
        test({
          mode,
          query: 'node(378440)',
          expected: [ 'n378440' ],
          expectedSubRequestCount: 0,
          expectedCacheInfo: [{
            type: 'node',
            filters: '',
            ids: [378440]
          }]
        }, done)
      })

      it('id: (single)', function (done) {
        test({
          mode,
          query: 'node(id:378440)',
          expected: [ 'n378440' ],
          expectedSubRequestCount: 1, // TODO: 0
          expectedCacheInfo: [{
            type: 'node',
            filters: '',
            ids: [378440]
          }]
        }, done)
      })

      it('id: (multiple)', function (done) {
        test({
          mode,
          query: 'node(id:378440,647991,393161,1234)',
          expected: [ 'n378440', 'n647991', 'n393161' ],
          expectedSubRequestCount: 1,
          expectedCacheInfo: [{
            type: 'node',
            filters: '',
            ids: [1234, 378440, 393161, 647991]
          }]
        }, done)
      })

      it('id: (known from other query)', function (done) {
        test({
          mode,
          query: 'node(id:647991)',
          expected: [ 'n647991' ],
          expectedSubRequestCount: 1, // TODO: 0
          expectedCacheInfo: [{
            type: 'node',
            filters: '',
            ids: [647991]
          }]
        }, done)
      })

      it('id: (non-existant, known from other query)', function (done) {
        test({
          mode,
          query: 'node(id:1234)',
          expected: [],
          expectedSubRequestCount: 1, // TODO: 0
          expectedCacheInfo: [{
            type: 'node',
            filters: '',
            ids: [1234]
          }]
        }, done)
      })
    })

    describe('Filter "around"', function () {
      it('simple', function (done) {
        test({
          mode,
          query: 'node(around:20,48.19058,16.33721)',
          expected: [ 'n395262', 'n643386609', 'n1599448219', 'n1871276160', 'n3765072046' ],
          expectedSubRequestCount: 1,
          expectedCacheInfo: [{
            "type": "node",
            "filters": "",
            "bounds": {
              "type": "Polygon",
              "coordinates": [
                [
                  [ 16.337479800820528, 48.190579999684346 ], [ 16.33747461685461, 48.190615089436236 ],
                  [ 16.337459263790745, 48.19064883073129 ], [ 16.337434331621086, 48.190679926906576 ],
                  [ 16.33740077846325, 48.190707182947705 ], [ 16.337359893742175, 48.1907295514134 ],
                  [ 16.33731324863886, 48.19074617268921 ], [ 16.337262635710154, 48.190756408023006 ],
                  [ 16.33721, 48.19075986407274 ], [ 16.337157364289848, 48.190756408023006 ],
                  [ 16.33710675136114, 48.19074617268921 ], [ 16.337060106257827, 48.1907295514134 ],
                  [ 16.33701922153675, 48.190707182947705 ], [ 16.336985668378915, 48.190679926906576 ],
                  [ 16.336960736209257, 48.19064883073129 ], [ 16.33694538314539, 48.190615089436236 ],
                  [ 16.33694019917947, 48.190579999684346 ], [ 16.33694538350778, 48.19054490995649 ],
                  [ 16.33696073687886, 48.190511168729856 ], [ 16.336985669253796, 48.19048007265697 ],
                  [ 16.337019222483715, 48.19045281673664 ], [ 16.337060107132707, 48.19043044839173 ],
                  [ 16.337106752030746, 48.19041382721832 ], [ 16.337157364652235, 48.190403591952965 ],
                  [ 16.33721, 48.190400135927256 ], [ 16.337262635347763, 48.190403591952965 ],
                  [ 16.337313247969256, 48.19041382721832 ], [ 16.33735989286729, 48.19043044839173 ],
                  [ 16.337400777516287, 48.19045281673664 ], [ 16.337434330746206, 48.19048007265697 ],
                  [ 16.33745926312114, 48.190511168729856 ], [ 16.337474616492223, 48.19054490995649 ],
                  [ 16.337479800820528, 48.190579999684346 ]
                ]
              ]
            }
          }]
        }, done)
      })

      it('simple (fully cached)', function (done) {
        test({
          mode,
          query: 'node(around:20,48.19058,16.33721)',
          expected: [ 'n395262', 'n643386609', 'n1599448219', 'n1871276160', 'n3765072046' ],
          expectedSubRequestCount: 0,
          expectedCacheInfo: [{
            "type": "node",
            "filters": "",
            "bounds": {
              "type": "Polygon",
              "coordinates": [
                [
                  [ 16.337479800820528, 48.190579999684346 ], [ 16.33747461685461, 48.190615089436236 ],
                  [ 16.337459263790745, 48.19064883073129 ], [ 16.337434331621086, 48.190679926906576 ],
                  [ 16.33740077846325, 48.190707182947705 ], [ 16.337359893742175, 48.1907295514134 ],
                  [ 16.33731324863886, 48.19074617268921 ], [ 16.337262635710154, 48.190756408023006 ],
                  [ 16.33721, 48.19075986407274 ], [ 16.337157364289848, 48.190756408023006 ],
                  [ 16.33710675136114, 48.19074617268921 ], [ 16.337060106257827, 48.1907295514134 ],
                  [ 16.33701922153675, 48.190707182947705 ], [ 16.336985668378915, 48.190679926906576 ],
                  [ 16.336960736209257, 48.19064883073129 ], [ 16.33694538314539, 48.190615089436236 ],
                  [ 16.33694019917947, 48.190579999684346 ], [ 16.33694538350778, 48.19054490995649 ],
                  [ 16.33696073687886, 48.190511168729856 ], [ 16.336985669253796, 48.19048007265697 ],
                  [ 16.337019222483715, 48.19045281673664 ], [ 16.337060107132707, 48.19043044839173 ],
                  [ 16.337106752030746, 48.19041382721832 ], [ 16.337157364652235, 48.190403591952965 ],
                  [ 16.33721, 48.190400135927256 ], [ 16.337262635347763, 48.190403591952965 ],
                  [ 16.337313247969256, 48.19041382721832 ], [ 16.33735989286729, 48.19043044839173 ],
                  [ 16.337400777516287, 48.19045281673664 ], [ 16.337434330746206, 48.19048007265697 ],
                  [ 16.33745926312114, 48.190511168729856 ], [ 16.337474616492223, 48.19054490995649 ],
                  [ 16.337479800820528, 48.190579999684346 ]
                ]
              ]
            }
          }]
        }, done)
      })

      it('simple (smaller area, should be cached)', function (done) {
        test({
          mode,
          query: 'node(around:10,48.19058,16.33721)',
          expected: [ 'n395262' ],
          expectedSubRequestCount: 1, // TODO: 0
          expectedCacheInfo: [{
            "type": "node",
            "filters": "",
            "bounds": {
              "type": "Polygon",
              "coordinates": [
                [
                  [ 16.337344900410265, 48.190579999921084 ], [ 16.337342308382006, 48.190597544794024 ],
                  [ 16.33733463181167, 48.190614415433 ], [ 16.337322165701185, 48.19062996350784 ],
                  [ 16.337305389113254, 48.1906435915133 ], [ 16.337284946761727, 48.19065477573105 ],
                  [ 16.33726162423573, 48.19066308635615 ], [ 16.33723631780978, 48.19066820401451 ],
                  [ 16.33721, 48.19066993203637 ], [ 16.337183682190222, 48.19066820401451 ],
                  [ 16.33715837576427, 48.19066308635615 ], [ 16.337135053238274, 48.19065477573105 ],
                  [ 16.337114610886744, 48.1906435915133 ], [ 16.337097834298817, 48.19062996350784 ],
                  [ 16.337085368188326, 48.190614415433 ], [ 16.337077691617996, 48.190597544794024 ],
                  [ 16.337075099589736, 48.190579999921084 ], [ 16.33707769170859, 48.190562455054156 ],
                  [ 16.33708536835573, 48.19054558443227 ], [ 16.337097834517536, 48.19053003638303 ],
                  [ 16.337114611123486, 48.19051640840777 ], [ 16.337135053456993, 48.19050522422022 ],
                  [ 16.337158375931672, 48.19049691362071 ], [ 16.33718368228082, 48.19049179597949 ],
                  [ 16.33721, 48.19049006796363 ], [ 16.337236317719178, 48.19049179597949 ],
                  [ 16.337261624068326, 48.19049691362071 ], [ 16.337284946543004, 48.19050522422022 ],
                  [ 16.337305388876512, 48.19051640840777 ], [ 16.337322165482465, 48.19053003638303 ],
                  [ 16.33733463164427, 48.19054558443227 ], [ 16.33734230829141, 48.190562455054156 ],
                  [ 16.337344900410265, 48.190579999921084 ]
                ]
              ]
            }
          }]
        }, done)
      })

      it('combining two', function (done) {
        test({
          mode,
          query: 'node(around:20,48.19058,16.33761)(around:20,48.19058,16.33721)',
          expected: [ 'n1599448219', 'n1871276160', 'n643386609' ],
          expectedSubRequestCount: 1,
          expectedCacheInfo: [{
            "type": "node",
            "filters": "",
            "bounds": {
              "type": "Polygon",
              "coordinates": [
                [
                  [ 16.337340199179472, 48.190579999684346 ], [ 16.337345383507778, 48.19054490995649 ],
                  [ 16.33736073687886, 48.190511168729856 ], [ 16.3373856692538, 48.19048007265697 ],
                  [ 16.337410000000002, 48.190460308333776 ], [ 16.337434330746206, 48.19048007265697 ],
                  [ 16.33745926312114, 48.190511168729856 ], [ 16.337474616492223, 48.19054490995649 ],
                  [ 16.337479800820528, 48.190579999684346 ], [ 16.33747461685461, 48.190615089436236 ],
                  [ 16.337459263790745, 48.19064883073129 ], [ 16.337434331621086, 48.190679926906576 ],
                  [ 16.337410000000002, 48.19069969207051 ], [ 16.337385668378914, 48.190679926906576 ],
                  [ 16.337360736209256, 48.19064883073129 ], [ 16.33734538314539, 48.190615089436236 ],
                  [ 16.337340199179472, 48.190579999684346 ]
                ]
              ]
            }
          }]
        }, done)
      })
    })

    describe('Filter "bbox"', function () {
      it('simple', function (done) {
        test({
          mode,
          query: 'node(48.1904,16.3370,48.1907,16.3374)',
          expected: [ 'n1599448219', 'n1871276160', 'n3765072046', 'n395262', 'n643386609' ],
          expectedSubRequestCount: 1,
          expectedCacheInfo: [{
            "type": "node",
            "filters": "",
            "bounds": {
              "type": "Polygon",
              "coordinates": [
                [
                  [ 16.337, 48.1904 ], [ 16.3374, 48.1904 ],
                  [ 16.3374, 48.1907 ], [ 16.337, 48.1907 ],
                  [ 16.337, 48.1904 ]
                ]
              ]
            }
          }]
        }, done)
      })

      it('simple (fully cached)', function (done) {
        test({
          mode,
          query: 'node(48.1904,16.3370,48.1907,16.3374)',
          expected: [ 'n1599448219', 'n1871276160', 'n3765072046', 'n395262', 'n643386609' ],
          expectedSubRequestCount: 0,
          expectedCacheInfo: [{
            "type": "node",
            "filters": "",
            "bounds": {
              "type": "Polygon",
              "coordinates": [
                [
                  [ 16.337, 48.1904 ], [ 16.3374, 48.1904 ],
                  [ 16.3374, 48.1907 ], [ 16.337, 48.1907 ],
                  [ 16.337, 48.1904 ]
                ]
              ]
            }
          }]
        }, done)
      })

      it('simple (fully included in cache)', function (done) {
        test({
          mode,
          query: 'node(48.19045,16.33705,48.19065,16.33735)',
          expected: [ 'n395262' ],
          expectedSubRequestCount: 1, // TODO: 0
          expectedCacheInfo: [{
            "type": "node",
            "filters": "",
            "bounds": {
              "type": "Polygon",
              "coordinates": [
                [
                  [ 16.33705, 48.19045 ], [ 16.33735, 48.19045 ],
                  [ 16.33735, 48.19065 ], [ 16.33705, 48.19065 ],
                  [ 16.33705, 48.19045 ]
                ]
              ]
            }
          }]
        }, done)
      })

      it('Mixed node/way', function (done) {
        test({
          mode,
          query: '(node(48.19045,16.33705,48.19065,16.33735);way(48.19045,16.33705,48.19065,16.33735);)',
          expected: [ 'n395262','w31275229' ],
          expectedViaFile: [ 'n395262', 'w31275229', 'w383507544' ],
          // Overpass Server won't include ways, where no nodes are inside the bounding box. Overpass-Frontend will include theses ways.
          expectedSubRequestCount: 1, // TODO: 0
          expectedCacheInfo: [
            {
              "type": "node",
              "filters": "",
              "bounds": {
                "type": "Polygon",
                "coordinates": [
                  [
                    [ 16.33705, 48.19045 ],
                    [ 16.33735, 48.19045 ],
                    [ 16.33735, 48.19065 ],
                    [ 16.33705, 48.19065 ],
                    [ 16.33705, 48.19045 ]
                  ]
                ]
              }
            },
            {
              "type": "way",
              "filters": "",
              "bounds": {
                "type": "Polygon",
                "coordinates": [
                  [
                    [ 16.33705, 48.19045 ],
                    [ 16.33735, 48.19045 ],
                    [ 16.33735, 48.19065 ],
                    [ 16.33705, 48.19065 ],
                    [ 16.33705, 48.19045 ]
                  ]
                ]
              }
            }
          ]
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

  const cacheInfo = request.filterQuery.caches()
  if (options.expectedCacheInfo) {
    assert.deepEqual(cacheInfo, options.expectedCacheInfo, 'Expected cache info')
  }
}
