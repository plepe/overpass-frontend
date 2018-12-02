var fs = require('fs')
var conf = JSON.parse(fs.readFileSync('test/conf.json', 'utf8'));

if (!conf.generator) {
  console.error('Set correct "generator" string in test/conf.json!')
  process.exit(0)
}

var assert = require('assert')
var async = require('async')

var OverpassFrontend = require('../src/OverpassFrontend')
var BoundingBox = require('boundingbox')
var overpassFrontend = new OverpassFrontend(conf.url)

describe('Overpass exportGeoJSON', function() {
  describe('basic', function() {
    let toTest = {
      r910885: {
        properties: {"@id":"relation/910885","from":"Dr. Karl Renner Ring","name":"Tram 49: Dr. Karl Renner Ring => Hütteldorf","network":"VOR","opening_hours":"05:00-00:30","operator":"Wiener Linien","ref":"49","route":"tram","to":"Hütteldorf","type":"route","@timestamp":"2016-08-25T09:12:57Z","@version":69,"@changeset":41682634,"@user":"skunk","@uid":28427,"@osm3s:version":0.6,"@osm3s:generator":conf.generator,"@osm3s:timestamp_osm_base":"","@osm3s:copyright":"The data included in this document is from www.openstreetmap.org. The data is made available under ODbL."},
        geometryType: 'GeometryCollection'
      },
      n647991: {
        properties: {"@id":"node/647991","bus":"yes","highway":"bus_stop","name":"Bahnhofstraße","network":"VOR","public_transport":"stop_position","railway":"tram_stop","wheelchair":"yes","@timestamp":"2016-05-06T21:44:24Z","@version":21,"@changeset":39152658,"@user":"emergency99","@uid":1832939,"@osm3s:version":0.6,"@osm3s:generator":"Overpass API 0.7.55.5 2ca3f387","@osm3s:timestamp_osm_base":"","@osm3s:copyright":"The data included in this document is from www.openstreetmap.org. The data is made available under ODbL."},
        geometry: {"type":"Point","coordinates":[16.2623007,48.201554]}
      },
      w4583628: {
        properties: {"@id":"way/4583628","cycleway":"opposite_lane","highway":"living_street","lanes":"1","name":"Pelzgasse","oneway":"yes","@timestamp":"2014-04-07T20:10:24Z","@version":7,"@changeset":21559724,"@user":"Girolamo","@uid":908743,"@osm3s:version":0.6,"@osm3s:generator":"Overpass API 0.7.55.5 2ca3f387","@osm3s:timestamp_osm_base":"","@osm3s:copyright":"The data included in this document is from www.openstreetmap.org. The data is made available under ODbL."},
        geometry: {"type":"LineString","coordinates":[[16.3367061,48.1978377],[16.3359649,48.1990173]]}
      },
      w125586430: {
        properties: {"@id":"way/125586430","building":"yes","location":"indoor","name":"Unterwerk Goldschlagstraße","note":"für U6","power":"substation","substation":"traction","voltage":"20000","@timestamp":"2015-10-22T17:38:19Z","@version":3,"@changeset":34804921,"@user":"42429","@uid":42429,"@osm3s:version":0.6,"@osm3s:generator":"Overpass API 0.7.55.5 2ca3f387","@osm3s:timestamp_osm_base":"","@osm3s:copyright":"The data included in this document is from www.openstreetmap.org. The data is made available under ODbL."},
        geometry: {"type":"Polygon","coordinates":[[[16.3381123,48.1995136],[16.3382679,48.1995372],[16.3382937,48.1995411],[16.3383551,48.1993668],[16.3381763,48.1993366],[16.3381123,48.1995136]]]}
      },
      r2334391: {
        properties: {"@id":"relation/2334391","building":"yes","type":"multipolygon","@timestamp":"2012-08-06T03:08:07Z","@version":1,"@changeset":12628312,"@user":"KaiRo","@uid":17047,"@osm3s:version":0.6,"@osm3s:generator":"Overpass API 0.7.55.5 2ca3f387","@osm3s:timestamp_osm_base":"","@osm3s:copyright":"The data included in this document is from www.openstreetmap.org. The data is made available under ODbL."},
        geometry: {"type":"Polygon","coordinates":[[[16.3386374,48.1997241],[16.3387568,48.1994112],[16.3391364,48.1994774],[16.3394272,48.1995281],[16.3393112,48.1998359],[16.3391813,48.1998143],[16.3391895,48.1997874],[16.3391645,48.1997837],[16.3391556,48.19981],[16.3386374,48.1997241]],[[16.3390834,48.199634],[16.3388933,48.199601],[16.3388735,48.1996538],[16.3388471,48.1996494],[16.3388325,48.1996972],[16.3390013,48.1997271],[16.3389943,48.1997462],[16.3390377,48.1997532],[16.3390834,48.199634]]]}
      }
    }

    for (var id in toTest) {
      it(id, function (id, expected, done) {
        overpassFrontend.get(id,
          {
            properties: OverpassFrontend.ID_ONLY
          },
          (err, result) => {
            result.exportGeoJSON(
              {
              },
              (err, result) => {
                assert.deepEqual(result.properties, expected.properties)
                if ('geometryType' in expected) {
                  assert.equal(result.geometry.type, expected.geometryType)
                }
                if ('geometry' in expected) {
                  assert.deepEqual(result.geometry, expected.geometry)
                }

                done()
              }
            )
          },
          (err) => {
          }
        )
      }.bind(this, id, toTest[id]))
    }
  })
})
