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
      var expected = [ 'r20309', 'r910885' ]
      var found = []

      overpassFrontend.get([ 'r20309', 'r910885', 'r20310' ],
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
            { type: 'way', ref: 47379824, role: 'from', id: 'w47379824' },
            { type: 'node', ref: 17312837, role: 'via', id: 'n17312837' },
            { type: 'way', ref: 324297228, role: 'to', id: 'w324297228' }
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
            console.log('member', result.id)
          }
        },
        function (err, result) {
          console.log('main', result.id)

          if (result.id === 'r276122') {
            assert.deepEqual(result.members, [
              { type: 'way', ref: 47379824, role: 'from', id: 'w47379824' },
              { type: 'node', ref: 17312837, role: 'via', id: 'n17312837' },
              { type: 'way', ref: 324297228, role: 'to', id: 'w324297228' }
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
            console.log('member', result.id)
          }
        },
        function (err, result) {
          console.log('main', result.id)
          if (!loadFinished) {
            assert.fail('Load has not been emitted yet - should have waited')
          }

          if (result.id === 'r276122') {
            assert.deepEqual(result.members, [
              { type: 'way', ref: 47379824, role: 'from', id: 'w47379824' },
              { type: 'node', ref: 17312837, role: 'via', id: 'n17312837' },
              { type: 'way', ref: 324297228, role: 'to', id: 'w324297228' }
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
})
