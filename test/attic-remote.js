/* How to create the history.osc.bz2 file:
See test/attic-local.js how to create the history.osh.bz2

Then, convert the file:
osmium cat history.osh.bz2 -o history.osc.bz2
*/
var fs = require('fs')
var conf = JSON.parse(fs.readFileSync('test/conf.json', 'utf8'));

if (!conf.generator) {
  console.error('Set correct "generator" string in test/conf.json!')
  process.exit(0)
}

const assert = require('assert')
const async = require('async')

const atticTest = require('./src/atticTest')

const OverpassFrontend = require('..')

if (typeof XMLHttpRequest === 'undefined') {
  global.XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest
  const DOMParser = require('xmldom').DOMParser
}

let overpassFrontend

describe('Attic data from Overpass API', function () {
  it('init', function () {
    overpassFrontend = new OverpassFrontend(conf['url-history'], {attic: true})
    global.of = overpassFrontend
  })

  it('Load nodes by id at different timestamps', function (done) {
    return done()
    const timestamps = ['2007-01-01T00:00:00Z', '2008-07-31T21:04:15Z', '2009-01-01T00:00:00Z', '2013-01-01T00:00:00Z', '2018-02-01T00:00:00Z', '2018-04-01T00:00:00Z', '2020-01-01T00:00:00Z', null]
    const expectedTimestamps = {
      'n282549433': [null, '2008-07-31T21:04:15Z', '2008-07-31T21:04:15Z', null, null, null, null],
      'n973838907': [null, null, null, '2012-04-29T17:02:46Z', null, '2018-02-11T22:45:14Z', null],
      'n347352725': [null, null, null, '2012-10-19T00:31:11Z', '2016-04-19T14:44:27Z', '2016-04-19T14:44:27Z', '2019-06-16T16:21:20Z', '2021-07-23T17:29:32Z']
    }
    const ids = Object.keys(expectedTimestamps)

    atticTest.get(overpassFrontend, {
      ids,
      expectedTimestamps,
      timestamps
    }, done)
  })

  it('Load nodes by bbox at different timestamps', function (done) {
    return done()
    const bbox = {
      minlat: 48.20200,
      maxlat: 48.20300,
      minlon: 16.34000,
      maxlon: 16.34100
    }
    const expected = ['n973838907', 'n347352725', 'n4100076539']
    const timestamps = ['2009-01-01T00:00:00Z', '2010-11-02T00:00:00Z', '2013-01-01T00:00:00Z', '2018-02-01T00:00:00Z', '2018-04-01T00:00:00Z', '2020-01-01T00:00:00Z', null]
    const expectedTimestamps = {
      'n973838907': [null, null, '2012-04-29T17:02:46Z', null, '2018-02-11T22:45:14Z', null],
      'n347352725': [null, null, '2012-10-19T00:31:11Z', '2016-04-19T14:44:27Z', '2016-04-19T14:44:27Z', '2019-06-16T16:21:20Z', '2021-07-23T17:29:32Z'],
      'n4100076539': [null, null, null, '2016-05-03T21:08:53Z', '2016-05-03T21:08:53Z', null, null],
    }

    atticTest.bbox(overpassFrontend, {
      query: '(node[amenity=parking];node[shop=supermarket];node[amenity=pharmacy];)',
      bbox,
      expectedTimestamps,
      timestamps
    }, done)
  })

  it('Load ways by id at different timestamps', function (done) {
    const timestamps = ['2009-01-01T00:00:00Z', '2011-01-01T00:00:00Z', '2011-07-25T00:00:00Z', '2013-01-01T00:00:00Z', '2022-01-01T00:00:00Z']
    const expectedTimestamps = {
      'w86127691': [null, '2010-11-22T17:27:01Z', '2011-07-23T20:34:09Z', null, null],
      'w123386238': [null, null, null, '2012-04-29T01:42:37Z', '2021-12-30T19:51:29Z']
    }
    const expectedMemberVersions = {
      'w86127691': [null, '1,1,1,1,1', '2,2,1,2,2,2', null, null],
      'w123386238': [null, null, null, '2,2,2,2,2,2,2,2,2,1,1,1,1,2,2,2,2,2,2,1,1,1,1,1,2,2,2,1,2', '2,2,2,2,2,2,2,2,2,1,1,1,1,2,2,2,1,2,2,2,1,1,1,1,1,2,2,2,1,2']
    }

    const ids = Object.keys(expectedTimestamps)

    atticTest.get(overpassFrontend, {
      ids,
      expectedTimestamps,
      timestamps
    }, done)
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
      'w86127673': [null, '2011-07-23T20:34:07Z', null, null, null, null],
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
      "w86127673": [ "", "2,2,2,2,1,2", "", "", "", "" ],
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

    atticTest.bbox(overpassFrontend, {
      query: 'way[building]',
      bbox,
      expectedTimestamps,
      timestamps
    }, done)
  })
})