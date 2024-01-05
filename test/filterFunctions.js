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
          expectedQuery: 'node(id:378440);',
          expected: [ 'n378440' ],
          expectedSubRequestCount: 1,
          expectedCacheDescriptors: [{
            id: 'node(properties:0)',
            ids: [378440]
          }]
        }, done)
      })

      it('numeric (fully cached)', function (done) {
        test({
          mode,
          query: 'node(378440)',
          expectedQuery: 'node(id:378440);',
          expected: [ 'n378440' ],
          expectedSubRequestCount: 0,
          expectedCacheDescriptors: [{
            id: 'node(properties:0)',
            ids: [378440]
          }]
        }, done)
      })

      it('id: (single)', function (done) {
        test({
          mode,
          query: 'node(id:378440)',
          expected: [ 'n378440' ],
          expectedSubRequestCount: 0,
          expectedCacheDescriptors: [{
            id: 'node(properties:0)',
            ids: [378440]
          }]
        }, done)
      })

      it('id: (multiple)', function (done) {
        test({
          mode,
          query: 'node(id:378440,647991,393161,1234)',
          expectedQuery: 'node(id:1234,378440,393161,647991);',
          expected: [ 'n378440', 'n647991', 'n393161' ],
          expectedSubRequestCount: 1,
          expectedCacheDescriptors: [{
            id: 'node(properties:0)',
            ids: [1234, 378440, 393161, 647991],
          }]
        }, done)
      })

      it('id: (known from other query)', function (done) {
        test({
          mode,
          query: 'node(id:647991)',
          expected: [ 'n647991' ],
          expectedSubRequestCount: 0,
          expectedCacheDescriptors: [{
            id: 'node(properties:0)',
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
          expectedCacheDescriptors: [{
            id: 'node(properties:0)',
            ids: [1234]
          }]
        }, done)
      })
    })

    describe('Filter "uid"', function () {
      it('numeric', function (done) {
        test({
          mode,
          query: 'node(uid:908743)',
          expected: [
            'n1404275187', 'n2776031336',
            'n2776031337', 'n2776073558',
            'n33240913',   'n33240927',
            'n377992',     'n451666726',
            'n451666728',  'n451666730'
          ],
          expectedSubRequestCount: 1,
          expectedCacheDescriptors: [{
            id: 'node(uid:908743)(properties:2)',
          }]
        }, done)
      })

      it('illegal value', function (done) {
        test({
          mode,
          query: 'node(uid:test)',
          expectException: "Error parsing uid filter, expect a numeric value: \"test\"",
        }, done)
      })
    })

    describe('Filter "user"', function () {
      it('single without quotes', function (done) {
        test({
          mode,
          query: 'node(user: rayquaza )',
          expectedQuery: 'node(user:"rayquaza");',
          expected: [ 'n60093107' ],
          expectedProperties: 2,
          expectedSubRequestCount: 1,
          expectedCacheDescriptors: [{
            id: 'node(user:"rayquaza")(properties:2)'
          }]
        }, done)
      })

      it('multiple without quotes', function (done) {
        test({
          mode,
          query: 'node(user: rayquaza ,foobar,  test)',
          expectedQuery: 'node(user:"rayquaza","foobar","test");',
          expected: [ 'n60093107' ],
          expectedSubRequestCount: 1,
          expectedCacheDescriptors: [{
            id: 'node(user:"rayquaza","foobar","test")(properties:2)',
          }]
        }, done)
      })

      it('single with quotes', function (done) {
        test({
          mode,
          query: 'node(user: "caigner" )',
          expectedQuery: 'node(user:"caigner");',
          expected: [ "n1497172555", "n1688783954", "n1757141639", "n1757141640",
            "n2368032899", "n248526742", "n277838208", "n3189862142",
            "n3189862152", "n3189876469", "n448895067", "n475245484",
            "n68228729" ],
          expectedSubRequestCount: 1,
          expectedCacheDescriptors: [{
            id: 'node(user:"caigner")(properties:2)'
          }]
        }, done)
      })

      it('multiple with quotes', function (done) {
        test({
          mode,
          query: 'node(user: "caigner" ,"foobar",  \'test\')',
          expectedQuery: 'node(user:"caigner","foobar","test");',
          expected: [ "n1497172555", "n1688783954", "n1757141639", "n1757141640",
            "n2368032899", "n248526742", "n277838208", "n3189862142",
            "n3189862152", "n3189876469", "n448895067", "n475245484",
            "n68228729" ],
          expectedSubRequestCount: 1,
          expectedCacheDescriptors: [{
            id: 'node(user:"caigner","foobar","test")(properties:2)'
          }]
        }, done)
      })

      it('illegal value', function (done) {
        test({
          mode,
          query: 'node(user:te st)',
          expectException: "Can't parse user query: st",
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
          expectedCacheDescriptors: [{
            "id": "node(properties:16)",
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

      it('simple - ways', function (done) {
        test({
          mode,
          query: 'way(around:20,48.19058,16.33721)',
          expected: [ 'w146678755', 'w31275229', 'w383507544' ],
          expectedSubRequestCount: 1,
          expectedCacheDescriptors: [{
            "id": "way(properties:16)",
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
          expectedCacheDescriptors: [{
            "id": "node(properties:16)",
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
          expectedSubRequestCount: 0,
          expectedCacheDescriptors: [{
            "id": "node(properties:16)",
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
          expectedSubRequestCount: 0,
          expectedCacheDescriptors: [{
            "id": "node(properties:16)",
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

      it('linestring', function (done) {
        return done()
        test({
          mode,
          query: 'node(around:20,48.19058,16.33761,48.19058,16.33721)',
          expected: [ 'n1599448219', 'n1871276160', 'n643386609' ],
          expectedSubRequestCount: 0,
          expectedCacheDescriptors: [{
            "id": "node(properties:16)",
            "bounds": {
              "type": "Polygon",
              "coordinates": [[
                [ 16.33720999929802, 48.19075986407274 ],
                [ 16.33715736360136, 48.19075640793171 ],
                [ 16.3371067507126, 48.19074617251013 ],
                [ 16.337060105674155, 48.1907295511534 ],
                [ 16.337019221040382, 48.19070718261679 ],
                [ 16.33698566798892, 48.190679926517475 ],
                [ 16.336960735940625, 48.19064883029893 ],
                [ 16.336945383008445, 48.19061508897725 ],
                [ 16.336940199179473, 48.190579999216375 ],
                [ 16.33694538364473, 48.19054490949752 ],
                [ 16.336960737147496, 48.190511168297505 ],
                [ 16.33698566964379, 48.19048007226786 ],
                [ 16.337019222980082, 48.190452816405724 ],
                [ 16.33706010771638, 48.19043044813175 ],
                [ 16.337106752679283, 48.190413827039244 ],
                [ 16.33715736534072, 48.19040359186167 ],
                [ 16.33721000070197, 48.190400135927256 ],
                [ 16.33760999929803, 48.190400135927256 ],
                [ 16.33766263465928, 48.19040359186167 ],
                [ 16.337713247320718, 48.190413827039244 ],
                [ 16.33775989228362, 48.19043044813175 ],
                [ 16.33780077701992, 48.190452816405724 ],
                [ 16.33783433035621, 48.19048007226786 ],
                [ 16.337859262852504, 48.190511168297505 ],
                [ 16.337874616355272, 48.19054490949752 ],
                [ 16.337879800820527, 48.190579999216375 ],
                [ 16.337874616991556, 48.19061508897725 ],
                [ 16.337859264059375, 48.19064883029893 ],
                [ 16.33783433201108, 48.190679926517475 ],
                [ 16.33780077895962, 48.19070718261679 ],
                [ 16.337759894325846, 48.1907295511534 ],
                [ 16.3377132492874, 48.19074617251013 ],
                [ 16.33766263639864, 48.19075640793171 ],
                [ 16.33761000070198, 48.19075986407274 ],
                [ 16.33720999929802, 48.19075986407274 ]
              ]]
            }
            }
          ]
        }, done)
      })

      it('simple - outside the cached area', function (done) {
        test({
          mode,
          query: 'node(around:20,48.19158,16.33721)',
          expected: [ 'n1198288962' ],
          expectedSubRequestCount: 1,
          expectedCacheDescriptors: [{
            "id": "node(properties:16)",
            "bounds": {
              "type": "Polygon",
              "coordinates": [
                [
                  [ 16.33747980608556, 48.19157999968435 ], [ 16.337474622018487, 48.19161508943623 ],
                  [ 16.337459268655017, 48.19164883073129 ], [ 16.337434335998825, 48.19167992690658 ],
                  [ 16.337400782186215, 48.19170718294771 ], [ 16.33735989666729, 48.1917295514134 ],
                  [ 16.337313250653718, 48.19174617268922 ], [ 16.33726263673732, 48.19175640802301 ],
                  [ 16.33721, 48.19175986407276 ], [ 16.33715736326268, 48.19175640802301 ],
                  [ 16.33710674934628, 48.19174617268922 ], [ 16.337060103332707, 48.1917295514134 ],
                  [ 16.337019217813786, 48.19170718294771 ], [ 16.336985664001173, 48.19167992690658 ],
                  [ 16.33696073134498, 48.19164883073129 ], [ 16.33694537798151, 48.19161508943623 ],
                  [ 16.336940193914437, 48.19157999968435 ], [ 16.33694537834392, 48.19154490995649 ],
                  [ 16.33696073201462, 48.19151116872986 ], [ 16.336985664876103, 48.19148007265698 ],
                  [ 16.337019218760798, 48.19145281673665 ], [ 16.337060104207634, 48.19143044839175 ],
                  [ 16.337106750015923, 48.19141382721834 ], [ 16.33715736362509, 48.19140359195297 ],
                  [ 16.33721, 48.19140013592726 ], [ 16.337262636374913, 48.19140359195297 ],
                  [ 16.337313249984074, 48.19141382721834 ], [ 16.337359895792364, 48.19143044839175 ],
                  [ 16.3374007812392, 48.19145281673665 ], [ 16.3374343351239, 48.19148007265698 ],
                  [ 16.337459267985377, 48.19151116872986 ], [ 16.337474621656078, 48.19154490995649 ],
                  [ 16.33747980608556, 48.19157999968435 ]
                ]
              ]
            }
          }]
        }, done)
      })
    })

    describe('Filter "bbox"', function () {
      it('clear cache', function () {
        overpassFrontend.clearCache()
      })

      it('simple', function (done) {
        test({
          mode,
          query: 'node(48.1904,16.3370,48.1907,16.3374)',
          expectedQuery: 'node(48.1904,16.337,48.1907,16.3374);',
          expected: [ 'n1599448219', 'n1871276160', 'n3765072046', 'n395262', 'n643386609' ],
          expectedSubRequestCount: 1,
          expectedCacheDescriptors: [{
            "id": "node(properties:16)",
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
          expectedQuery: 'node(48.1904,16.337,48.1907,16.3374);',
          expected: [ 'n1599448219', 'n1871276160', 'n3765072046', 'n395262', 'n643386609' ],
          expectedSubRequestCount: 0,
          expectedCacheDescriptors: [{
            "id": "node(properties:16)",
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
          expectedSubRequestCount: 0,
          expectedCacheDescriptors: [{
            "id": "node(properties:16)",
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
          expectedCacheDescriptors: [
            {
              "id": "node(properties:16)",
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
              "id": "way(properties:16)",
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

    describe('Filter "poly"', function () {
      it('clear cache', function () {
        overpassFrontend.clearCache()
      })

      it('simple', function (done) {
        test({
          mode,
          query: 'node(poly:"48.1904 16.3370 48.1907 16.3370 48.1907 16.3374")',
          expectedQuery: 'node(poly:"48.1904 16.337 48.1907 16.337 48.1907 16.3374");',
          expected: [ 'n395262' ],
          expectedSubRequestCount: 1,
          expectedCacheDescriptors: [{
            "id": "node(properties:16)",
            "bounds": {
              "type": "Polygon",
              "coordinates": [
                [
                  [ 16.337, 48.1904 ], [ 16.337, 48.1907 ],
                  [ 16.3374, 48.1907 ], [ 16.337, 48.1904 ],
                ]
              ]
            }
          }]
        }, done)
      })

      it('simple (fully cached)', function (done) {
        test({
          mode,
          query: 'node(poly:"48.1904 16.3370 48.1907 16.3370 48.1907 16.3374")',
          expectedQuery: 'node(poly:"48.1904 16.337 48.1907 16.337 48.1907 16.3374");',
          expected: [ 'n395262' ],
          expectedSubRequestCount: 0,
          expectedCacheDescriptors: [{
            "id": "node(properties:16)",
            "bounds": {
              "type": "Polygon",
              "coordinates": [
                [
                  [ 16.337, 48.1904 ], [ 16.337, 48.1907 ],
                  [ 16.3374, 48.1907 ], [ 16.337, 48.1904 ],
                ]
              ]
            }
          }]
        }, done)
      })

      it('no area left', function (done) {
        test({
          mode,
          query: 'node(poly:"48.1904 16.3370 48.1907 16.3370 48.1907 16.3374")(poly:"1 2 2 2 2 3")',
          expectedQuery: 'node(poly:"48.1904 16.337 48.1907 16.337 48.1907 16.3374")(poly:"1 2 2 2 2 3");',
          expected: [ ],
          expectedSubRequestCount: 0,
          expectedCacheDescriptors: [{
            "id": "node(properties:16)",
            "invalid": true,
          }]
        }, done)
      })

      it('invalid cache -> ignore cache', function (done) {
        test({
          mode,
          query: 'node(poly:"48.1904 16.3370 48.1907 16.3370 48.1907 16.3374")(poly:"1 2 2 2 2 3")',
          expectedQuery: 'node(poly:"48.1904 16.337 48.1907 16.337 48.1907 16.3374")(poly:"1 2 2 2 2 3");',
          expected: [ ],
          expectedSubRequestCount: 0,
          expectedCacheDescriptors: [{
            "id": "node(properties:16)",
            "invalid": true
          }]
        }, done)
      })
    })

    describe('Filter "newer"', function () {
      it('clear cache', function () {
        overpassFrontend.clearCache()
      })

      it('first', function (done) {
        test({
          mode,
          query: 'node[amenity](newer:"2016-05-01T00:00:00Z")',
          expectedQuery: 'node["amenity"](newer:"2016-05-01T00:00:00Z");',
          expected: [ 'n1863103576', 'n1870541458', 'n252549219', 'n4100076539', 'n4302904972', 'n441576820' ],
          expectedSubRequestCount: 1,
          expectedCacheDescriptors: [{
            "id": 'node["amenity"](newer:"2016-05-01T00:00:00Z")(properties:3)'
          }]
        }, done)
      })

      it('second (even newer)', function (done) {
        test({
          mode,
          query: 'node[amenity](newer:"2016-07-01T00:00:00Z")',
          expectedQuery: 'node["amenity"](newer:"2016-07-01T00:00:00Z");',
          expected: [ 'n1870541458', 'n4302904972', 'n441576820' ],
          expectedSubRequestCount: 0,
          expectedCacheDescriptors: [{
            "id": 'node["amenity"](newer:"2016-07-01T00:00:00Z")(properties:3)'
          }]
        }, done)
      })
    })

    describe('Filter "if"', function () {
      it('clear cache', function () {
        overpassFrontend.clearCache()
      })

      describe('tags', function (done) {
        it('single without quotes', function (done) {
          test({
            mode,
            query: 'node[highway](if: t["name"] == "Bahnhofstraße")',
            expectedQuery: 'node["highway"](if:t["name"]=="Bahnhofstraße");',
            expected: [ 'n647991' ],
            expectedSubRequestCount: 1,
            expectedCacheDescriptors: [{
              id: 'node["highway"](if:t["name"]=="Bahnhofstraße")(properties:1)'
            }]
          }, done)
        })

        it('tag without comparison', function (done) {
          test({
            mode,
            query: 'node[fixme](if: t["shop"])',
            expectedQuery: 'node["fixme"](if:t["shop"]);',
            expected: [ 'n2368032899' ],
            expectedSubRequestCount: 1,
            expectedCacheDescriptors: [{
              id: 'node["fixme"](if:t["shop"])(properties:1)'
            }]
          }, done)
        })
      })

      describe('type(), id()', function (done) {
        it('both', function (done) {
          test({
            mode,
            query: 'node[highway](if: id() == 377992 && type() == "node")',
            expectedQuery: 'node["highway"](if:id()==377992&&type()=="node");',
            expected: [ 'n377992' ],
            expectedSubRequestCount: 1,
            expectedCacheDescriptors: [{
              id: 'node["highway"](if:id()==377992&&type()=="node")(properties:1)'
            }]
          }, done)
        })

        it('both (fully cached)', function (done) {
          test({
            mode,
            query: 'node[highway](if: id() == 377992 && type() == "node")',
            expectedQuery: 'node["highway"](if:id()==377992&&type()=="node");',
            expected: [ 'n377992' ],
            expectedSubRequestCount: 0,
            expectedCacheDescriptors: [{
              id: 'node["highway"](if:id()==377992&&type()=="node")(properties:1)'
            }]
          }, done)
        })
      })

      describe('fixed value, property', function (done) {
        it('value true', function (done) {
          overpassFrontend.clearCache()
          const r = test({
            mode,
            query: 'node[fixme](if: 1)',
            expectedQuery: 'node["fixme"](if:1);',
            expected: [ 'n2368032899', 'n325842980', 'n3592094592' ],
            expectedSubRequestCount: 1,
            expectedCacheDescriptors: [{
              id: 'node["fixme"](properties:1)'
            }]
          }, done)
        })

        it('property', function (done) {
          overpassFrontend.clearCache()
          const r = test({
            mode,
            query: 'node[fixme](if: t["highway"])',
            expectedQuery: 'node["fixme"](if:t["highway"]);',
            expected: [ 'n3592094592' ],
            expectedSubRequestCount: 1,
            expectedCacheDescriptors: [{
              id: 'node["fixme"](if:t["highway"])(properties:1)',
            }]
          }, done)
        })

        it('property (fully cached)', function (done) {
          const r = test({
            mode,
            query: 'node[fixme](if: t["highway"])',
            expectedQuery: 'node["fixme"](if:t["highway"]);',
            expected: [ 'n3592094592' ],
            expectedSubRequestCount: 0,
            expectedCacheDescriptors: [{
              id: 'node["fixme"](if:t["highway"])(properties:1)'
            }]
          }, done)
        })

        it('value false', function (done) {
          overpassFrontend.clearCache()
          const r = test({
            mode,
            query: 'node[fixme](if: 0)',
            expectedQuery: 'node["fixme"](if:0);',
            expected: [],
            expectedSubRequestCount: 0,
            expectedCacheDescriptors: [{
              id: 'node["fixme"](properties:1)',
              invalid: true
            }]
          }, done)
        })
      })

      describe('is_tag()', function (done) {
        it('single', function (done) {
          test({
            mode,
            query: 'node[highway=crossing](if: is_tag("bicycle"))',
            expectedQuery: 'node["highway"="crossing"](if:is_tag("bicycle"));',
            expected: [ 'n252548482', 'n286198749', 'n286198796' ],
            expectedSubRequestCount: 1,
            expectedCacheDescriptors: [{
              id: 'node["highway"="crossing"](if:is_tag("bicycle"))(properties:1)',
            }]
          }, done)
        })
      })

      describe('length()', function (done) {
        it('length()', function (done) {
          overpassFrontend.clearCache()
          test({
            mode,
            query: 'way[highway](if: length() > 300)',
            queryOptions: { properties: OverpassFrontend.GEOM|OverpassFrontend.TAGS },
            expectedQuery: 'way["highway"](if:length()>300);',
            expected: [ 'w141233627', 'w162373026', 'w199261366', 'w211635132', 'w217030746', 'w244604984', 'w26739449', 'w28147563', 'w283595960', 'w28890734', 'w31275229', 'w4849338', 'w5003914', 'w5838278' ],
            expectedSubRequestCount: 1,
            expectedCacheDescriptors: [{
              id: 'way["highway"](if:length()>300)(properties:17)'
            }]
          }, done)
        })

        it('length()', function (done) {
          test({
            mode,
            query: 'way[highway](if: length() > 500)',
            queryOptions: { properties: OverpassFrontend.GEOM|OverpassFrontend.TAGS },
            expectedQuery: 'way["highway"](if:length()>500);',
            expected: [ 'w199261366', 'w217030746', 'w244604984', 'w31275229' ],
            expectedSubRequestCount: 0,
            expectedCacheDescriptors: [{
              id: 'way["highway"](if:length()>500)(properties:17)'
            }]
          }, (err) => {
            if (err) { return done(err) }

            const ob = overpassFrontend.cache.get('w199261366')
            assert.equal(ob.dbData.geomLength, 504.47617543211163, 'DB Data of object should have a length set')

            done()
          })
        })

        it('possibly closed ways', function (done) {
          test({
            mode,
            query: 'way[leisure=park](if: length() > 300)',
            queryOptions: { properties: OverpassFrontend.GEOM|OverpassFrontend.TAGS },
            expectedQuery: 'way["leisure"="park"](if:length()>300);',
            expected: [ 'w24867728', 'w299696929' ],
            expectedSubRequestCount: 1,
            expectedCacheDescriptors: [{
              id: 'way["leisure"="park"](if:length()>300)(properties:17)'
            }]
          }, done)
        })

        it('possibly closed ways (fully cached)', function (done) {
          test({
            mode,
            query: 'way[leisure=park](if: length() > 300)',
            queryOptions: { properties: OverpassFrontend.GEOM|OverpassFrontend.TAGS },
            expectedQuery: 'way["leisure"="park"](if:length()>300);',
            expected: [ 'w24867728', 'w299696929' ],
            expectedSubRequestCount: 0,
            expectedCacheDescriptors: [{
              id: 'way["leisure"="park"](if:length()>300)(properties:17)'
            }]
          }, done)
        })

        it('multi polygons', function (done) {
          test({
            mode,
            query: 'relation[building](if: length() > 300)',
            queryOptions: { properties: OverpassFrontend.GEOM|OverpassFrontend.TAGS|OverpassFrontend.MEMBERS },
            expectedQuery: 'relation["building"](if:length()>300);',
            expected: [ 'r1246553', 'r1283879', 'r2000126' ],
            expectedSubRequestCount: 1,
            expectedCacheDescriptors: [{
              id: 'relation["building"](if:length()>300)(properties:17)'
            }]
          }, done)
        })

        it('multi polygons (fully cached)', function (done) {
          test({
            mode,
            query: 'relation[building](if: length() > 300)',
            queryOptions: { properties: OverpassFrontend.GEOM|OverpassFrontend.TAGS|OverpassFrontend.MEMBERS },
            expectedQuery: 'relation["building"](if:length()>300);',
            expected: [ 'r1246553', 'r1283879', 'r2000126' ],
            expectedSubRequestCount: 0,
            expectedCacheDescriptors: [{
              id: 'relation["building"](if:length()>300)(properties:17)'
            }]
          }, done)
        })
      })

      describe('is_closed()', function (done) {
        it('is_closed()', function (done) {
          overpassFrontend.clearCache()
          test({
            mode,
            query: 'way[railway](if: is_closed())',
            queryOptions: { properties: OverpassFrontend.GEOM|OverpassFrontend.TAGS },
            expectedQuery: 'way["railway"](if:is_closed());',
            expected: [ 'w122504890', 'w122504891', 'w140549303', 'w140994821', 'w140994822', 'w210845476', 'w228736330', 'w228788310', 'w228788312', 'w232385434', 'w232385435', 'w234116025', 'w235999782', 'w235999783', 'w235999784', 'w235999841', 'w236000374', 'w236000375', 'w236000518', 'w237737500', 'w237737503', 'w261111066', 'w29003228', 'w86282062' ],
            expectedSubRequestCount: 1,
            expectedCacheDescriptors: [{
              id: 'way["railway"](if:is_closed())(properties:5)'
            }]
          }, done)
        })
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

  const request = overpassFrontend.BBoxQuery(
    options.query,
    null,
    options.queryOptions || {},
    (err, ob) => {
      found.push(ob.id)
    },
    (err) => {
      if (err) {
        if (options.expectException) {
          assert.equal(err.message, options.expectException)
          return callback()
        }

        return callback(err)
      }

      assert.equal(request.filterQuery.toString(), options.expectedQuery || options.query + ';')
      const expected = (options.mode === 'via-server' ? options.expectedViaServer : options.expectedViaFile) || options.expected
      assert.deepEqual(found.sort(), expected.sort(), 'List of found objects wrong!')
      if (options.mode === 'via-server') {
        assert.equal(foundSubRequestCount, options.expectedSubRequestCount, 'Wrong count of sub requests!')
      }

      request.off('subrequest-compile', compileListener)
      callback()
    }
  )

  request.on('subrequest-compile', compileListener)

  if (request.filterQuery) {
    const cacheDescriptors = request.filterQuery.cacheDescriptors()
    if (options.expectedCacheDescriptors) {
      assert.deepEqual(cacheDescriptors, options.expectedCacheDescriptors, 'Expected cache info')
    }
    if ('expectedProperties' in options) {
      assert.equal(request.filterQuery.properties(), options.expectedProperties)
    }
  }

  return request
}
