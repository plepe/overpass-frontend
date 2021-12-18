const assert = require('assert').strict
const BoundingBox = require('boundingbox')

const OverpassFrontend = require('..')
const OverpassNode = require('../src/OverpassNode')
const testIntersects = require('../src/testIntersects')

const example = {
  "type": "node",
  "id": 3037893171,
  "lat": 48.1985386,
  "lon": 16.3387032,
  "timestamp": "2014-08-23T23:04:35Z",
  "version": 1,
  "changeset": 24967165,
  "user": "Kevin Kofler",
  "uid": 770238,
  "tags": {
    "amenity": "bench",
    "backrest": "yes",
    "material": "wood",
    "source": "survey"
  }
}

const boundingboxes = {
  'matching': new BoundingBox({minlon: 16, minlat: 48, maxlon: 17, maxlat: 49}),
  'not matching': new BoundingBox({minlon: 16, minlat: 48, maxlon: 16.2, maxlat: 49})
}

describe('OverpassNode', function () {
  describe('with geometry', function () {
    const ob = new OverpassNode('n3037893171')
    ob.overpass = new OverpassFrontend('')
    let d = JSON.parse(JSON.stringify(example))
    ob.updateData(d, { properties: 63 })

    it('intersect()', function () {
      const expected = {
        'matching': 2,
        'not matching': 0
      }

      testIntersects({ ob, boundingboxes, expected })
    })
  })

  describe('without geometry', function () {
    const ob = new OverpassNode('n3037893171')
    ob.overpass = new OverpassFrontend('')
    let d = JSON.parse(JSON.stringify(example))
    delete d.lat
    delete d.lon
    ob.updateData(d, { properties: 7 })

    it('intersect()', function () {
      const expected = {
        'matching': 1,
        'not matching': 1
      }

      testIntersects({ ob, boundingboxes, expected })
    })
  })
})
