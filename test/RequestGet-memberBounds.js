var assert = require('assert')
var fs = require('fs')

var BoundingBox = require('boundingbox')

var removeNullEntries = require('../src/removeNullEntries')
var OverpassFrontend = require('../src/OverpassFrontend')

var conf = JSON.parse(fs.readFileSync('test/conf.json', 'utf8'));
if (!conf.generator) {
  console.error('Set correct "generator" string in test/conf.json!')
  process.exit(0)
}

var overpassFrontend = new OverpassFrontend(conf.url)

describe('RequestGet - with memberBounds', function () {
  it('Simple queries - routes with memberBounds', function (done) {
    var expected = [ 'r910885', 'r910886', 'r1306732', 'r1306733' ]
    var expectedMembers = [ 'n2293993867', 'n2293993991', 'w122580925', 'w220270696', 'w220270706', 'w220270709', 'n2293993859', 'w261111319', 'n2293993929', 'w220270708', 'w220270714', 'w220270713', 'w232881441', 'w232881263', 'w383292582' ]
    var found = []
    var foundMembers = []
    var error = ''
    var bbox = {
	"maxlat": 48.19953,
	"maxlon": 16.33506,
	"minlat": 48.19800,
	"minlon": 16.32581
    }

    overpassFrontend.get(
      expected,
      {
        "members": true,
        "properties": OverpassFrontend.TAGS | OverpassFrontend.MEMBERS,
        "memberProperties": OverpassFrontend.TAGS | OverpassFrontend.GEOM,
        "memberBounds": bbox,
        "memberCallback": function (err, result) {
          foundMembers.push(result.id)

          if (expectedMembers.indexOf(result.id) === -1) {
            error += 'Unexpected member result ' + result.id + '\n'
          }
        }
      },
      function (err, result) {
        found.push(result.id)

        if (expected.indexOf(result.id) === -1) {
          error += 'Unexpected result ' + result.id + '\n'
        }
      },
      function (err) {
        if (err) {
          return done(err)
        }

        if (error) {
          return done(error)
        }

        if (found.length !== expected.length) {
          return done('Wrong count of objects returned:\n' +
               'Expected: ' + expected.join(', ') + '\n' +
               'Found: ' + found.join(', '))
        }

        if (foundMembers.length !== expectedMembers.length) {
          return done('Wrong count of member objects returned:\n' +
               'Expected: ' + expectedMembers.join(', ') + '\n' +
               'Found: ' + foundMembers.join(', '))
        }

        done()
      }
    )
  })

  it('routes with GeoJSON memberBounds', function (done) {
    overpassFrontend.clearCache()
    var expected = [ 'r910885', 'r910886', 'r1306732', 'r1306733' ]
    var expectedMembers = [ 'w228707705', 'w228707687', 'w228707710' ]
    var found = []
    var foundMembers = []
    var error = ''
    var bbox = { "type": "Feature", "geometry": { "type": "Polygon", "coordinates": [ [ [ 16.340221166610718, 48.20076525069519 ], [ 16.340070962905884, 48.20283900184463 ], [ 16.336004734039307, 48.2021096230804 ], [ 16.340221166610718, 48.20076525069519 ] ] ] } }

    overpassFrontend.get(
      expected,
      {
        "members": true,
        "properties": OverpassFrontend.TAGS | OverpassFrontend.MEMBERS,
        "memberProperties": OverpassFrontend.TAGS | OverpassFrontend.GEOM,
        "memberBounds": bbox,
        "memberCallback": function (err, result) {
          foundMembers.push(result.id)

          if (expectedMembers.indexOf(result.id) === -1) {
            error += 'Unexpected member result ' + result.id + '\n'
          }
        }
      },
      function (err, result) {
        found.push(result.id)

        if (expected.indexOf(result.id) === -1) {
          error += 'Unexpected result ' + result.id + '\n'
        }
      },
      function (err) {
        if (err) {
          return done(err)
        }

        if (error) {
          return done(error)
        }

        if (found.length !== expected.length) {
          return done('Wrong count of objects returned:\n' +
               'Expected: ' + expected.join(', ') + '\n' +
               'Found: ' + found.join(', '))
        }

        if (foundMembers.length !== expectedMembers.length) {
          return done('Wrong count of member objects returned:\n' +
               'Expected: ' + expectedMembers.join(', ') + '\n' +
               'Found: ' + foundMembers.join(', '))
        }

        done()
      }
    )
  })
})
