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
    overpassFrontend.once('load', done)
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
