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
	    "id": "node/3037893169",
	    "geometry": {
	      "type": "Point",
	      "coordinates": [ 16.3384675, 48.1984802 ]
	    },
	    "properties": {
	      "amenity": "bench",
	      "backrest": "yes",
	      "material": "wood",
	      "source": "survey",
	      "@changeset": 24967165,
	      "@id": "node/3037893169",
	      "@timestamp": "2014-08-23T23:04:34Z",
	      "@uid": 770238,
	      "@user": "Kevin Kofler",
	      "@version": 1
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
	    "id": "way/146678749",
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
	      "source:maxspeed": "AT:zone:30",
	      "@changeset": 18574192,
	      "@id": "way/146678749",
	      "@timestamp": "2013-10-27T20:43:03Z",
	      "@uid": 1066249,
	      "@user": "Railjet",
	      "@version": 5
	    }
	  },
          geojson);

          done();
        },
        function(err) {
        })
    })
  })

  describe('bbox query', function() {
    it('should return a list of node features', function(done) {
      var found = []
      var expected = [ 'n3037893162', 'n3037893163', 'n3037893164' ]

      overpass.bbox_query(
        'node[amenity=bench];',
        {
          minlon: 16.3384616,
          minlat: 48.1990347,
          maxlon: 16.3386118,
          maxlat: 48.1991437
        },
        {
          properties: Overpass.ID_ONLY
        },
        function(err, result, index) {
          found.push(result.id)

          if(expected.indexOf(result.id) == -1)
            assert(false, 'Object ' + result.id + ' should not be found!')
        },
        function(err) {
          if(found.length != expected.length)
            assert(false, 'Wrong count of objects found!')

          done()
        }
      )
    })

    it('should return a list of way features', function(done) {
      var found = []
      var expected = [ 'w299709373', 'w299709375' ]

      overpass.bbox_query(
        'way[highway=footway];',
        {
          minlon: 16.3384616,
          minlat: 48.1990347,
          maxlon: 16.3386118,
          maxlat: 48.1991437
        },
        {
          properties: Overpass.ID_ONLY
        },
        function(err, result, index) {
          found.push(result.id)

          if(expected.indexOf(result.id) == -1)
            assert(false, 'Object ' + result.id + ' should not be found!')
        },
        function(err) {
          if(found.length != expected.length)
            assert(false, 'Wrong count of objects found!')

          done()
        }
      )
    })
  })
  describe('removeFromCache()', function() {
    // TODO: Missing!
  })
})
