var assert = require('assert')

const OverpassFrontend = require('..')

if (typeof XMLHttpRequest === 'undefined') {
  global.XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest
  const DOMParser = require('@xmldom/xmldom').DOMParser
}

describe('Importer for other file formats', function () {
  describe('GeoJSON', function () {
    let overpassFrontend

    it ('load', function (done) {
      overpassFrontend = new OverpassFrontend('test/loader-test1.geojson')

      overpassFrontend.once('load', (osm3sMeta) => {
        console.log(osm3sMeta)
        console.log(overpassFrontend.cacheElements)
        done()
      })

      overpassFrontend.once('error', (error) => {
        done(error)
      })
    })

    it('get multipolygon', function (done) {
      overpassFrontend.BBoxQuery('relation[type=multipolygon]',
        null,
        {},
        (err, feature) => {
          console.log(feature)
        },
        (err) => {
          done(err)
        }
      )
    })
  })
})
