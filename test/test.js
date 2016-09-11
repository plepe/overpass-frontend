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

  describe('GeoJSON', function() {
    it('node', function(done) {
      overpass.get('n3037893169', { properties: Overpass.ALL },
        function(err, result, index) {
	  var geojson = result.GeoJSON();
          //console.log(JSON.stringify(geojson, null, '  '))

          assert.deepEqual({
	    "type": "Feature",
	    "geometry": {
	      "type": "Point",
	      "coordinates": [ 16.3384675, 48.1984802 ]
	    },
	    "properties": {
	      "amenity": "bench",
	      "backrest": "yes",
	      "material": "wood",
	      "source": "survey"
	    }
	  },
          geojson);

          done();
        },
        function(err) {
        })
    })

    it('way', function(done) {
      overpass.get('w146678749', { properties: Overpass.ALL },
        function(err, result, index) {
	  var geojson = result.GeoJSON();

          assert.deepEqual({
	    "type": "Feature",
	    "geometry": {
	      "type": "LineString",
	      "coordinates": [
		[ 16.3408935, 48.1986759 ],
		[ 16.3402714, 48.1985783 ],
		[ 16.3398928, 48.1985189 ],
		[ 16.3392533, 48.1984151 ]
	      ]
	    },
	    "properties": {
	      "highway": "residential",
	      "is_in": "Austria, Europe,Vienna,Wien",
	      "lit": "yes",
	      "maxspeed": "30",
	      "name": "Stollgasse",
	      "oneway": "yes",
	      "source:maxspeed": "AT:zone:30"
	    }
	  },
          geojson);

          done();
        },
        function(err) {
        })
    })
  })
})
