var fs = require('fs')
var conf = JSON.parse(fs.readFileSync('test/conf.json', 'utf8'));

var assert = require('assert')
var async = require('async')

var OverpassFrontend = require('../src/OverpassFrontend')
var BoundingBox = require('boundingbox')
var overpassFrontend

const files = [
  {
    filename: 'data:invalid',
    error: 'Error parsing data URL'
  },
  {
    filename: 'notexist.json',
    error: [
      'ENOENT: no such file or directory, open \'test/notexist.json\'',
      'Received error 404 (Not Found)'
    ]
  },
  {
    filename: 'invalid.osm',
    error: 'Error loading file with handler OSMXML: Error parsing XML file: [xmldom error]	element parse error: Error: invalid attribute:</osm\n@#[line:undefined,col:undefined]'
  },
  {
    filename: 'invalid.osm.bz2',
    error: 'Error decoding bzip2 stream'
  },
  {
    filename: 'invalid.osm.json',
    error: 'Error loading file with handler OSMJSON: Error parsing JSON file: Unexpected token \'}\', ..."lements":\n}\n" is not valid JSON'
  }
]

describe('Test errors when loading invalid files', function() {
  files.forEach(fileDef => {
    describe(fileDef.filename, function () {
      it('expect error when trying to load file', function (done) {
        overpassFrontend = new OverpassFrontend(fileDef.filename.match(/:/) ? fileDef.filename : 'test/' + fileDef.filename)
        overpassFrontend.once('load', () => {
          assert.fail('Should not call load')
        })
        overpassFrontend.once('error', (e) => {
          if (Array.isArray(fileDef.error)) {
            if (!fileDef.error.includes(e.message)) {
              assert.fail('Unexpected error message: ' + e.message)
            }
          } else {
            assert.equal(e.message, fileDef.error)
          }

          done()
        })
      })
    })
  })
})
