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
    const expected = ['n282549433', 'n973838907', 'n347352725']
    const timestamps = ['2007-01-01T00:00:00Z', '2008-07-31T21:04:15Z', '2009-01-01T00:00:00Z', '2013-01-01T00:00:00Z', '2018-02-01T00:00:00Z', '2018-04-01T00:00:00Z', '2020-01-01T00:00:00Z', null]
    const expectedTimestamps = {
      'n282549433': [null, '2008-07-31T21:04:15Z', '2008-07-31T21:04:15Z', null, null, null, null],
      'n973838907': [null, null, null, '2012-04-29T17:02:46Z', null, '2018-02-11T22:45:14Z', null],
      'n347352725': [null, null, null, '2012-10-19T00:31:11Z', '2016-04-19T14:44:27Z', '2016-04-19T14:44:27Z', '2019-06-16T16:21:20Z', '2021-07-23T17:29:32Z']
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
    const expected = ['n973838907', 'n347352725']
    const timestamps = ['2009-01-01T00:00:00Z', '2010-11-02T00:00:00Z', '2013-01-01T00:00:00Z', '2018-02-01T00:00:00Z', '2018-04-01T00:00:00Z', '2020-01-01T00:00:00Z', null]
    const expectedTimestamps = {
      'n973838907': [null, null, '2012-04-29T17:02:46Z', null, '2018-02-11T22:45:14Z', null],
      'n347352725': [null, null, '2012-10-19T00:31:11Z', '2016-04-19T14:44:27Z', '2016-04-19T14:44:27Z', '2019-06-16T16:21:20Z', '2021-07-23T17:29:32Z']
    }

    async.eachOf(timestamps,
      (date, i, done) => {
        const found = []

        overpassFrontend.BBoxQuery(
          '(node[amenity=parking];node[shop=supermarket];)', bbox,
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

  it('Load ways by id at different timestamps', function (done) {
    const expected = ['w86127691', 'w123386238']
    const timestamps = ['2009-01-01T00:00:00Z', '2011-01-01T00:00:00Z', '2011-07-25T00:00:00Z', '2013-01-01T00:00:00Z', '2022-01-01T00:00:00Z']
    const expectedTimestamps = {
      'w86127691': [null, '2010-11-22T17:27:01Z', '2011-07-23T20:34:09Z', null, null],
      'w123386238': [null, null, null, '2012-04-29T01:42:37Z', '2021-12-30T19:51:29Z']
    }
    const expectedMemberVersions = {
      'w86127691': [null, '1,1,1,1,1', '2,2,1,2,2,2', null, null],
      'w123386238': [null, null, null, '2,2,2,2,2,2,2,2,2,1,1,1,1,2,2,2,2,2,2,1,1,1,1,1,2,2,2,1,2', '2,2,2,2,2,2,2,2,2,1,1,1,1,2,2,2,1,2,2,2,1,1,1,1,1,2,2,2,1,2']
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
            const memberVersions = result.memberObjects().map(node => node ? node.meta.version : '').join(',')

            assert.equal(result.meta.timestamp, expectedTimestamps[result.id][i], 'Way ' + result.id + ' at date ' + date + ' has wrong timestamp')
            assert.equal(memberVersions, expectedMemberVersions[result.id][i], 'Way ' + result.id + ' at date ' + date + ' has wrong member versions')

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

  it('Load ways (buildings) by bbox at different timestamps', function (done) {
    const bbox = {
      minlat: 48.20200,
      maxlat: 48.20300,
      minlon: 16.34000,
      maxlon: 16.34100
    }
    const timestamps = ['2009-01-01T00:00:00Z', '2012-01-01T00:00:00Z', '2013-01-01T00:00:00Z', '2018-02-01T00:00:00Z', '2020-01-01T00:00:00Z', null]
    const expectedTimestamps = {
      'w86127673': [null, '2011-07-23T20:34:07Z', null, null, null, '2021-04-04T17:48:07Z'], // TODO: last index should be null
      'w86127644': [null, '2011-07-23T20:34:06Z', null, null, null, null],
      'w86124803': [null, '2011-07-23T20:34:01Z', null, null, null, null],
      'w123386238': [null, '2011-07-27T19:47:00Z', '2012-04-29T01:42:37Z', '2012-04-29T01:42:37Z', '2012-04-29T01:42:37Z', '2021-12-30T19:51:29Z'],
      'w161573351': [null, null, '2012-04-29T17:02:28Z', '2013-02-11T05:27:18Z', '2013-02-11T05:27:18Z', '2013-02-11T05:27:18Z'],
      'w161573356': [null, null, '2012-04-29T17:02:29Z', '2013-02-11T05:27:18Z', '2013-02-11T05:27:18Z', '2013-02-11T05:27:18Z'],
      'w161573365': [null, null, '2012-04-29T17:02:32Z', '2012-04-29T17:02:32Z', '2012-04-29T17:02:32Z', '2012-04-29T17:02:32Z'],
      'w161604906': [null, null, '2012-04-29T21:50:42Z', '2012-04-29T21:50:42Z', '2012-04-29T21:50:42Z', '2021-05-19T18:46:10Z'],
      'w161610222': [null, null, '2012-04-29T22:41:31Z', '2012-04-29T22:41:31Z', '2012-04-29T22:41:31Z', '2012-04-29T22:41:31Z'],
      'w161573360': [null, null, '2012-04-29T17:02:30Z', '2012-04-29T17:02:30Z', '2012-04-29T17:02:30Z', '2021-03-15T18:13:35Z'],
    }
    const expectedMemberVersions = {
      "w86127673": [ "", "2,2,2,2,1,2", "", "", "", "4,1,1,1,1,1,1,2,4,3,1,4,1,1,4" ], // TODO: last index should be ""
      "w86127644": [ "", "2,2,2,2,2", "", "", "", "" ],
      "w86124803": [ "", "2,1,2,2,1,2,2", "", "", "", "" ],
      "w123386238": [ "", "1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1", "2,2,2,2,2,2,2,2,2,1,1,1,1,2,2,2,2,2,2,1,1,1,1,1,2,2,2,1,2", "2,2,2,2,2,2,2,2,2,1,1,1,1,2,2,2,2,2,2,1,1,1,1,1,2,2,2,1,2", "2,2,2,2,2,2,2,2,2,1,1,1,1,2,2,2,2,2,2,1,1,1,1,1,2,2,2,1,2", "2,2,2,2,2,2,2,2,2,1,1,1,1,2,2,2,1,2,2,2,1,1,1,1,1,2,2,2,1,2" ],
      "w161573351": [ "", "", "1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1", "1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1", "1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1", "1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1" ],
      "w161573356": [ "", "", "1,1,1,1,1,1", "1,1,1,1,1,1", "1,1,1,1,1,1", "1,1,1,1,1,1" ],
      "w161573365": [ "", "", "1,1,1,1,1,1,1,1,1,1,1,1,1,1", "1,1,1,1,1,1,1,1,1,1,1,1,1,1", "1,1,1,1,1,1,1,1,1,1,1,1,1,1", "1,1,1,1,1,1,1,1,1,1,1,1,1,1" ],
      "w161604906": [ "", "", "1,1,1,1,1,1,1,1,1,1,1,1,1,1,1", "1,1,1,1,1,1,1,1,1,1,1,1,1,1,1", "1,1,1,1,1,1,1,1,1,1,1,1,1,1,1", "1,1,1,1,1,1,1,1,1,1,1,1,1,1,1" ],
      "w161610222": [ "", "", "2,1,1,1,1,1,1,1,1,1,4,1,1,2", "2,1,1,1,1,1,1,1,1,1,4,1,1,2", "2,1,1,1,1,1,1,1,1,1,4,1,1,2", "2,1,1,1,1,1,1,1,1,1,4,1,1,2" ],
      "w161573360": [ "", "", "1,1,1,1,1,1,1,1,1,1", "1,1,1,1,1,1,1,1,1,1", "1,1,1,1,1,1,1,1,1,1", "1,1,1,1,1,1,1,1,1,1" ]
    }

    async.eachOf(timestamps,
      (date, i, done) => {
        const found = []
        const expected = Object.keys(expectedTimestamps).filter(e => expectedTimestamps[e][i])

        overpassFrontend.BBoxQuery(
          'way[building]', bbox,
          { date },
          function (err, result) {
            found.push(result.id)

            console.log('At ' + date + ' found:', result.id, 'with ts', result.meta.timestamp)

            if (expected.indexOf(result.id) === -1) {
              assert.fail('At ' + date + ', unexpected result ' + result.id + ' (ts ' + result.meta.timestamp + ')')
            }
            assert.equal(result.meta.timestamp, expectedTimestamps[result.id][i], result.id + ' at date ' + date + ' has wrong timestamp')

            const memberVersions = result.memberObjects().map(node => node ? node.meta.version : '').join(',')
            assert.equal(memberVersions, expectedMemberVersions[result.id][i], result.id + ' at date ' + date + ' has wrong member versions')
          },
          function (err) {
            if (err) {
              return done(err)
            }


            if (found.length !== expected.length) {
              return done('At date ' + date + ', wrong count of objects returned:\n' +
               'Expected: ' + expected.join(', ') + '\n' +
               'Found: ' + found.join(', '))
            }

            done()
          })
        }, done
      )
  })
})
