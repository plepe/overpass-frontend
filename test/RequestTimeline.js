var fs = require('fs')
var conf = JSON.parse(fs.readFileSync('test/conf.json', 'utf8'));

if (!conf.generator) {
  console.error('Set correct "generator" string in test/conf.json!')
  process.exit(0)
}

const assert = require('assert')
const async = require('async')

const OverpassFrontend = require('..')

if (typeof XMLHttpRequest === 'undefined') {
  global.XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest
  const DOMParser = require('xmldom').DOMParser
}

let overpassFrontend

describe('Request timeline from Overpass API (with attic data)', function () {
  it('init', function () {
    overpassFrontend = new OverpassFrontend(conf['url-history'], {attic: true})
  })

  it('Load timeline of a node', function (done) {
    const found = []
    const expected = ['n973838907']

    overpassFrontend.getTimeline(
      'n973838907',
      {},
      (err, result) => {
        found.push(result.id)
        assert.deepEqual(result, {
          id: 'n973838907',
          timeline: [
            { version: '1', timestamp: '2010-11-01T17:06:44Z', endTimestamp: '2010-11-02T08:19:12Z' },
            { version: '2', timestamp: '2010-11-02T08:19:12Z', endTimestamp: '2012-04-29T17:02:46Z' },
            { version: '3', timestamp: '2012-04-29T17:02:46Z', endTimestamp: '2014-07-18T08:28:05Z' },
            { version: '4', timestamp: '2014-07-18T08:28:05Z', endTimestamp: '2014-07-18T08:28:11Z' },
            { version: '6', timestamp: '2014-07-18T08:28:11Z', endTimestamp: '2014-07-18T08:55:32Z' },
            { version: '7', timestamp: '2014-07-18T08:55:32Z', endTimestamp: '2014-07-18T08:55:47Z' },
            { version: '8', timestamp: '2014-07-18T08:55:47Z', endTimestamp: '2018-01-21T10:37:59Z' },
            { version: '9', timestamp: '2018-01-21T10:37:59Z', endTimestamp: '2018-02-11T22:45:14Z' },
            { version: '10', timestamp: '2018-02-11T22:45:14Z', endTimestamp: '2018-06-28T18:41:39Z' },
            { version: '11', timestamp: '2018-06-28T18:41:39Z', endTimestamp: undefined }
          ]
        })
      },
      (err) => {
        assert.deepEqual(found, expected, 'Wrong count of items returned!')

        done(err)
      }
    )
  })

  it('Load timeline of a non-existant item', function (done) {
    const found = []
    const expected = ['n1']

    overpassFrontend.getTimeline(
      'n1',
      {},
      (err, result) => {
        found.push(result.id)
        assert.deepEqual(result, {
          id: 'n1',
          timeline: false
        })
      },
      (err) => {
        assert.deepEqual(found, expected, 'Wrong count of items returned!')

        done(err)
      }
    )
  })
})
