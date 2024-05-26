var assert = require('assert')

const loadFile = require('../src/loadFile')
const fileFormatOSMJSON = require('../src/fileFormatOSMJSON')
const fileFormatOSMXML = require('../src/fileFormatOSMXML')

if (typeof XMLHttpRequest === 'undefined') {
  global.XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest
  const DOMParser = require('@xmldom/xmldom').DOMParser
}

describe('Load OSM data from file', function () {
  it ('.osm.json', function (done) {
    loadFile('test/small.osm.json', {}, (err, content) => {
      fileFormatOSMJSON.load(content, {}, (err, result) => {
        parsedData = result

        done(err)
      })
    })
  })

  it ('.osm', function (done) {
    loadFile('test/small.osm', {}, (err, content) => {
      fileFormatOSMXML.load(content, {}, (err, result) => {
        if (err) {
          return done(err)
        }

        assert.deepEqual(result, parsedData)

        done()
      })
    })
  })

  it ('.osm.bz2', function (done) {
    loadFile('test/small.osm.bz2', {}, (err, content) => {
      fileFormatOSMXML.load(content, {}, (err, result) => {
        if (err) {
          return done(err)
        }

        assert.deepEqual(result, parsedData)

        done()
      })
    })
  })
})
