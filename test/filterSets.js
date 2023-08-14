var fs = require('fs')
var conf = JSON.parse(fs.readFileSync('test/conf.json', 'utf8'));

var assert = require('assert')
var async = require('async')

var OverpassFrontend = require('../src/OverpassFrontend')
const Filter = require('../src/Filter')
var BoundingBox = require('boundingbox')
var overpassFrontend

describe("Filter sets, compile", function () {
  it ('nwr[amenity]', function () {
    var f = new Filter('nwr[amenity]')

    assert.deepEqual(f.def, [
      {"op":"has_key","key":"amenity"},
    ])
    assert.equal(f.toString(), 'nwr["amenity"];')
    assert.equal(f.toQl(), 'nwr["amenity"];')
    var r = f.cacheDescriptors()
    assert.deepEqual(r, [ { id: 'nwr["amenity"](properties:1)' }])
  })
  it ('nwr[amenity]->.a;', function () {
    var f = new Filter('nwr[amenity]->.a;')

    assert.deepEqual(f.def,
      [
        {"op":"has_key","key":"amenity"},
        {"outputSet":"a"}
      ]
    )
    assert.equal(f.toString(), 'nwr["amenity"]->.a;')
    assert.equal(f.toQl(), 'nwr["amenity"]->.a;')
    var r = f.cacheDescriptors()
    assert.deepEqual(r, [ { id: 'nwr["amenity"](properties:1)' }])
  })
  it ('(nwr[amenity];)->.a;', function () {
    var f = new Filter('(nwr[amenity];)->.a;')

    assert.deepEqual(f.def, {
      or: [
        [ {"op":"has_key","key":"amenity"} ],
        {"outputSet":"a"}
      ]
    })
    assert.equal(f.toString(), '(nwr["amenity"];)->.a;')
    assert.equal(f.toQl(), '(nwr["amenity"];)->.a;')
    var r = f.cacheDescriptors()
    assert.deepEqual(r, [ { id: 'nwr["amenity"](properties:1)' } ])
  })
})

function test (options, callback) {
  const found = []
  let foundSubRequestCount = 0

  function compileListener (subrequest) {
    foundSubRequestCount++
  }

  const request = overpassFrontend.BBoxQuery(
    options.query,
    null,
    options.queryOptions || {},
    (err, ob) => {
      found.push(ob.id)
    },
    (err) => {
      if (err) {
        if (options.expectException) {
          assert.equal(err.message, options.expectException)
          return callback()
        }

        return callback(err)
      }

      assert.equal(request.filterQuery.toString(), options.expectedQuery || options.query + ';')
      const expected = (options.mode === 'via-server' ? options.expectedViaServer : options.expectedViaFile) || options.expected
      assert.deepEqual(found.sort(), expected.sort(), 'List of found objects wrong!')
      if (options.mode === 'via-server') {
        assert.equal(foundSubRequestCount, options.expectedSubRequestCount, 'Wrong count of sub requests!')
      }

      request.off('subrequest-compile', compileListener)
      callback()
    }
  )

  request.on('subrequest-compile', compileListener)

  if (request.filterQuery) {
    const cacheDescriptors = request.filterQuery.cacheDescriptors()
    if (options.expectedCacheDescriptors) {
      assert.deepEqual(cacheDescriptors, options.expectedCacheDescriptors, 'Expected cache info')
    }
    if ('expectedProperties' in options) {
      assert.equal(request.filterQuery.properties(), options.expectedProperties)
    }
  }

  return request
}
