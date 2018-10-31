var fs = require('fs')
var conf = JSON.parse(fs.readFileSync('test/conf.json', 'utf8'));

var assert = require('assert')
var async = require('async')

var OverpassFrontend = require('../src/OverpassFrontend')
var BoundingBox = require('boundingbox')
var overpassFrontend

describe('load file', function() {
  it('wait until file is loaded', function (done) {
    this.timeout(20000)
    overpassFrontend = new OverpassFrontend('test/data.osm.bz2')
    overpassFrontend.once('load', (osm3sMeta) => {
      assert.deepEqual(osm3sMeta, { version: 0.6, generator: 'JOSM' })
      done()
    })
  })
})

describe('Overpass get', function() {
  describe('check completeness of objects', function() {
    it('node', function(done) {
      var finalCalled = 0
      var expected = [ 'n647991', 'n685168' ]
      var found = []

      overpassFrontend.get([ 'n647991', 'n685168', 'n685167' ],
        {
          properties: OverpassFrontend.ID_ONLY
        },
        function(err, result, index) {
          found.push(result.id)
          assert.equal(err, null, 'Error should be null')
          assert.equal(result.properties, OverpassFrontend.ALL, 'All properties should be known')
          if(expected.indexOf(result.id) == -1)
            assert(false, 'Object ' + result.id + ' should not be found!')
        },
        function(err) {
          assert.equal(expected.length, found.length, 'Wrong count of objects found!')
          assert.equal(finalCalled++, 0, 'Final function called ' + finalCalled + ' times!')
          done(err)
        })
    })

    it('way', function(done) {
      var finalCalled = 0
      var expected = [ 'w4583259', 'w52495764' ]
      var found = []

      overpassFrontend.get([ 'w4583259', 'w52495764', 'w52495765' ],
        {
          properties: OverpassFrontend.ID_ONLY
        },
        function(err, result, index) {
          assert.equal(err, null, 'Error should be null')
          assert.equal(result.properties, OverpassFrontend.ALL, 'All properties should be known')
          found.push(result.id)
          if(expected.indexOf(result.id) == -1)
            assert(false, 'Object ' + result.id + ' should not be found!')
        },
        function(err) {
          assert.equal(found.length, expected.length, 'Wrong count of objects found!')
          assert.equal(finalCalled++, 0, 'Final function called ' + finalCalled + ' times!')
          done(err)
        })
    })

    it('relation', function(done) {
      var finalCalled = 0
      var expected = [ 'r20309', 'r910885', 'r26679' ]
      var found = []

      overpassFrontend.get([ 'r20309', 'r910885', 'r20310', 'r26679' ],
        {
          properties: OverpassFrontend.ID_ONLY
        },
        function(err, result, index) {
          assert.equal(err, null, 'Error should be null')
          assert.equal(result.properties, OverpassFrontend.ALL, 'All properties should be known')
          found.push(result.id)
          if(expected.indexOf(result.id) == -1)
            assert(false, 'Object ' + result.id + ' should not be found!')

          if (result.id === 'r26679') {
            assert.deepEqual(result.members, [
              { "type": "way", "ref": 27913036, "role": "", "id": "w27913036" },
              { "type": "way", "ref": 37192544, "role": "", "id": "w37192544", "connectedNext": "forward", "dir": "forward" },
              { "type": "way", "ref": 351863115, "role": "", "id": "w351863115", "connectedPrev": "forward", "connectedNext": "forward", "dir": "forward" },
              { "type": "way", "ref": 37192539, "role": "", "id": "w37192539", "connectedPrev": "forward", "connectedNext": "forward", "dir": "forward" },
              { "type": "way", "ref": 358545531, "role": "", "id": "w358545531", "connectedPrev": "forward", "connectedNext": "forward", "dir": "forward" },
              { "type": "way", "ref": 244604985, "role": "forward", "id": "w244604985", "connectedPrev": "forward", "connectedNext": "forward", "dir": "forward" },
              { "type": "way", "ref": 244604983, "role": "forward", "id": "w244604983", "connectedPrev": "forward", "connectedNext": "forward", "dir": "forward" },
              { "type": "way", "ref": 244604986, "role": "forward", "id": "w244604986", "connectedPrev": "forward", "connectedNext": "backward", "dir": null },
              { "type": "way", "ref": 244604984, "role": "", "id": "w244604984", "connectedPrev": "forward", "dir": "forward" },
              { "type": "way", "ref": 140469820, "role": "", "id": "w140469820" },
              { "type": "way", "ref": 391248746, "role": "", "id": "w391248746" },
              { "type": "way", "ref": 376410649, "role": "", "id": "w376410649" },
              { "type": "way", "ref": 315358866, "role": "", "id": "w315358866" },
              { "type": "way", "ref": 24867844, "role": "", "id": "w24867844" },
              { "type": "way", "ref": 315358867, "role": "", "id": "w315358867" },
              { "type": "way", "ref": 47227945, "role": "", "id": "w47227945" },
              { "type": "way", "ref": 24867853, "role": "", "id": "w24867853" },
              { "type": "way", "ref": 237976509, "role": "", "id": "w237976509" },
              { "type": "way", "ref": 317440378, "role": "", "id": "w317440378" },
              { "type": "way", "ref": 238008484, "role": "", "id": "w238008484" },
              { "type": "way", "ref": 238008487, "role": "forward", "id": "w238008487" },
              { "type": "way", "ref": 26484712, "role": "forward", "id": "w26484712" },
              { "type": "way", "ref": 238008486, "role": "forward", "id": "w238008486" },
              { "type": "way", "ref": 24867859, "role": "forward", "id": "w24867859" },
              { "type": "way", "ref": 351960619, "role": "forward", "id": "w351960619" },
              { "type": "way", "ref": 30281645, "role": "forward", "id": "w30281645" },
              { "type": "way", "ref": 317440382, "role": "forward", "id": "w317440382" },
              { "type": "way", "ref": 30281647, "role": "forward", "id": "w30281647" },
              { "type": "way", "ref": 24729024, "role": "forward", "id": "w24729024" },
              { "type": "way", "ref": 26137584, "role": "forward", "id": "w26137584" },
              { "type": "way", "ref": 364728222, "role": "", "id": "w364728222" },
              { "type": "way", "ref": 28058102, "role": "", "id": "w28058102" }
            ])
          }
        },
        function(err) {
          assert.equal(found.length, expected.length, 'Wrong count of objects found!')
          assert.equal(finalCalled++, 0, 'Final function called ' + finalCalled + ' times!')
          done(err)
        })
    })
  })
})

describe('Overpass get before load finishes', function() {
  it ('get objects via get()', function (done) {
    overpassFrontend = new OverpassFrontend('test/small.osm.bz2')
    overpassFrontend.once('load', () => {
      loadFinished = true
    })
    let loadFinished = false

    // just load example objects from this database and check completeness
    overpassFrontend.get([ 'r276122', 'n293269032', 'n17312837', 'w324297228' ],
      {},
      function (err, result) {
        if (!loadFinished) {
          assert.fail('Load has not been emitted yet - should have waited')
        }

        if (result.id === 'r276122') {
          assert.deepEqual(result.members, [
            { type: 'way', ref: 47379824, role: 'from', id: 'w47379824', dir: null },
            { type: 'node', ref: 17312837, role: 'via', id: 'n17312837' },
            { type: 'way', ref: 324297228, role: 'to', id: 'w324297228', dir: null }
          ])
        } else if (result.id === 'n293269032') {
          assert.deepEqual(result.memberOf, [
            { id: 'w47379824', sequence: 1, role: null }
          ])
        } else if (result.id === 'n17312837') {
          assert.deepEqual(result.memberOf, [
            { id: 'r276122', sequence: 1, role: 'via' },
            { id: 'w47379824', sequence: 3, role: null },
            { id: 'w324297228', sequence: 0, role: null }
          ])
        } else if (result.id === 'w324297228') {
          assert.deepEqual(result.memberOf, [
            { id: 'r276122', sequence: 2, role: 'to' }
          ])
          assert.deepEqual(result.members, [
            { type: 'node', ref: 17312837, id: 'n17312837' },
            { type: 'node', ref: 1538937640, id: 'n1538937640' },
            { type: 'node', ref: 3310442552, id: 'n3310442552' }
          ])
        }
      },
      function (err) {
        if (!loadFinished) {
          assert.fail('Load has not been emitted yet - should have waited')
        }

        done()
      }
    )
  })
})

describe('Overpass BBoxQuery with members', function() {
  describe ('after load finishes', function () {
    it ('load file', function (done) {
      overpassFrontend = new OverpassFrontend('test/small.osm.bz2')
      overpassFrontend.once('load', () => {
        done()
      })
    })

    it ('now query', function (done) {
      // just load example objects from this database and check completeness
      overpassFrontend.BBoxQuery(
        'relation[type=restriction]',
        { minlat: 48, maxlat: 49, minlon: 16, maxlon: 17 },
        {
          members: true,
          memberCallback: function (err, result) {
            if (result.id === 'n293269032') {
              assert.deepEqual(result.memberOf, [
                { id: 'w47379824', sequence: 1, role: null }
              ])
            } else if (result.id === 'n17312837') {
              assert.deepEqual(result.memberOf, [
                { id: 'r276122', sequence: 1, role: 'via' },
                { id: 'w47379824', sequence: 3, role: null },
                { id: 'w324297228', sequence: 0, role: null }
              ])
            } else if (result.id === 'w324297228') {
              assert.deepEqual(result.memberOf, [
                { id: 'r276122', sequence: 2, role: 'to' }
              ])
              assert.deepEqual(result.members, [
                { type: 'node', ref: 17312837, id: 'n17312837' },
                { type: 'node', ref: 1538937640, id: 'n1538937640' },
                { type: 'node', ref: 3310442552, id: 'n3310442552' }
              ])
            }
          }
        },
        function (err, result) {
          if (result.id === 'r276122') {
            assert.deepEqual(result.members, [
              { type: 'way', ref: 47379824, role: 'from', id: 'w47379824', dir: null },
              { type: 'node', ref: 17312837, role: 'via', id: 'n17312837' },
              { type: 'way', ref: 324297228, role: 'to', id: 'w324297228', dir: null }
            ])
          }
        },
        function (err) {
          done()
        }
      )
    })
  })

  describe('now query before load finishes', function() {
    it ('load & query', function (done) {
      overpassFrontend = new OverpassFrontend('test/small.osm.bz2')
      overpassFrontend.once('load', () => {
        loadFinished = true
      })
      let loadFinished = false

      // just load example objects from this database and check completeness
      overpassFrontend.BBoxQuery(
        'relation[type=restriction]',
        { minlat: 48, maxlat: 49, minlon: 16, maxlon: 17 },
        {
          members: true,
          memberCallback: function (err, result) {
            if (result.id === 'n293269032') {
              assert.deepEqual(result.memberOf, [
                { id: 'w47379824', sequence: 1, role: null }
              ])
            } else if (result.id === 'n17312837') {
              assert.deepEqual(result.memberOf, [
                { id: 'r276122', sequence: 1, role: 'via' },
                { id: 'w47379824', sequence: 3, role: null },
                { id: 'w324297228', sequence: 0, role: null }
              ])
            } else if (result.id === 'w324297228') {
              assert.deepEqual(result.memberOf, [
                { id: 'r276122', sequence: 2, role: 'to' }
              ])
              assert.deepEqual(result.members, [
                { type: 'node', ref: 17312837, id: 'n17312837' },
                { type: 'node', ref: 1538937640, id: 'n1538937640' },
                { type: 'node', ref: 3310442552, id: 'n3310442552' }
              ])
            }
          }
        },
        function (err, result) {
          if (!loadFinished) {
            assert.fail('Load has not been emitted yet - should have waited')
          }

          if (result.id === 'r276122') {
            assert.deepEqual(result.members, [
              { type: 'way', ref: 47379824, role: 'from', id: 'w47379824', dir: null },
              { type: 'node', ref: 17312837, role: 'via', id: 'n17312837' },
              { type: 'way', ref: 324297228, role: 'to', id: 'w324297228', dir: null }
            ])
          }
        },
        function (err) {
          if (!loadFinished) {
            assert.fail('Load has not been emitted yet - should have waited')
          }

          done()
        }
      )
    })
  })
})
