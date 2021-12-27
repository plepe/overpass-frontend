var async = require('async')
var assert = require('assert')
var fs = require('fs')

var BoundingBox = require('boundingbox')

var removeNullEntries = require('../src/removeNullEntries')
var OverpassFrontend = require('../src/OverpassFrontend')

var conf = JSON.parse(fs.readFileSync('test/conf.json', 'utf8'));
if (!conf.generator) {
  console.error('Set correct "generator" string in test/conf.json!')
  process.exit(0)
}

var overpassFrontend = new OverpassFrontend(conf.url)

describe('Overpass query by id with bbox option', function() {
  it('First call', function(done) {
    var finalCalled = 0
    var query = [ 'w299709373', 'w299709375', 'w4583442', 'w299704585', 'n2832485845', 'n3037893162', 'r20313', 'r3636229', 'r3311614', 'w12345' ]
    var expected = [ 'w299709373', 'n3037893162' ]
    var index_outside_bbox = [ 1, 2, 3, 4, 5, 6, 7, 8 ]
    var index_non_existant = [ 9 ]
    var bbox = {
            minlon: 16.3384616,
            minlat: 48.1990347,
            maxlon: 16.3386118,
            maxlat: 48.1991437
          }

    // make sure, that elements are not loaded
    query.forEach(function (item) {
      overpassFrontend.removeFromCache(item)
    })

    overpassFrontend.get(query.concat([]), { properties: OverpassFrontend.ALL, bbox: bbox },
        function(err, result, index) {
          if (result === false && index_outside_bbox.indexOf(index) == -1)
              assert.fail('Index ' + index + ' should return a valid result (' + query[index] + ')')

          if (result === null && index_non_existant.indexOf(index) === -1) {
            assert.fail('Index ' + index + ' should not return a non-existant object (' + query[index] + ')')
          }

          if (result !== false && result !== null && expected.indexOf(result.id) == -1) {
            assert.fail('Returning object ' + result.id + ' which should not be returned')
          }
        },
        function(err) {
          assert.equal(finalCalled++, 0, 'Final function called ' + finalCalled + ' times!')
          done()
        }
    )
  })

  it('Second call', function(done) {
    var finalCalled = 0
    var query = [ 'w299709373', 'w299709375', 'w4583442', 'w299704585', 'n2832485845', 'n3037882439', 'n3037893162', 'w12345' ]
    var expected = [ 'w299709375', 'w299704585' ]
    var index_outside_bbox = [ 0, 1, 2, 4, 5, 6 ]
    var index_non_existant = [ 7 ]
    var bbox = {
            minlat: 48.1996955,
            minlon: 16.3381572,
            maxlat: 48.1998337,
            maxlon: 16.3382651
          }

    overpassFrontend.get(query.concat([]), { properties: OverpassFrontend.ALL, bbox: bbox },
        function(err, result, index) {
          if (result === false && index_outside_bbox.indexOf(index) == -1)
              assert.fail('Index ' + index + ' should return a valid result (' + query[index] + ')')

          if (result === null && index_non_existant.indexOf(index) === -1) {
            assert.fail('Index ' + index + ' should not return a non-existant object (' + query[index] + ')')
          }

          if (result !== false && result !== null && expected.indexOf(result.id) == -1) {
            assert.fail('Returning object ' + result.id + ' which should not be returned')
          }
        },
        function(err) {
          assert.equal(finalCalled++, 0, 'Final function called ' + finalCalled + ' times!')
          done()
        }
    )
  })

  it('Check data of outside objects', function(done) {
    var finalCalled = 0
    var query = [ 'n2832485845', 'n3037882439' ]

    overpassFrontend.get(query.concat([]), { properties: OverpassFrontend.ID_ONLY },
        function(err, result, index) {
          // has GEOM, because for nodes lat/lon is geom, bbox and center
          assert.equal(OverpassFrontend.GEOM | OverpassFrontend.BBOX | OverpassFrontend.CENTER | OverpassFrontend.MEMBERS, result.properties, 'Element ' + result.id + ' which was loaded outside bbox, should only have BBOX data')
        },
        function(err) {
          assert.equal(finalCalled++, 0, 'Final function called ' + finalCalled + ' times!')
          done()
        }
    )

  })

    it('should handle several simultaneous requests', function(done) {
      var items1 = [ 'n3037893167', 'n3037893166' ]
      var items2 = [ 'n3037893165', 'n3037893166' ]
      var items3 = [ 'n1853730723' ]

      overpassFrontend.removeFromCache(items1)
      overpassFrontend.removeFromCache(items2)
      overpassFrontend.removeFromCache(items3)

      async.parallel([
        function(callback) {
          var done = []
          var finalCalled = 0

          overpassFrontend.get(items1,
            {
              properties: OverpassFrontend.ALL,
              bbox: {
                minlon: 16.3375,
                minlat: 48.1985,
                maxlon: 16.3385,
                maxlat: 48.2005
              }
            },
            function(err, result, index) {
              assert.equal(null, err, err)
              assert.notEqual(items1.indexOf(result.id), -1, 'Item should not be returned by 1st request: ' + result.id)
              done.push(result.id)
            },
            function(err) {
              assert.equal(done.length, items1.length, '1st request should return ' + items1.length + ' items')
              assert.equal(finalCalled++, 0, 'Final function called ' + finalCalled + ' times!')
              assert.equal(done.length, items1.length, '2nd request should return ' + items1.length + ' items')
              callback(err)
            }
          )
        },
        function(callback) {
          var done = []
          var finalCalled = 0

          overpassFrontend.get(items2,
            {
              properties: OverpassFrontend.ALL,
              bbox: {
                minlon: 16.3375,
                minlat: 48.1985,
                maxlon: 16.3385,
                maxlat: 48.2005
              }
            },
            function(err, result, index) {
              assert.equal(null, err, err)
              assert.notEqual(items2.indexOf(result.id), -1, 'Item should not be returned by 2nd request: ' + result.id)
              done.push(result.id)
            },
            function(err) {
              assert.equal(finalCalled++, 0, 'Final function called ' + finalCalled + ' times!')
              assert.equal(done.length, items2.length, '2nd request should return ' + items2.length + ' items')
              callback(err)
            }
          )
        },
        function(callback) {
          var done = []
          var finalCalled = 0

          overpassFrontend.get(items3,
            {
              properties: OverpassFrontend.ALL,
              bbox: {
                minlon: 16.3375,
                minlat: 48.1985,
                maxlon: 16.3385,
                maxlat: 48.2005
              }
            },
            function(err, result, index) {
              assert.equal(null, err, err)
              assert.notEqual(items3.indexOf(result.id), -1, 'Item should not be returned by 3rd request: ' + result.id)
              done.push(result.id)
            },
            function(err) {
              assert.equal(finalCalled++, 0, 'Final function called ' + finalCalled + ' times!')
              assert.equal(done.length, items3.length, '3nd request should return ' + items3.length + ' items')
              callback(err)
            }
          )
        }],
        function(err) {
          done(err)
        }
      )
    })

    it('should handle several simultaneous requests with too much effort', function(done) {
      var items1 = [ 'n3037893167', 'n3037893166' ]
      var items2 = [ 'n3037893165' ]
      var items3 = [ 'n1853730723' ]

      overpassFrontend.removeFromCache(items1)
      overpassFrontend.removeFromCache(items2)
      overpassFrontend.removeFromCache(items3)
      overpassFrontend.options.effortPerRequest = 2

      async.parallel([
        function(callback) {
          var done = []
          var finalCalled = 0

          overpassFrontend.get(items1,
            {
              properties: OverpassFrontend.ALL,
              bbox: {
                minlon: 16.3375,
                minlat: 48.1985,
                maxlon: 16.3385,
                maxlat: 48.2005
              }
            },
            function(err, result, index) {
              assert.equal(null, err, err)
              assert.notEqual(items1.indexOf(result.id), -1, 'Item should not be returned by 1st request: ' + result.id)
              done.push(result.id)
            },
            function(err) {
              assert.equal(finalCalled++, 0, 'Final function called ' + finalCalled + ' times!')
              assert.equal(done.length, items1.length, '2nd request should return ' + items1.length + ' items')
              callback(err)
            }
          )
        },
        function(callback) {
          var done = []
          var finalCalled = 0

          overpassFrontend.get(items2,
            {
              properties: OverpassFrontend.ALL,
              bbox: {
                minlon: 16.3375,
                minlat: 48.1985,
                maxlon: 16.3385,
                maxlat: 48.2005
              }
            },
            function(err, result, index) {
              assert.equal(null, err, err)
              assert.notEqual(items2.indexOf(result.id), -1, 'Item should not be returned by 2nd request: ' + result.id)
              done.push(result.id)
            },
            function(err) {
              assert.equal(finalCalled++, 0, 'Final function called ' + finalCalled + ' times!')
              assert.equal(done.length, items2.length, '2nd request should return ' + items2.length + ' items')
              callback(err)
            }
          )
        },
        function(callback) {
          var done = []
          var finalCalled = 0

          overpassFrontend.get(items3,
            {
              properties: OverpassFrontend.ALL,
              bbox: {
                minlon: 16.3375,
                minlat: 48.1985,
                maxlon: 16.3385,
                maxlat: 48.2005
              }
            },
            function(err, result, index) {
              assert.equal(null, err, err)
              assert.notEqual(items3.indexOf(result.id), -1, 'Item should not be returned by 3rd request: ' + result.id)
              done.push(result.id)
            },
            function(err) {
              assert.equal(finalCalled++, 0, 'Final function called ' + finalCalled + ' times!')
              assert.equal(done.length, items3.length, '3nd request should return ' + items3.length + ' items')
              callback(err)
            }
          )
        }],
        function(err) {
          overpassFrontend.options.effortPerRequest = 1000
          done(err)
        }
      )
    })
})


