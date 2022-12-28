var fs = require('fs')
var conf = JSON.parse(fs.readFileSync('test/conf.json', 'utf8'));

var assert = require('assert')
var async = require('async')

var OverpassFrontend = require('../src/OverpassFrontend')
var BoundingBox = require('boundingbox')
var overpassFrontend

const files = [
  {
    filename: 'invalid.osm',
    error: 'Error: SyntaxError: JSON.parse: unexpected character at line 1 column 1 of the JSON data'
  },
  {
    filename: 'invalid.osm.bz2',
    error: ''
  },
  {
    filename: 'invalid.json',
    error: ''
  },
  {
    filename: 'notexist.json',
    error: ''
  }
]

describe('Test errors when loading invalid files', function() {
  files.forEach(fileDef => {
    describe(fileDef.filename, function () {
      it('try to load file', function (done) {
        overpassFrontend = new OverpassFrontend('test/' + fileDef.filename)
        overpassFrontend.once('load', () => {
          assert.fail('Should not call load')
        })
        overpassFrontend.once('error', (e) => {
          assert.equal(e.message, fileDef.error)
          done()
        })
      })
    })
  })
})
