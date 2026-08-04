const fs = require('fs')
const conf = JSON.parse(fs.readFileSync('test/conf.json', 'utf8'));
const assert = require('assert').strict

const OverpassFrontend = require('..')

var overpassFrontend = new OverpassFrontend(conf.url)

const ids = [
  'r6412377',
  'r3237099'
]
const reverseGeometryOnFileLoad = [
  'r3237099'
]

/** Create new data files for parsing JSON/XML files with separate geometry
overpassFrontend.get(ids, {
    out: 'json',
    outOptions: 'geom separateGeometry',
  },
  (err, content) => {
    fs.writeFileSync('test/outSeparateGeometry.json', JSON.stringify(content, null, '  '))
  }
)
overpassFrontend.get(ids, {
    out: 'xml',
    outOptions: 'geom separateGeometry',
  },
  (err, content) => {
    fs.writeFileSync('test/outSeparateGeometry.xml', content)
  }
)
*/

describe('Overpass out of Relations with separate geometry as option', function () {
  ids.forEach(id => {
    it('json ' + id, function (done) {
      overpassFrontend.get(id, {
          out: 'json',
          outOptions: 'geom separateGeometry',
          each: (actual) => {
            // fs.writeFileSync('test/reference/' + id + '.json', JSON.stringify(actual, null, '  '))
            const reference = JSON.parse(fs.readFileSync('test/reference/' + id + '.json'))
            assert.deepEqual(actual, reference)
          }
        }, (err, list) => {
          if (err) {
            assert.fail('Should not fail with ' + err.message)
          }

          done()
        })
    })

    it('xml ' + id, function (done) {
      overpassFrontend.get(id, {
          out: 'xml',
          outOptions: 'geom separateGeometry',
          each: (actual) => {
            // fs.writeFileSync('test/reference/' + id + '.xml', actual)
            const reference = fs.readFileSync('test/reference/' + id + '.xml').toString()
            assert.deepEqual(actual, reference)
          }
        }, (err, list) => {
          if (err) {
            assert.fail('Should not fail with ' + err.message)
          }

          done()
        })
    })
  })
})

describe('Load data from JSON file with separated geometry', function () {
  let overpassFrontend

  it('load data', function (done) {
    overpassFrontend = new OverpassFrontend('test/outSeparateGeometry.json', {
      fileFormat: 'OSMJSON'
    })
    overpassFrontend.once('load', () => {
      reverseGeometryOnFileLoad.forEach(id => {
        overpassFrontend.cacheElements[id].geometry.geometry.coordinates.reverse()
      })

      done()
    })
  })

  ids.forEach(id => {
    it('json ' + id, function (done) {
      overpassFrontend.get(id, {
          out: 'json',
          outOptions: 'geom',
          each: (actual) => {
            const reference = JSON.parse(fs.readFileSync('test/reference/' + id + '.json'))
            // ignore order of geometry
            actualGeometry = actual.geometry
            referenceGeometry = reference.geometry

            actual.geometry = null
            reference.geometry = null

            assert.deepEqual(actual, reference)
          }
        }, (err, list) => {
          if (err) {
            assert.fail('Should not fail with ' + err.message)
          }

          done()
        })
    })

    it('xml ' + id, function (done) {
      overpassFrontend.get(id, {
          out: 'xml',
          outOptions: 'geom',
          each: (actual) => {
            const reference = fs.readFileSync('test/reference/' + id + '.xml').toString()
            assert.deepEqual(actual, reference)
          }
        }, (err, list) => {
          if (err) {
            assert.fail('Should not fail with ' + err.message)
          }

          done()
        })
    })
  })
})

describe('Load data from XML file with separated geometry', function () {
  let overpassFrontend

  it('load data', function (done) {
    overpassFrontend = new OverpassFrontend('test/outSeparateGeometry.xml', {
      fileFormat: 'OSMXML'
    })
    overpassFrontend.once('load', () => {
      reverseGeometryOnFileLoad.forEach(id => {
        overpassFrontend.cacheElements[id].geometry.geometry.coordinates.reverse()
      })

      done()
    })
  })

  ids.forEach(id => {
    it('json ' + id, function (done) {
      overpassFrontend.get(id, {
          out: 'json',
          outOptions: 'geom separateGeometry',
          each: (actual) => {
            const reference = JSON.parse(fs.readFileSync('test/reference/' + id + '.json'))
            assert.deepEqual(actual, reference)
          }
        }, (err, list) => {
          if (err) {
            assert.fail('Should not fail with ' + err.message)
          }

          done()
        })
    })

    it('xml ' + id, function (done) {
      overpassFrontend.get(id, {
          out: 'xml',
          outOptions: 'geom separateGeometry',
          each: (actual) => {
            const reference = fs.readFileSync('test/reference/' + id + '.xml').toString()
            assert.deepEqual(actual, reference)
          }
        }, (err, list) => {
          if (err) {
            assert.fail('Should not fail with ' + err.message)
          }

          done()
        })
    })
  })
})
