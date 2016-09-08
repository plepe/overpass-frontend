var fs = require('fs')
var conf = JSON.parse(fs.readFileSync('test/conf.json', 'utf8'));

var assert = require('assert')

var Overpass = require('../src/Overpass')
var overpass = new Overpass(conf.url)


describe('Overpass get', function() {
  describe('single id', function() {
    it('should return an existing relation', function(done) {
      overpass.get('r910885', { properties: Overpass.ALL },
        function(err, result, index) {
          if(err)
            done(err)

          if(result.id == 'r910885')
            done()
          else
            done('wrong object?')
        },
        function(err) {
        })
    })

    it('should return null for a missing object', function(done) {
      overpass.get('r32', { properties: Overpass.ALL },
        function(err, result, index) {
          if(result !== null) {
            done('r32 should not exist!')
          }
        },
        function(err) {
          done(err);
        })
    })
  })
})
