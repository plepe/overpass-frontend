var fs = require('fs')
var conf = JSON.parse(fs.readFileSync('test/conf.json', 'utf8'));

var assert = require('assert')
var async = require('async')

var OverpassFrontend = require('../src/OverpassFrontend')
var BoundingBox = require('boundingbox')
var overpassFrontend

const files = [
  {
    filename: 'https://url.invalid/file.osm',
    error: [
      'NetworkError when attempting to fetch resource.',
      'fetch failed',
      'Failed to fetch'
    ]
  },
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
    error: 'Error parsing XML file: [xmldom error]	element parse error: Error: invalid attribute:</osm\n@#[line:undefined,col:undefined]'
  },
  {
    filename: 'invalid.osm.bz2',
    error: 'Error decoding bzip2 stream'
  },
  {
    filename: 'invalid.json',
    error: [
      'Error parsing JSON file: SyntaxError: Unexpected token } in JSON at position 275',
      'Error parsing JSON file: SyntaxError: JSON.parse: unexpected character at line 9 column 1 of the JSON data',
      'Error parsing JSON file: SyntaxError: Unexpected token \'}\', ..."lements":\n}\n" is not valid JSON'
    ]
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
              return done('Unexpected error message: ' + e.message)
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
