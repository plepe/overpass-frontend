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

describe('Overpass BBoxQuery - Relation with members in BBOX', function() {
  it('Simple queries - routes', function (done) {
    var expected = [ 'r910885', 'r910886', 'r1306732', 'r1306733' ]
    var expectedMembers = [ 'n2293993991', 'n2293993859', 'n2293993867' , 'n2293993929', 'w122580925', 'w220270706', 'w220270708', 'w220270709', 'w220270714', 'w232881263', 'w232881441', 'w261111319', 'w220270696', 'w220270713', 'w383292582' ]
    var found = []
    var foundMembers = []
    var error = ''
    var bbox = {
	"maxlat": 48.19953,
	"maxlon": 16.33506,
	"minlat": 48.19800,
	"minlon": 16.32581,
      }

    var expectedSubRequestCount = 2
    var foundSubRequestCount = 0

    function compileListener (subRequest) {
      foundSubRequestCount++
    }

    var request = overpassFrontend.BBoxQuery(
      "relation[type=route][route=tram]",
      bbox,
      {
        "members": true,
        "properties": OverpassFrontend.TAGS | OverpassFrontend.MEMBERS,
        "memberProperties": OverpassFrontend.TAGS | OverpassFrontend.GEOM,
        "memberBounds": bbox,
        "memberCallback": function (err, result) {
          foundMembers.push(result.id)

          result.memberOf.forEach(memberOf => {
            if (found.indexOf(memberOf.id) === -1) {
              assert.fail('memberCallback for ' + result.id + ' called before featureCallback for ' + memberOf.id)
            }
          })

          if (expectedMembers.indexOf(result.id) === -1) {
            error += 'Unexpected member result ' + result.id + '\n'
          }
        }
      },
      function (err, result) {
        found.push(result.id)

        assert.equal(result.properties, OverpassFrontend.TAGS | OverpassFrontend.MEMBERS | OverpassFrontend.BBOX | OverpassFrontend.CENTER)

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

        assert.equal(foundSubRequestCount, expectedSubRequestCount, 'Wrong count of sub requests!')

        request.off('subrequest-compile', compileListener)

        done()
      }
    )

    request.on('subrequest-compile', compileListener)
  })

  it('Simple queries - routes (with empty cache)', function (done) {
    overpassFrontend.clearCache()
    var expected = [ 'r910885', 'r910886', 'r1306732', 'r1306733' ]
    var expectedMembers = [ 'n2293993991', 'n2293993859', 'n2293993867' , 'n2293993929', 'w122580925', 'w220270706', 'w220270708', 'w220270709', 'w220270714', 'w232881263', 'w232881441', 'w261111319', 'w220270696', 'w220270713', 'w383292582' ]
    var found = []
    var foundMembers = []
    var error = ''
    var bbox = {
	"maxlat": 48.19953,
	"maxlon": 16.33506,
	"minlat": 48.19800,
	"minlon": 16.32581,
      }

    var expectedSubRequestCount = 2
    var foundSubRequestCount = 0

    function compileListener (subRequest) {
      foundSubRequestCount++
    }

    var request = overpassFrontend.BBoxQuery(
      "relation[type=route][route=tram]",
      bbox,
      {
        "members": true,
        "properties": OverpassFrontend.TAGS | OverpassFrontend.MEMBERS,
        "memberProperties": OverpassFrontend.TAGS | OverpassFrontend.GEOM,
        "memberBounds": bbox,
        "memberCallback": function (err, result) {
          foundMembers.push(result.id)

          result.memberOf.forEach(memberOf => {
            if (found.indexOf(memberOf.id) === -1) {
              assert.fail('memberCallback for ' + result.id + ' called before featureCallback for ' + memberOf.id)
            }
          })

          if (expectedMembers.indexOf(result.id) === -1) {
            error += 'Unexpected member result ' + result.id + '\n'
          }
        }
      },
      function (err, result) {
        found.push(result.id)

        assert.equal(result.properties, OverpassFrontend.TAGS | OverpassFrontend.MEMBERS | OverpassFrontend.BBOX | OverpassFrontend.CENTER)

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

        assert.equal(foundSubRequestCount, expectedSubRequestCount, 'Wrong count of sub requests!')

        request.off('subrequest-compile', compileListener)

        done()
      })

      request.on('subrequest-compile', compileListener)
  })

  it('Simple queries - routes (fully cached)', function (done) {
    var expected = [ 'r910885', 'r910886', 'r1306732', 'r1306733' ]
    var expectedMembers = [ 'n2293993991', 'n2293993859', 'n2293993867' , 'n2293993929', 'w122580925', 'w220270706', 'w220270708', 'w220270709', 'w220270714', 'w232881263', 'w232881441', 'w261111319', 'w220270696', 'w220270713', 'w383292582' ]
    var found = []
    var foundMembers = []
    var error = ''
    var bbox = {
	"maxlat": 48.19953,
	"maxlon": 16.33506,
	"minlat": 48.19800,
	"minlon": 16.32581,
      }

    var expectedSubRequestCount = 0
    var foundSubRequestCount = 0

    function compileListener (subRequest) {
      foundSubRequestCount++
    }

    var request = overpassFrontend.BBoxQuery(
      "relation[type=route][route=tram]",
      bbox,
      {
        "members": true,
        "properties": OverpassFrontend.TAGS | OverpassFrontend.MEMBERS,
        "memberProperties": OverpassFrontend.TAGS | OverpassFrontend.GEOM,
        "memberBounds": bbox,
        "memberCallback": function (err, result) {
          foundMembers.push(result.id)

          result.memberOf.forEach(memberOf => {
            if (found.indexOf(memberOf.id) === -1) {
              assert.fail('memberCallback for ' + result.id + ' called before featureCallback for ' + memberOf.id)
            }
          })

          if (expectedMembers.indexOf(result.id) === -1) {
            error += 'Unexpected member result ' + result.id + '\n'
          }
        }
      },
      function (err, result) {
        found.push(result.id)

        assert.equal(result.properties, OverpassFrontend.TAGS | OverpassFrontend.MEMBERS | OverpassFrontend.BBOX | OverpassFrontend.CENTER)

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

        request.off('subrequest-compile', compileListener)

        done()
      }
    )

    request.on('subrequest-compile', compileListener)
  })

  it('Simple queries - routes with different area', function (done) {
    var expected = [ 'r1306732', 'r1306733' ]
    var expectedMembers = [ 'w232881441', 'w383292582', 'n2411909898', 'n2411911256' ]
    var found = []
    var foundMembers = []
    var error = ''
    var bbox = {
        "maxlat": 48.20400,
        "maxlon": 16.33106,
        "minlat": 48.19940,
        "minlon": 16.32281,
      }

    var expectedSubRequestCount = 1
    var foundSubRequestCount = 0

    function compileListener (subRequest) {
      foundSubRequestCount++
    }

    var request = overpassFrontend.BBoxQuery(
      "relation[type=route][route=tram]",
      bbox,
      {
        "members": true,
        "properties": OverpassFrontend.TAGS | OverpassFrontend.MEMBERS,
        "memberProperties": OverpassFrontend.TAGS | OverpassFrontend.GEOM,
        "memberBounds": bbox,
        "memberCallback": function (err, result) {
          foundMembers.push(result.id)

          result.memberOf.forEach(memberOf => {
            if (found.indexOf(memberOf.id) === -1) {
              assert.fail('memberCallback for ' + result.id + ' called before featureCallback for ' + memberOf.id)
            }
          })

          if (expectedMembers.indexOf(result.id) === -1) {
            error += 'Unexpected member result ' + result.id + '\n'
          }
        }
      },
      function (err, result) {
        found.push(result.id)

        assert.equal(result.properties, OverpassFrontend.TAGS | OverpassFrontend.MEMBERS | OverpassFrontend.BBOX | OverpassFrontend.CENTER)

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

        assert.equal(foundSubRequestCount, expectedSubRequestCount, 'Wrong count of sub requests!')

        request.off('subrequest-compile', compileListener)

        done()
      }
    )

    request.on('subrequest-compile', compileListener)
  })

  it('Simple queries - routes with different area', function (done) {
    var expected = [ 'r1306732', 'r1306733' ]
    var expectedMembers = [ 'w232881441', 'w383292582' ]
    var found = []
    var foundMembers = []
    var error = ''
    var bbox = {
        "maxlat": 48.19980,
        "maxlon": 16.33106,
        "minlat": 48.19940,
        "minlon": 16.32281,
      }

    var expectedSubRequestCount = 1 // 0!
    var foundSubRequestCount = 0

    function compileListener (subRequest) {
      console.log(subRequest.query)
      foundSubRequestCount++
    }

    var request = overpassFrontend.BBoxQuery(
      "relation[type=route][route=tram]",
      bbox,
      {
        "members": true,
        "properties": OverpassFrontend.TAGS | OverpassFrontend.MEMBERS,
        "memberProperties": OverpassFrontend.TAGS | OverpassFrontend.GEOM,
        "memberBounds": bbox,
        "memberCallback": function (err, result) {
          foundMembers.push(result.id)

          result.memberOf.forEach(memberOf => {
            if (found.indexOf(memberOf.id) === -1) {
              assert.fail('memberCallback for ' + result.id + ' called before featureCallback for ' + memberOf.id)
            }
          })

          if (expectedMembers.indexOf(result.id) === -1) {
            error += 'Unexpected member result ' + result.id + '\n'
          }
        }
      },
      function (err, result) {
        found.push(result.id)

        assert.equal(result.properties, OverpassFrontend.TAGS | OverpassFrontend.MEMBERS | OverpassFrontend.BBOX | OverpassFrontend.CENTER)

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

        assert.equal(foundSubRequestCount, expectedSubRequestCount, 'Wrong count of sub requests!')

        request.off('subrequest-compile', compileListener)

        done()
      }
    )

    request.on('subrequest-compile', compileListener)
  })

  it('Simple queries - routes with different area (and more routes)', function (done) {
    var expected = [ 'r1306732', 'r1306733', 'r1809913', 'r1990861', 'r1809912', 'r1990860', 'r2005432' ]
    var expectedMembers = [ 'n287235515', 'n2208875393', 'w210599976', 'w125586446', 'w141233631', 'w210848994', 'w26231340', 'w26231341', 'w88093287', 'w146678761', 'w146678770', 'w235999782', 'w236000375', 'w236000518' ]
    var found = []
    var foundMembers = []
    var error = ''
    var bbox = {
        "maxlat": 48.19900,
        "maxlon": 16.34025,
        "minlat": 48.19698,
        "minlon": 16.33791
      }

    var expectedSubRequestCount = 2
    var foundSubRequestCount = 0

    function compileListener (subRequest) {
      foundSubRequestCount++
    }

    var request = overpassFrontend.BBoxQuery(
      "relation[type=route][route=tram]",
      bbox,
      {
        "members": true,
        "properties": OverpassFrontend.TAGS | OverpassFrontend.MEMBERS,
        "memberProperties": OverpassFrontend.TAGS | OverpassFrontend.GEOM,
        "memberBounds": bbox,
        "memberCallback": function (err, result) {
          foundMembers.push(result.id)

          result.memberOf.forEach(memberOf => {
            if (found.indexOf(memberOf.id) === -1) {
              assert.fail('memberCallback for ' + result.id + ' called before featureCallback for ' + memberOf.id)
            }
          })

          if (expectedMembers.indexOf(result.id) === -1) {
            error += 'Unexpected member result ' + result.id + '\n'
          }
        }
      },
      function (err, result) {
        found.push(result.id)

        assert.equal(result.properties, OverpassFrontend.TAGS | OverpassFrontend.MEMBERS | OverpassFrontend.BBOX | OverpassFrontend.CENTER)

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

        assert.equal(foundSubRequestCount, expectedSubRequestCount, 'Wrong count of sub requests!')

        request.off('subrequest-compile', compileListener)

        done()
      }
    )

    request.on('subrequest-compile', compileListener)
  })

  it('Simple queries - routes with split', function (done) {
    overpassFrontend.clearBBoxQuery("relation[type=route][route=tram]")
    var expected = [ 'r910885', 'r910886', 'r1306732', 'r1306733' ]
    var expectedMembers = [ 'n2293993991', 'n2293993859', 'n2293993867' , 'n2293993929', 'w122580925', 'w220270706', 'w220270708', 'w220270709', 'w220270714', 'w232881263', 'w232881441', 'w261111319', 'w220270696', 'w220270713', 'w383292582' ]
    var found = []
    var foundMembers = []
    var error = ''
    var bbox = {
	"maxlat": 48.19953,
	"maxlon": 16.33506,
	"minlat": 48.19800,
	"minlon": 16.32581,
      }

    var expectedSubRequestCount = 1
    var foundSubRequestCount = 0

    function compileListener (subRequest) {
      foundSubRequestCount++
    }

    var request = overpassFrontend.BBoxQuery(
      "relation[type=route][route=tram]",
      bbox,
      {
        "members": true,
        "properties": OverpassFrontend.TAGS | OverpassFrontend.MEMBERS,
        "memberProperties": OverpassFrontend.TAGS | OverpassFrontend.GEOM,
        "memberBounds": bbox,
        "split": 1,
        "memberCallback": function (err, result) {
          foundMembers.push(result.id)

          result.memberOf.forEach(memberOf => {
            if (found.indexOf(memberOf.id) === -1) {
              assert.fail('memberCallback for ' + result.id + ' called before featureCallback for ' + memberOf.id)
            }
          })

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

        assert.equal(foundSubRequestCount, expectedSubRequestCount, 'Wrong count of sub requests!')

        request.off('subrequest-compile', compileListener)

        done()
      }
    )

    request.on('subrequest-compile', compileListener)
  })

  it('Simple queries - routes with memberSplit', function (done) {
    overpassFrontend.clearBBoxQuery("relation[type=route][route=tram]")
    var expected = [ 'r910885', 'r910886', 'r1306732', 'r1306733' ]
    var expectedMembers = [ 'n2293993991', 'n2293993859', 'n2293993867' , 'n2293993929', 'w122580925', 'w220270706', 'w220270708', 'w220270709', 'w220270714', 'w232881263', 'w232881441', 'w261111319', 'w220270696', 'w220270713', 'w383292582' ]
    var found = []
    var foundMembers = []
    var error = ''
    var bbox = {
	"maxlat": 48.19953,
	"maxlon": 16.33506,
	"minlat": 48.19800,
	"minlon": 16.32581,
      }

    var expectedSubRequestCount = 1
    var foundSubRequestCount = 0

    function compileListener (subRequest) {
      foundSubRequestCount++
    }

    var request = overpassFrontend.BBoxQuery(
      "relation[type=route][route=tram]",
      bbox,
      {
        "members": true,
        "properties": OverpassFrontend.TAGS | OverpassFrontend.MEMBERS,
        "memberProperties": OverpassFrontend.TAGS | OverpassFrontend.GEOM,
        "memberSplit": 5,
        "memberBounds": bbox,
        "memberCallback": function (err, result) {
          foundMembers.push(result.id)

          result.memberOf.forEach(memberOf => {
            if (found.indexOf(memberOf.id) === -1) {
              assert.fail('memberCallback for ' + result.id + ' called before featureCallback for ' + memberOf.id)
            }
          })

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

        assert.equal(foundSubRequestCount, expectedSubRequestCount, 'Wrong count of sub requests!')

        request.off('subrequest-compile', compileListener)

        done()
      }
    )

    request.on('subrequest-compile', compileListener)
  })

  it('Simple queries - routes with split and memberSplit', function (done) {
    overpassFrontend.clearBBoxQuery("relation[type=route][route=tram]")
    var expected = [ 'r910885', 'r910886', 'r1306732', 'r1306733' ]
    var expectedMembers = [ 'n2293993991', 'n2293993859', 'n2293993867' , 'n2293993929', 'w122580925', 'w220270706', 'w220270708', 'w220270709', 'w220270714', 'w232881263', 'w232881441', 'w261111319', 'w220270696', 'w220270713', 'w383292582' ]
    var found = []
    var foundMembers = []
    var error = ''
    var bbox = {
	"maxlat": 48.19953,
	"maxlon": 16.33506,
	"minlat": 48.19800,
	"minlon": 16.32581,
      }

    var expectedSubRequestCount = 1
    var foundSubRequestCount = 0

    function compileListener (subRequest) {
      foundSubRequestCount++
    }

    var request = overpassFrontend.BBoxQuery(
      "relation[type=route][route=tram]",
      bbox,
      {
        "members": true,
        "properties": OverpassFrontend.TAGS | OverpassFrontend.MEMBERS,
        "memberProperties": OverpassFrontend.TAGS | OverpassFrontend.GEOM,
        "memberBounds": bbox,
        "split": 1,
        "memberSplit": 5,
        "memberCallback": function (err, result) {
          foundMembers.push(result.id)

          result.memberOf.forEach(memberOf => {
            if (found.indexOf(memberOf.id) === -1) {
              assert.fail('memberCallback for ' + result.id + ' called before featureCallback for ' + memberOf.id)
            }
          })

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

        assert.equal(foundSubRequestCount, expectedSubRequestCount, 'Wrong count of sub requests!')

        request.off('subrequest-compile', compileListener)

        done()
      }
    )

    request.on('subrequest-compile', compileListener)
  })

  it('Simple queries - routes without members to fill cache', function (done) {
    overpassFrontend.clearBBoxQuery("relation[type=route][route=tram]")
    var expected = [ 'r910885', 'r910886', 'r1306732', 'r1306733' ]
    var found = []
    var error = ''
    var bbox = {
	"maxlat": 48.19953,
	"maxlon": 16.33506,
	"minlat": 48.19800,
	"minlon": 16.32581,
      }

    var expectedSubRequestCount = 0
    var foundSubRequestCount = 0

    function compileListener (subRequest) {
      foundSubRequestCount++
    }

    var request = overpassFrontend.BBoxQuery(
      "relation[type=route][route=tram]",
      bbox,
      {
        "properties": OverpassFrontend.TAGS | OverpassFrontend.MEMBERS,
        "memberBounds": bbox
      },
      function (err, result) {
        found.push(result.id)

        assert.equal(result.properties, OverpassFrontend.TAGS | OverpassFrontend.MEMBERS | OverpassFrontend.BBOX | OverpassFrontend.CENTER)

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

        assert.equal(foundSubRequestCount, expectedSubRequestCount, 'Wrong count of sub requests!')

        request.off('subrequest-compile', compileListener)

        done()
      }
    )

    request.on('subrequest-compile', compileListener)
  })

  it('Simple queries - routes with members after cache for parents full', function (done) {
    var expected = [ 'r910885', 'r910886', 'r1306732', 'r1306733' ]
    var expectedMembers = [ 'n2293993991', 'n2293993859', 'n2293993867' , 'n2293993929', 'w122580925', 'w220270706', 'w220270708', 'w220270709', 'w220270714', 'w232881263', 'w232881441', 'w261111319', 'w220270696', 'w220270713', 'w383292582' ]
    var found = []
    var foundMembers = []
    var error = ''
    var bbox = {
	"maxlat": 48.19953,
	"maxlon": 16.33506,
	"minlat": 48.19800,
	"minlon": 16.32581,
      }

    var expectedSubRequestCount = 1
    var foundSubRequestCount = 0

    function compileListener (subRequest) {
      foundSubRequestCount++
    }

    var request = overpassFrontend.BBoxQuery(
      "relation[type=route][route=tram]",
      bbox,
      {
        "members": true,
        "properties": OverpassFrontend.TAGS | OverpassFrontend.MEMBERS,
        "memberProperties": OverpassFrontend.TAGS | OverpassFrontend.GEOM,
        "memberBounds": bbox,
        "memberCallback": function (err, result) {
          foundMembers.push(result.id)

          result.memberOf.forEach(memberOf => {
            if (found.indexOf(memberOf.id) === -1) {
              assert.fail('memberCallback for ' + result.id + ' called before featureCallback for ' + memberOf.id)
            }
          })

          if (expectedMembers.indexOf(result.id) === -1) {
            error += 'Unexpected member result ' + result.id + '\n'
          }
        }
      },
      function (err, result) {
        found.push(result.id)

        assert.equal(result.properties, OverpassFrontend.TAGS | OverpassFrontend.MEMBERS | OverpassFrontend.BBOX | OverpassFrontend.CENTER)

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

        assert.equal(foundSubRequestCount, expectedSubRequestCount, 'Wrong count of sub requests!')

        request.off('subrequest-compile', compileListener)

        done()
      }
    )

    request.on('subrequest-compile', compileListener)
  })

  it('Simple queries - routes with members - default properties', function (done) {
    overpassFrontend.clearBBoxQuery("relation[type=route][route=tram]")
    overpassFrontend.removeFromCache('r910885')
    overpassFrontend.removeFromCache('n2293993991')
    overpassFrontend.removeFromCache('w220270696')
    var expected = [ 'r910885', 'r910886', 'r1306732', 'r1306733' ]
    var expectedMembers = [ 'n2293993991', 'n2293993859', 'n2293993867' , 'n2293993929', 'w122580925', 'w220270706', 'w220270708', 'w220270709', 'w220270714', 'w232881263', 'w232881441', 'w261111319', 'w220270696', 'w220270713', 'w383292582' ]
    var found = []
    var foundMembers = []
    var error = ''
    var bbox = {
	"maxlat": 48.19953,
	"maxlon": 16.33506,
	"minlat": 48.19800,
	"minlon": 16.32581,
      }

    var expectedSubRequestCount = 2
    var foundSubRequestCount = 0

    function compileListener (subRequest) {
      foundSubRequestCount++
    }

    var request = overpassFrontend.BBoxQuery(
      "relation[type=route][route=tram]",
      bbox,
      {
        "members": true,
        "memberBounds": bbox,
        "memberCallback": function (err, result) {
          foundMembers.push(result.id)

          if (expectedMembers.indexOf(result.id) === -1) {
            error += 'Unexpected member result ' + result.id + '\n'
          }

// TODO: when removing objects from cache remove memberOf references
//          result.memberOf.forEach(memberOf => {
//            if (found.indexOf(memberOf.id) === -1) {
//              assert.fail('memberCallback for ' + result.id + ' called before featureCallback for ' + memberOf.id)
//            }
//          })

          assert.equal(OverpassFrontend.DEFAULT, result.properties&OverpassFrontend.DEFAULT)
        }
      },
      function (err, result) {
        found.push(result.id)

        assert.equal(result.properties, OverpassFrontend.TAGS | OverpassFrontend.MEMBERS | OverpassFrontend.BBOX | OverpassFrontend.CENTER)

        if (expected.indexOf(result.id) === -1) {
          error += 'Unexpected result ' + result.id + '\n'
        }

        assert.equal(OverpassFrontend.DEFAULT, result.properties&OverpassFrontend.DEFAULT)
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

        assert.equal(foundSubRequestCount, expectedSubRequestCount, 'Wrong count of sub requests!')

        request.off('subrequest-compile', compileListener)

        done()
      }
    )

    request.on('subrequest-compile', compileListener)
  })

  it('Simple queries - without memberBounds', function (done) {
    var expected = [ 'r910885', 'r910886', 'r1306732', 'r1306733' ]
    var expectedMembers = [ 'n2293993867', 'w122580925', 'w220270706', 'w220270709', 'n2293993859', 'w261111319', 'n2293993929', 'n79721398', 'w220270708', 'w220270714', 'w220270713', 'n2411911256', 'w232881441', 'n2411909898', 'w232881263', 'w383292582', 'n2510471036', 'n2510471049', 'n2510471146', 'n2510471157', 'n2510471164', 'n2510471174', 'n2510471090', 'n2510471122', 'n2509620147', 'n2510471103', 'n2293993855', 'n2293993868', 'n2293993991', 'n287235515', 'n430450310', 'n430450314', 'n2711859002', 'n647991', 'n2705819745', 'n1100482424', 'n1321314195', 'n4076152498', 'n4076152499', 'n2288199701', 'n2288199703', 'n2329827456', 'n2331960742', 'n2293993866', 'n2293994066', 'n2285911704', 'n2285911663', 'n2285911667', 'n2285911665', 'n2285911692', 'n2285911702', 'n1546106141', 'n1546106157', 'n2223156317', 'n2285945342', 'n2423365127', 'n473167212', 'n1630416816', 'n2216507460', 'n2216530088', 'n1394529428', 'n2293993848', 'n2293994095', 'n2287963578', 'n2293993846', 'n2293994047', 'n2287963583', 'n2296833061', 'n2296833110', 'n276171350', 'n2211384239', 'n2296833085', 'n2296833114', 'n2296833122', 'n2296833143', 'n2407351716', 'n2407351717', 'n2407231833', 'n2407231834', 'n2407325778', 'n252511595', 'n253233651', 'n2292452224', 'n2411950477', 'n269541925', 'n2407260774', 'n2407325779', 'n60676388', 'w219680833', 'w265532169', 'w122580876', 'w122580924', 'w141233631', 'w210848994', 'w26231341', 'w88093287', 'w146678770', 'w236000518', 'w25585625', 'w27999826', 'w27999830', 'w58993078', 'w58993079', 'w140549303', 'w140549310', 'w264935316', 'w264935317', 'w264935318', 'w265532639', 'w358479330', 'w25585623', 'w25585675', 'w25585676', 'w235853811', 'w235853813', 'w251163470', 'w251163471', 'w265532171', 'w243573842', 'w25585622', 'w243575581', 'w140994821', 'w140994822', 'w217210755', 'w217210756', 'w220270704', 'w220270712', 'w122504890', 'w122504891', 'w263674444', 'w219430764', 'w219431980', 'w220270696', 'w383292589', 'w263674442', 'w5004103', 'w26617432', 'w26617436', 'w30090106', 'w30090108', 'w138647474', 'w141233626', 'w141233628', 'w141233629', 'w148759704', 'w212471618', 'w219431979', 'w228788310', 'w228788312', 'w229818937', 'w141233627', 'w146985784', 'w232385437', 'w232385442', 'w20447121', 'w148759701', 'w211680460', 'w211680461', 'w211682606', 'w211685484', 'w232385434', 'w232385435', 'w232385436', 'w244147727', 'w244148096', 'w244148097', 'w24877453', 'w25585539', 'w125586439', 'w220270694', 'w220270705', 'w228707690', 'w228707696', 'w243704616', 'w243705593', 'w228707705', 'w228707706', 'w219652645', 'w228707687', 'w228707710', 'w243702669', 'w146836190', 'w243702668', 'w251518413', 'w251518415', 'w122729040', 'w122729041', 'w219652646', 'w239913341', 'w251518411', 'w251518414', 'w251518416', 'w384007076', 'w384007077', 'w384007078', 'w384007079', 'w25585540', 'w139442068', 'w239913340', 'w251518410', 'w251518412', 'w384007081', 'w180696708', 'w232385441', 'w383292593', 'w383292591', 'w232372749', 'w232372750', 'w232381392', 'w232382707', 'w232382712', 'w380821195', 'w220063906', 'w232382706', 'w232382709', 'w250584757', 'w380935815', 'w23320744', 'w220063909', 'w220063912', 'w232884024', 'w232884025', 'w232884028', 'w232884029', 'w232884030', 'w232884207', 'w232884208', 'w380598626', 'w380598640', 'w175441902', 'w180696709', 'w232381393', 'w232382708', 'w232382710', 'w25452759', 'w25498434', 'w25498436', 'w47800671', 'w58993077', 'w263063495', 'w417105647' ]
    var found = []
    var foundObjs = {}
    var foundMembers = []
    var error = ''
    var bbox = {
	"maxlat": 48.19953,
	"maxlon": 16.33506,
	"minlat": 48.19800,
	"minlon": 16.32581,
      }

    var expectedSubRequestCount = 1
    var foundSubRequestCount = 0

    function compileListener (subRequest) {
      foundSubRequestCount++
    }

    var request = overpassFrontend.BBoxQuery(
      "relation[type=route][route=tram]",
      bbox,
      {
        "members": true,
        "properties": OverpassFrontend.TAGS | OverpassFrontend.MEMBERS,
        "memberProperties": OverpassFrontend.TAGS | OverpassFrontend.GEOM,
        "memberCallback": function (err, result) {
          foundMembers.push(result.id)

          result.memberOf.forEach(memberOf => {
            let relId = memberOf.id
            if (expected.indexOf(relId) !== -1 && found.indexOf(relId) === -1) {
              assert.fail('memberCallback for ' + result.id + ' called before featureCallback for ' + memberOf.id)
            }
          })

          if (expectedMembers.indexOf(result.id) === -1) {
            error += 'Unexpected member result ' + result.id + '\n'
          }
        }
      },
      function (err, result) {
        found.push(result.id)
        foundObjs[result.id] = result

        assert.equal(result.properties, OverpassFrontend.TAGS | OverpassFrontend.MEMBERS | OverpassFrontend.BBOX | OverpassFrontend.CENTER)

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

        for (var i in foundObjs) {
          let ob = foundObjs[i]
          assert.equal(ob.properties, OverpassFrontend.TAGS | OverpassFrontend.MEMBERS | OverpassFrontend.BBOX | OverpassFrontend.GEOM | OverpassFrontend.CENTER, 'After loading all members, relations should have GEOM known')
        }

        assert.equal(foundSubRequestCount, expectedSubRequestCount, 'Wrong count of sub requests!')

        request.off('subrequest-compile', compileListener)

        done()
      }
    )

    request.on('subrequest-compile', compileListener)
  })

  it('memberBounds GeoJSON', function (done) {
    overpassFrontend.clearCache()
    var expected = [ 'r910885', 'r910886', 'r1306732', 'r1306733' ]
    var expectedMembers = [ 'w228707705', 'w228707687', 'w228707710' ]
    var found = []
    var foundMembers = []
    var error = ''
    var bbox = {
	"maxlat": 48.19953,
	"maxlon": 16.33506,
	"minlat": 48.19800,
	"minlon": 16.32581,
      }
    var memberBounds = { "type": "Feature", "geometry": { "type": "Polygon", "coordinates": [ [ [ 16.340221166610718, 48.20076525069519 ], [ 16.340070962905884, 48.20283900184463 ], [ 16.336004734039307, 48.2021096230804 ], [ 16.340221166610718, 48.20076525069519 ] ] ] } }

    var expectedSubRequestCount = 2
    var foundSubRequestCount = 0

    function compileListener (subRequest) {
      foundSubRequestCount++
    }

    var request = overpassFrontend.BBoxQuery(
      "relation[type=route][route=tram]",
      bbox,
      {
        "members": true,
        "properties": OverpassFrontend.TAGS | OverpassFrontend.MEMBERS,
        "memberProperties": OverpassFrontend.TAGS | OverpassFrontend.GEOM,
        "memberBounds": memberBounds,
        "memberCallback": function (err, result) {
          foundMembers.push(result.id)

          result.memberOf.forEach(memberOf => {
            if (found.indexOf(memberOf.id) === -1) {
              assert.fail('memberCallback for ' + result.id + ' called before featureCallback for ' + memberOf.id)
            }
          })

          if (expectedMembers.indexOf(result.id) === -1) {
            error += 'Unexpected member result ' + result.id + '\n'
          }
        }
      },
      function (err, result) {
        found.push(result.id)

        assert.equal(result.properties, OverpassFrontend.TAGS | OverpassFrontend.MEMBERS | OverpassFrontend.BBOX | OverpassFrontend.CENTER)

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

        assert.equal(foundSubRequestCount, expectedSubRequestCount, 'Wrong count of sub requests!')

        request.off('subrequest-compile', compileListener)

        done()
      }
    )

    request.on('subrequest-compile', compileListener)
  })

  describe('Calculate way directions', function () {
    it('Simple queries - routes with members - calculate directions', function (done) {
      overpassFrontend.clearCache()
      var expected = [ 'r910885', 'r910886', 'r1306732', 'r1306733' ]
      var expectedMemberMemberOf = {
        "n2293993991": [{"id":"r910885","role":"stop","sequence":12},{"id":"r1306733","role":"stop","sequence":4},{"id":"w220270706","role":null,"sequence":1}],
        "n2293993859": [{"id":"r910886","role":"stop","sequence":19},{"id":"r1306732","role":"stop","sequence":22},{"id":"w220270714","role":null,"sequence":1}],
        "n2293993867": [{"id":"r910885","role":"stop","sequence":11},{"id":"r1306733","role":"stop","sequence":3},{"id":"w220270696","role":null,"sequence":7}],
        "n2293993929": [{"id":"r910886","role":"stop","sequence":21},{"id":"r1306732","role":"stop","sequence":24},{"id":"w220270713","role":null,"sequence":2}],
        "w122580925": [{"id":"r910885","role":"platform","sequence":13,"dir":null},{"id":"r1306733","role":"platform","sequence":5,"dir":null}],
        "w220270706": [{"id":"r910885","role":"","sequence":50,"dir":"forward","connectedPrev":"forward","connectedNext":"forward"},{"id":"r1306733","role":"","sequence":31,"dir":"forward","connectedPrev":"forward","connectedNext":"forward"}],
        "w220270708": [{"id":"r910886","role":"","sequence":47,"dir":"forward","connectedNext":"forward"}],
        "w220270709": [{"id":"r910885","role":"","sequence":51,"dir":"forward","connectedPrev":"forward"}],
        "w220270714": [{"id":"r910886","role":"","sequence":48,"dir":"forward","connectedPrev":"forward","connectedNext":"forward"},{"id":"r1306732","role":"","sequence":60,"dir":"forward","connectedPrev":"forward","connectedNext":"forward"}],
        "w232881263": [{"id":"r1306733","role":"","sequence":32,"dir":"backward","connectedPrev":"backward","connectedNext":"backward"}],
        "w232881441": [{"id":"r1306732","role":"","sequence":59,"dir":"forward","connectedNext":"forward"}],
        "w261111319": [{"id":"r910886","role":"platform","sequence":20,"dir":null},{"id":"r1306732","role":"platform","sequence":23,"dir":null}],
        "w220270696": [{"id":"r910885","role":"","sequence":49,"dir":"forward","connectedNext":"forward"},{"id":"r1306733","role":"","sequence":30,"dir":"forward","connectedNext":"forward"}],
        "w220270713": [{"id":"r910886","role":"","sequence":49,"dir":"forward","connectedPrev":"forward"},{"id":"r1306732","role":"","sequence":61,"dir":"forward","connectedPrev":"forward"}],
        "w383292582": [{"id":"r1306733","role":"","sequence":33,"dir":"backward","connectedPrev":"backward"}]
      }
      var expectedMembers = Object.keys(expectedMemberMemberOf)
      var found = []
      var foundMembers = []
      var error = ''
      var bbox = {
          "maxlat": 48.19953,
          "maxlon": 16.33506,
          "minlat": 48.19800,
          "minlon": 16.32581,
        }

      var expectedSubRequestCount = 2
      var foundSubRequestCount = 0
      var isDone = false

      function compileListener (subRequest) {
        foundSubRequestCount++
      }

      var request = overpassFrontend.BBoxQuery(
        "relation[type=route][route=tram]",
        bbox,
        {
          "members": true,
          "memberBounds": bbox,
          "memberProperties": OverpassFrontend.MEMBERS|OverpassFrontend.GEOM,
          "memberCallback": function (err, result) {
            foundMembers.push(result.id)

            if (expectedMembers.indexOf(result.id) === -1) {
              error += 'Unexpected member result ' + result.id + '\n'
            }

            assert.deepEqual(expectedMemberMemberOf[result.id], result.memberOf, 'Member.memberOf for ' + result.id +' is wrong!')

            assert.equal(OverpassFrontend.MEMBERS, result.properties&OverpassFrontend.MEMBERS, 'Member should known about sub members (nodes)')

            assert.equal(false, isDone, 'Called memberCallback after finalCallback')
          }
        },
        function (err, result) {
          found.push(result.id)

          if (expected.indexOf(result.id) === -1) {
            error += 'Unexpected result ' + result.id + '\n'
          }

          assert.equal(OverpassFrontend.DEFAULT, result.properties&OverpassFrontend.DEFAULT)
        },
        function (err) {
          isDone = true
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

          assert.equal(foundSubRequestCount, expectedSubRequestCount, 'Wrong count of sub requests!')

          request.off('subrequest-compile', compileListener)

          done()
        }
      )

      request.on('subrequest-compile', compileListener)
    })

    it('Simple queries - routes with members - calculate directions (different area)', function (done) {
      var expected = [ 'r910885', 'r910886', 'r1306732', 'r1306733' ]
      var expectedMemberMemberOf = {
        "n2293993855": [{"id":"r910885","role":"stop","sequence":14},{"id":"w220270709","role":null,"sequence":25}],
        "n2293993868": [{"id":"r910886","role":"stop","sequence":17},{"id":"w220270708","role":null,"sequence":19}],
        "n2293993991": [{"id":"r910885","role":"stop","sequence":12},{"id":"r1306733","role":"stop","sequence":4},{"id":"w220270706","role":null,"sequence":1}],
        "n2293993859": [{"id":"r910886","role":"stop","sequence":19},{"id":"r1306732","role":"stop","sequence":22},{"id":"w220270714","role":null,"sequence":1}],
        "n2293993929": [{"id":"r910886","role":"stop","sequence":21},{"id":"r1306732","role":"stop","sequence":24},{"id":"w220270713","role":null,"sequence":2}],
        "w122580925": [{"id":"r910885","role":"platform","sequence":13,"dir":null},{"id":"r1306733","role":"platform","sequence":5,"dir":null}],
        "w220270706": [{"id":"r910885","role":"","sequence":50,"dir":"forward","connectedPrev":"forward","connectedNext":"forward"},{"id":"r1306733","role":"","sequence":31,"dir":"forward","connectedPrev":"forward","connectedNext":"forward"}],
        "w220270708": [{"id":"r910886","role":"","sequence":47,"dir":"forward","connectedNext":"forward"}],
        "w220270709": [{"id":"r910885","role":"","sequence":51,"dir":"forward","connectedPrev":"forward"}],
        "w220270714": [{"id":"r910886","role":"","sequence":48,"dir":"forward","connectedPrev":"forward","connectedNext":"forward"},{"id":"r1306732","role":"","sequence":60,"dir":"forward","connectedPrev":"forward","connectedNext":"forward"}],
        "w232881263": [{"id":"r1306733","role":"","sequence":32,"dir":"backward","connectedPrev":"backward","connectedNext":"backward"}],
        "w232881441": [{"id":"r1306732","role":"","sequence":59,"dir":"forward","connectedNext":"forward"}],
        "w261111319": [{"id":"r910886","role":"platform","sequence":20,"dir":null},{"id":"r1306732","role":"platform","sequence":23,"dir":null}],
        "w122580876": [{"id":"r910886","role":"platform","sequence":18,"dir":null}],
        "w122580924": [{"id":"r910885","role":"platform","sequence":15,"dir":null}],
        "w220270696": [{"id":"r910885","role":"","sequence":49,"dir":"forward","connectedNext":"forward"},{"id":"r1306733","role":"","sequence":30,"dir":"forward","connectedNext":"forward"}],
        "w220270713": [{"id":"r910886","role":"","sequence":49,"dir":"forward","connectedPrev":"forward"},{"id":"r1306732","role":"","sequence":61,"dir":"forward","connectedPrev":"forward"}],
        "w383292582": [{"id":"r1306733","role":"","sequence":33,"dir":"backward","connectedPrev":"backward"}]
      }
      var expectedMembers = Object.keys(expectedMemberMemberOf)
      var found = []
      var foundMembers = []
      var error = ''
      var bbox = {
          "maxlat": 48.2013,
          "maxlon": 16.3325,
          "minlat": 48.1970,
          "minlon": 16.3240
        }

      var expectedSubRequestCount = 1
      var foundSubRequestCount = 0
      var isDone = false

      function compileListener (subRequest) {
        foundSubRequestCount++
      }

      var request = overpassFrontend.BBoxQuery(
        "relation[type=route][route=tram]",
        bbox,
        {
          "members": true,
          "memberBounds": bbox,
          "memberProperties": OverpassFrontend.MEMBERS|OverpassFrontend.GEOM,
          "memberCallback": function (err, result) {
            foundMembers.push(result.id)

            if (expectedMembers.indexOf(result.id) === -1) {
              error += 'Unexpected member result ' + result.id + '\n'
            }

            assert.deepEqual(expectedMemberMemberOf[result.id], result.memberOf, 'Member.memberOf for ' + result.id +' is wrong!')

            assert.equal(OverpassFrontend.MEMBERS, result.properties&OverpassFrontend.MEMBERS, 'Member should known about sub members (nodes)')
            assert.equal(false, isDone, 'Called memberCallback after finalCallback')
          }
        },
        function (err, result) {
          found.push(result.id)

          if (expected.indexOf(result.id) === -1) {
            error += 'Unexpected result ' + result.id + '\n'
          }

          assert.equal(OverpassFrontend.DEFAULT, result.properties&OverpassFrontend.DEFAULT)
        },
        function (err) {
          isDone = true
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

          assert.equal(foundSubRequestCount, expectedSubRequestCount, 'Wrong count of sub requests!')

          request.off('subrequest-compile', compileListener)

          done()
        }
      )

      request.on('subrequest-compile', compileListener)
    })

    it('Simple queries - routes with members - calculate directions (small known area)', function (done) {
      var expected = [ 'r910885', 'r910886' ]
      var expectedMemberMemberOf = {
        "n2293993855": [{"id":"r910885","role":"stop","sequence":14},{"id":"w220270709","role":null,"sequence":25}],
        "n2293993868": [{"id":"r910886","role":"stop","sequence":17},{"id":"w220270708","role":null,"sequence":19}],
        "w220270708": [{"id":"r910886","role":"","sequence":47,"dir":"forward","connectedNext":"forward"}],
        "w220270709": [{"id":"r910885","role":"","sequence":51,"dir":"forward","connectedPrev":"forward"}],
        "w122580876": [{"id":"r910886","role":"platform","sequence":18,"dir":null}],
        "w122580924": [{"id":"r910885","role":"platform","sequence":15,"dir":null}]
      }
      var expectedMembers = Object.keys(expectedMemberMemberOf)
      var found = []
      var foundMembers = []
      var error = ''
      var bbox = {
          "maxlat": 48.1984,
          "maxlon": 16.3272,
          "minlat": 48.1971,
          "minlon": 16.3240
        }

      var expectedSubRequestCount = 1 // TODO: 0
      var foundSubRequestCount = 0
      var isDone = false

      function compileListener (subRequest) {
        foundSubRequestCount++
      }

      var request = overpassFrontend.BBoxQuery(
        "relation[type=route][route=tram]",
        bbox,
        {
          "members": true,
          "memberBounds": bbox,
          "memberProperties": OverpassFrontend.MEMBERS|OverpassFrontend.GEOM,
          "memberCallback": function (err, result) {
            foundMembers.push(result.id)

            if (expectedMembers.indexOf(result.id) === -1) {
              error += 'Unexpected member result ' + result.id + '\n'
            }

            assert.deepEqual(expectedMemberMemberOf[result.id], result.memberOf, 'Member.memberOf for ' + result.id +' is wrong!')

            assert.equal(OverpassFrontend.MEMBERS, result.properties&OverpassFrontend.MEMBERS, 'Member should known about sub members (nodes)')

            assert.equal(false, isDone, 'Called memberCallback after finalCallback')
          }
        },
        function (err, result) {
          found.push(result.id)

          if (expected.indexOf(result.id) === -1) {
            error += 'Unexpected result ' + result.id + '\n'
          }

          assert.equal(OverpassFrontend.DEFAULT, result.properties&OverpassFrontend.DEFAULT)
        },
        function (err) {
          isDone = true
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

          assert.equal(foundSubRequestCount, expectedSubRequestCount, 'Wrong count of sub requests!')

          request.off('subrequest-compile', compileListener)

          done()
        }
      )

      request.on('subrequest-compile', compileListener)
    })

    it('Simple queries - routes with members - calculate directions (different area 2)', function (done) {
      var expected = [ 'r1306733', 'r1809913', 'r1990861', 'r1809912', 'r1990860', 'r1306732' ]
      var expectedMemberMemberOf = {
  "w141233631": [{"id":"r1306732","role":"","sequence":65,"dir":"forward","connectedPrev":"forward"},{"id":"r1809912","role":"","sequence":31,"dir":"forward","connectedPrev":"forward"},{"id":"r1990860","role":"","sequence":47,"dir":"forward","connectedPrev":"forward"}],
  "w210848994": [{"id":"r1306733","role":"","sequence":27,"dir":"forward","connectedNext":"forward"},{"id":"r1809913","role":"","sequence":57,"dir":"forward","connectedNext":"forward"},{"id":"r1990861","role":"","sequence":86,"dir":"forward","connectedNext":"forward"}],
  "w24877453": [{"id":"r1306732","role":"","sequence":64,"dir":"forward","connectedNext":"forward"},{"id":"r1809912","role":"","sequence":30,"dir":"forward","connectedNext":"forward"},{"id":"r1990860","role":"","sequence":46,"dir":"forward","connectedNext":"forward"}],
  "w26231338": [{"id":"r1809913","role":"","sequence":58,"dir":"forward","connectedPrev":"forward"},{"id":"r1990861","role":"","sequence":87,"dir":"forward","connectedPrev":"forward"}],
  "w125586439": [{"id":"r1306733","role":"","sequence":28,"dir":"forward","connectedPrev":"forward"}]
      }
      var expectedMembers = Object.keys(expectedMemberMemberOf)
      var found = []
      var foundMembers = []
      var error = ''
      var bbox = {
          "maxlat": 48.20016,
          "maxlon": 16.33829,
          "minlat": 48.19928,
          "minlon": 16.33727
        }

      var expectedSubRequestCount = 2
      var foundSubRequestCount = 0
      var isDone = false

      function compileListener (subRequest) {
        foundSubRequestCount++
      }

      var request = overpassFrontend.BBoxQuery(
        "relation[type=route][route=tram]",
        bbox,
        {
          "members": true,
          "memberBounds": bbox,
          "memberProperties": OverpassFrontend.MEMBERS|OverpassFrontend.GEOM,
          "memberCallback": function (err, result) {
            foundMembers.push(result.id)

            if (expectedMembers.indexOf(result.id) === -1) {
              error += 'Unexpected member result ' + result.id + '\n'
            }

            console.log(result.memberOf)
            assert.deepEqual(expectedMemberMemberOf[result.id], result.memberOf, 'Member.memberOf for ' + result.id +' is wrong!')

            assert.equal(OverpassFrontend.MEMBERS, result.properties&OverpassFrontend.MEMBERS, 'Member should known about sub members (nodes)')

            assert.equal(false, isDone, 'Called memberCallback after finalCallback')
          }
        },
        function (err, result) {
          found.push(result.id)

          if (expected.indexOf(result.id) === -1) {
            error += 'Unexpected result ' + result.id + '\n'
          }

          assert.equal(OverpassFrontend.DEFAULT, result.properties&OverpassFrontend.DEFAULT)
        },
        function (err) {
          isDone = true
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

          assert.equal(foundSubRequestCount, expectedSubRequestCount, 'Wrong count of sub requests!')

          request.off('subrequest-compile', compileListener)

          done()
        }
      )

      request.on('subrequest-compile', compileListener)
    })
  })

  describe('DB objects, which are referenced by Relation', function() {
    it('check that missing elements are in the cache after loading parent relation', function (done) {
      overpassFrontend.clearCache()

      overpassFrontend.get('r1306966',
        {
          properties: OverpassFrontend.MEMBERS
        },
        function(err, result, index) {
        },
        function(err) {
          assert.equal('n1476773069' in overpassFrontend.cacheElements, true, 'Member object should exist in cache')
          assert.equal('n1022300101' in overpassFrontend.cacheElements, true, 'Member object should exist in cache')

          done(err)
        })
    })

    it('load member object via id', function(done) {
      var finalCalled = 0
      var expectedSubRequestCount = 1
      var foundSubRequestCount = 0
      var expected = [ 'n1022300101' ]
      var expectedNullCount = 1
      var found = []
      var foundNullCount = 0

      function compileListener (subrequest) {
        foundSubRequestCount++
      }

      let request = overpassFrontend.get([ 'n1476773069', 'n1022300101' ],
        {
          properties: OverpassFrontend.ALL
        },
        function(err, result, index) {
          if (result === null) {
            foundNullCount++
          } else {
            assert.equal(expected.indexOf(result.id) === -1, false, 'Object ' + result.id + ' should not be found')
          }
        },
        function(err) {
          assert.equal(finalCalled++, 0, 'Final function called ' + finalCalled + ' times!')
          assert.equal(foundSubRequestCount, expectedSubRequestCount, 'Wrong count of sub requests!')
          assert.equal(foundNullCount, expectedNullCount, 'Wrong count of null objects')

          request.off('subrequest-compile', compileListener)
          done(err)
        })

      request.on('subrequest-compile', compileListener)
    })

    it('load member object via id (all cached)', function(done) {
      var finalCalled = 0
      var expectedSubRequestCount = 0
      var foundSubRequestCount = 0
      var expected = [ 'n1022300101' ]
      var expectedNullCount = 1
      var found = []
      var foundNullCount = 0

      function compileListener (subrequest) {
        foundSubRequestCount++
      }

      let request = overpassFrontend.get([ 'n1476773069', 'n1022300101' ],
        {
          properties: OverpassFrontend.ALL
        },
        function(err, result, index) {
          if (result === null) {
            foundNullCount++
          } else {
            assert.equal(expected.indexOf(result.id) === -1, false, 'Object ' + result.id + ' should not be found')
          }
        },
        function(err) {
          assert.equal(finalCalled++, 0, 'Final function called ' + finalCalled + ' times!')
          assert.equal(foundSubRequestCount, expectedSubRequestCount, 'Wrong count of sub requests!')
          assert.equal(foundNullCount, expectedNullCount, 'Wrong count of null objects')

          request.off('subrequest-compile', compileListener)
          done(err)
        })

      request.on('subrequest-compile', compileListener)
    })
  })

  describe('Check calling events on members', function (done) {
    let member
    let callCount = 0

    function updateCall () {
      callCount++
    }

    it('First request a member', function (done) {
      overpassFrontend.clearCache()

      var request = overpassFrontend.get(
        'w141233631',
        {
          properties: OverpassFrontend.ALL
        },
        (err, result) => {
          member = result
          member.on('update', updateCall)
        },
        done
      )
    })

    it('Now, request a relation', function (done) {
      var request = overpassFrontend.get(
        'r1990860',
        {
          properties: OverpassFrontend.MEMBERS | OverpassFrontend.TAGS
        },
        (err, result) => {
        },
        (err) => {
          assert.equal(callCount, 1)
          member.off('update', updateCall)
          done(err)
        }
      )
    })
  })
})


