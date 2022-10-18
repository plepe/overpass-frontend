var assert = require('assert')

const loadOsmFile = require('../src/loadOsmFile')
if (typeof XMLHttpRequest === 'undefined') {
  global.XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest
  const DOMParser = require('@xmldom/xmldom').DOMParser
}

var parsedData

describe('Load OSM data from file', function () {
  it ('.json', function (done) {
    loadOsmFile('test/small.json', (err, result) => {
      parsedData = result

      done(err)
    })
  })

  it ('.osm', function (done) {
    loadOsmFile('test/small.osm', (err, result) => {
      if (err) {
        return done(err)
      }

      assert.deepEqual(result, parsedData)

      done()
    })
  })

  it ('.osm.bz2', function (done) {
    loadOsmFile('test/small.osm.bz2', (err, result) => {
      if (err) {
        return done(err)
      }

      assert.deepStrictEqual(result, parsedData)

      done()
    })
  })
})
