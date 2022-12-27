var fs = require('fs')
var conf = JSON.parse(fs.readFileSync('test/conf.json', 'utf8'));

var assert = require('assert')
var async = require('async')

var OverpassFrontend = require('../src/OverpassFrontend')
var BoundingBox = require('boundingbox')
var overpassFrontend

const files = [
  {
    filename: 'small.osm',
    contentType: 'application/vnd.openstreetmap.data+xml',
    base64: true
  },
  {
    filename: 'small.osm.bz2',
    contentType: 'application/x-bzip',
    base64: true
  },
  {
    filename: 'small.json',
    contentType: 'application/json',
    base64: true
  },
  {
    filename: 'small.json',
    contentType: 'application/json',
    base64: false
  }
]

function loadFile (fileDef, callback) {
  if (typeof location === 'undefined') {
    fs.readFile('test/' + fileDef.filename, (err, content) => {
      let dataURL
      if (fileDef.base64) {
        dataURL = 'data:' + fileDef.contentType + ';base64,' + content.toString('base64')
      } else {
        dataURL = 'data:' + fileDef.contentType + ';charset=UTF-8,' + encodeURIComponent(content.toString())
      }

      callback(null, dataURL)
    })
  } else if (fileDef.base64) {
    fetch('test/' + fileDef.filename)
      .then(req => req.blob())
      .then(content => {
        var reader = new FileReader()
        reader.readAsDataURL(content)
        reader.onloadend = function() {
          callback(null, reader.result)
        }
      })
  } else {
    fetch('test/' + fileDef.filename)
      .then(req => req.text())
      .then(content => {
        const dataURL = 'data:' + fileDef.contentType + ';charset=UTF-8,' + encodeURIComponent(content)
        callback(null, dataURL)
      })
  }
}

describe('Test loading OSM data from Data URL', function() {
  files.forEach(fileDef => {
    describe('Data URL from ' + fileDef.filename + ' (' + (fileDef.base64 ? 'base64' : 'url encoded') + ')', function () {
      it('load file', function (done) {
        loadFile(fileDef, (err, dataURL) => {
          overpassFrontend = new OverpassFrontend(dataURL)
          overpassFrontend.once('load', () => {
            done()
          })
        })
      })

      it('check data', function (done) {
        const expected = [ 'r276122', 'n293269032', 'n17312837', 'w324297228' ]
        const actual = []
        // just load example objects from this database and check completeness
        overpassFrontend.get([ 'r276122', 'n293269032', 'n17312837', 'w324297228' ],
          {},
          function (err, result) {
            actual.push(result.id)
            if (result.id === 'r276122') {
              assert.deepEqual(result.members, [
                { type: 'way', ref: 47379824, role: 'from', id: 'w47379824', dir: null },
                { type: 'node', ref: 17312837, role: 'via', id: 'n17312837' },
                { type: 'way', ref: 324297228, role: 'to', id: 'w324297228', dir: null },
                { type: 'way', ref: 324297229, role: 'incomplete', id: 'w324297229' }
              ])
            } else if (result.id === 'n293269032') {
              assert.deepEqual(result.memberOf, [
                { id: 'w47379824', sequence: 1, role: null }
              ])
            } else if (result.id === 'n17312837') {
              assert.deepEqual(result.memberOf, [
                { id: 'r276122', sequence: 1, role: 'via' },
                { id: 'w47379824', sequence: 3, role: null },
                { id: 'w324297228', sequence: 0, role: null },
                { id: 'w26738383', sequence: 12, role: null }
              ])
            } else if (result.id === 'w324297228') {
              assert.deepEqual(result.memberOf, [
                { id: 'r276122', sequence: 2, role: 'to', dir: null }
              ])
              assert.deepEqual(result.members, [
                { type: 'node', ref: 17312837, id: 'n17312837' },
                { type: 'node', ref: 1538937640, id: 'n1538937640' },
                { type: 'node', ref: 3310442552, id: 'n3310442552' }
              ])
            }
          },
          function (err) {
            assert.deepEqual(actual, expected)
            done()
          }
        )
      })
    })
  })

  describe('invalid Data URL', function () {
    it('load file', function (done) {
      overpassFrontend = new OverpassFrontend('data:invalid')
      overpassFrontend.once('load', () => {
        assert.fail('Should not call load')
      })
      overpassFrontend.once('error', (e) => {
        assert.equal(e.message, 'Error parsing data URL')
        done()
      })
    })
  })
})
