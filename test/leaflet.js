var assert = require('assert')
var async = require('async')

var OverpassFrontend = require('../src/OverpassFrontend')

/* setup fake DOM on NodeJS */
if (!global.window) {
  const JSDOM = require("jsdom").JSDOM
  const dom = new JSDOM(`<!DOCTYPE html><p>Hello world</p>`)
  global.window = dom.window
  global.document = dom.window.document
  global.navigator = {
    userAgent: 'node',
    platform: ''
  }
}
/* done */
global.L = require('leaflet')


describe('test leaflet functions', function() {
  let overpassFrontend

  it('load file', function (done) {
    this.timeout(20000)
    overpassFrontend = new OverpassFrontend('test/small.osm')
    overpassFrontend.once('load', (osm3sMeta) => {
      done()
    })
  })

  it('node.leafletFeature()', (done) => {
    overpassFrontend.get(
      ['n1538937640'],
      {},
      (err, result) => {
        let feature = result.leafletFeature()
        assert.deepEqual(feature._latlng, { lat: 48.208453, lng: 16.3389884 })
        assert.deepEqual(feature.toGeoJSON(),
          {
            "type": "Feature",
            "properties": {},
            "geometry": {
              "type": "Point",
              "coordinates": [
                16.338988,
                48.208453
              ]
            }
          }
        )
      },
      (err) => done(err)
    )
  })

  it('way[linestring].leafletFeature()', (done) => {
    overpassFrontend.get(
      ['w47379824'],
      {},
      (err, result) => {
        let feature = result.leafletFeature()
        assert.deepEqual(feature._latlngs, [ { "lat": 48.2085805, "lng": 16.3381316 }, { "lat": 48.2085393, "lng": 16.3382698 }, { "lat": 48.20846, "lng": 16.3387307 }, { "lat": 48.2084499, "lng": 16.3388375 } ])
        assert.deepEqual(feature.toGeoJSON(), {
          "type": "Feature",
          "properties": {},
          "geometry": {
            "type": "LineString",
            "coordinates": [
              [
                16.338132,
                48.208581
              ],
              [
                16.33827,
                48.208539
              ],
              [
                16.338731,
                48.20846
              ],
              [
                16.338838,
                48.20845
              ]
            ]
          }
        })
      },
      (err) => done(err)
    )
  })

  it('way[polygon].leafletFeature()', (done) => {
    overpassFrontend.get(
      ['w810158846'],
      {},
      (err, result) => {
        let feature = result.leafletFeature()
        assert.deepEqual(feature._latlngs, [[ { "lat": 48.2083724, "lng": 16.3386017 }, { "lat": 48.2083887, "lng": 16.3386135 }, { "lat": 48.2083755, "lng": 16.3386587 }, { "lat": 48.2083592, "lng": 16.3386486 } ]])
        assert.deepEqual(feature.toGeoJSON(), {
          "type": "Feature",
          "properties": {},
          "geometry": {
            "type": "Polygon",
            "coordinates": [
              [
                [
                  16.338602,
                  48.208372
                ],
                [
                  16.338614,
                  48.208389
                ],
                [
                  16.338659,
                  48.208376
                ],
                [
                  16.338649,
                  48.208359
                ],
                [
                  16.338602,
                  48.208372
                ]
              ]
            ]
          }
        })
      },
      (err) => done(err)
    )
  })

  it('way[incomplete].leafletFeature()', (done) => {
    overpassFrontend.get(
      ['w26738383'],
      {},
      (err, result) => {
        let feature = result.leafletFeature()
        assert.deepEqual(feature._latlngs, [ { "lat": 48.2061526, "lng": 16.3373996 }, { "lat": 48.207321, "lng": 16.338148 }, { "lat": 48.2084499, "lng": 16.3388375 } ])
        assert.deepEqual(feature.toGeoJSON(), {
          "type": "Feature",
          "properties": {},
          "geometry": {
            "type": "LineString",
            "coordinates": [
              [
                16.3374,
                48.206153
              ],
              [
                16.338148,
                48.207321
              ],
              [
                16.338838,
                48.20845
              ]
            ]
          }
        })
      },
      (err) => done(err)
    )
  })

  it('relation.leafletFeature()', (done) => {
    overpassFrontend.get(
      ['r276122'],
      {},
      (err, result) => {
        let feature = result.leafletFeature()
        assert.deepEqual(feature.toGeoJSON(), {
          "type": "FeatureCollection",
          "features": [
            {
              "type": "Feature",
              "geometry": {
                "type": "LineString",
                "coordinates": [
                  [
                    16.338132,
                    48.208581
                  ],
                  [
                    16.33827,
                    48.208539
                  ],
                  [
                    16.338731,
                    48.20846
                  ],
                  [
                    16.338838,
                    48.20845
                  ]
                ]
              },
              "properties": {
                "id": "way/47379824"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "LineString",
                "coordinates": [
                  [
                    16.338838,
                    48.20845
                  ],
                  [
                    16.338988,
                    48.208453
                  ],
                  [
                    16.339139,
                    48.208457
                  ]
                ]
              },
              "properties": {
                "id": "way/324297228"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  16.338838,
                  48.20845
                ]
              },
              "properties": {
                "id": "node/17312837"
              }
            }
          ]
        })
      },
      (err) => done(err)
    )
  })
})
