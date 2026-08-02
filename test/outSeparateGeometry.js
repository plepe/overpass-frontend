const fs = require('fs')
const conf = JSON.parse(fs.readFileSync('test/conf.json', 'utf8'));
const assert = require('assert').strict

const OverpassFrontend = require('..')

var overpassFrontend = new OverpassFrontend(conf.url)

const ids = [
  'r6412377',
  'r3237099'
]

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
