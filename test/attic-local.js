const assert = require('assert')
const async = require('async')

const OverpassFrontend = require('..')

if (typeof XMLHttpRequest === 'undefined') {
  global.XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest
  const DOMParser = require('xmldom').DOMParser
}

let overpassFrontend

describe('Attic data from local file', function () {
  it('load', function (done) {
    this.timeout(20000)
    overpassFrontend = new OverpassFrontend('test/history.osm.bz2', {attic: true})
    overpassFrontend.on('load', () => done())
    overpassFrontend.on('error', done)
  })

  it('Load nodes by id at different timestamps', function (done) {
    const expected = ['n282549433', 'n973838907']
    const timestamps = ['2007-01-01T00:00:00Z', '2009-01-01T00:00:00Z', '2013-01-01T00:00:00Z', '2018-02-01T00:00:00Z', '2018-04-01T00:00:00Z', '2020-01-01T00:00:00Z']
    const expectedTimestamps = {
      'n282549433': [null, '2008-07-31T21:04:15Z', null, null, null, null],
      'n973838907': [null, null, '2012-04-29T17:02:46Z', null, '2018-02-11T22:45:14Z', null],
    }

    async.eachOf(timestamps,
      (date, i, done) => {
        const found = []

        overpassFrontend.get(
          expected,
          { date },
          function (err, result) {
            found.push(result.id)

            console.log('At ' + date + ' found:', result.id, 'with ts', result.meta.timestamp)
            assert.equal(result.meta.timestamp, expectedTimestamps[result.id][i], 'Node ' + result.id + ' at date ' + date + ' has wrong timestamp')

            if (expected.indexOf(result.id) === -1) {
              error += 'Unexpected result ' + result.id + '\n'
            }
          },
          function (err) {
            if (err) {
              return done(err)
            }

            const _expected = expected.filter(e => expectedTimestamps[e][i])

            if (found.length !== _expected.length) {
              return done('At date ' + date + ', wrong count of objects returned:\n' +
               'Expected: ' + _expected.join(', ') + '\n' +
               'Found: ' + found.join(', '))
            }

            done()
          })
        }, done
      )
  })

  it('Load nodes by bbox at different timestamps', function (done) {
    const bbox = {
      minlat: 48.20200,
      maxlat: 48.20300,
      minlon: 16.34000,
      maxlon: 16.34100
    }
    const expected = ['n973838907']
    const timestamps = ['2009-01-01T00:00:00Z', '2010-11-02T00:00:00Z', '2013-01-01T00:00:00Z', '2018-02-01T00:00:00Z', '2018-04-01T00:00:00Z', '2020-01-01T00:00:00Z']
    const expectedTimestamps = {
      'n973838907': [null, null, '2012-04-29T17:02:46Z', null, '2018-02-11T22:45:14Z', null],
    }

    async.eachOf(timestamps,
      (date, i, done) => {
        const found = []

        overpassFrontend.BBoxQuery(
          'node[amenity=parking]', bbox,
          { date },
          function (err, result) {
            found.push(result.id)

            console.log('At ' + date + ' found:', result.id, 'with ts', result.meta.timestamp)
            assert.equal(result.meta.timestamp, expectedTimestamps[result.id][i], 'Node ' + result.id + ' at date ' + date + ' has wrong timestamp')

            if (expected.indexOf(result.id) === -1) {
              error += 'Unexpected result ' + result.id + '\n'
            }
          },
          function (err) {
            if (err) {
              return done(err)
            }

            const _expected = expected.filter(e => expectedTimestamps[e][i])

            if (found.length !== _expected.length) {
              return done('At date ' + date + ', wrong count of objects returned:\n' +
               'Expected: ' + _expected.join(', ') + '\n' +
               'Found: ' + found.join(', '))
            }

            done()
          })
        }, done
      )
  })
})
