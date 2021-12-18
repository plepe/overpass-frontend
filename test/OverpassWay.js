const assert = require('assert').strict
const BoundingBox = require('boundingbox')

const OverpassWay = require('../src/OverpassWay')
const OverpassFrontend = require('..')
const testIntersects = require('../src/testIntersects')

const example = {
  "type": "way",
  "id": 299709376,
  "timestamp": "2014-08-23T18:33:19Z",
  "version": 1,
  "changeset": 24962130,
  "user": "Kevin Kofler",
  "uid": 770238,
  "bounds": {
    "minlat": 48.1986493,
    "minlon": 16.3385645,
    "maxlat": 48.1989158,
    "maxlon": 16.3386515
  },
  "nodes": [
    3037431639,
    3037431690,
    3037431691,
    3037431692,
    3037431693,
    3037431694,
    3037431695,
    3037431680
  ],
  "geometry": [
    { "lat": 48.1989158, "lon": 16.3385645 },
    { "lat": 48.1988801, "lon": 16.3385907 },
    { "lat": 48.1988310, "lon": 16.3386213 },
    { "lat": 48.1987690, "lon": 16.3386461 },
    { "lat": 48.1987326, "lon": 16.3386515 },
    { "lat": 48.1987013, "lon": 16.3386488 },
    { "lat": 48.1986768, "lon": 16.3386399 },
    { "lat": 48.1986493, "lon": 16.3386184 }
  ],
  "tags": {
    "highway": "footway",
    "name": "Emil-Maurer-Platz",
    "source": "basemap.at"
  }
}

const boundingboxes = {
  'wrap': new BoundingBox({minlon: 16, minlat: 48, maxlon: 17, maxlat: 49}),
  'not wrap': new BoundingBox({minlon: 16, minlat: 48, maxlon: 16.2, maxlat: 49}),
  'not quite': new BoundingBox({ minlon: 16.3385746255517, minlat: 48.198845168318556, maxlon: 16.33860144764185, maxlat: 48.19885924739677 }),
  'intersect': new BoundingBox({ minlon: 16.338586695492268, minlat: 48.19886528128624, maxlon: 16.338611505925655, maxlat: 48.198870644742975 })
}

describe('OverpassWay', function () {
  describe('with geometry', function () {
    const ob = new OverpassWay('w299709376')
    ob.overpass = new OverpassFrontend('')
    ob.updateData(example, { properties: 63 })

    it('properties', function () {
      assert.equal(ob.properties, 63)
    })

    it('intersect()', function () {
      const expected = {
        'wrap': 2,
        'not wrap': 0,
        'not quite': 0,
        'intersect': 2
      }

      testIntersects({ ob, boundingboxes, expected })
    })
  })

  describe('with bounds only', function () {
    const ob = new OverpassWay('w299709376')
    ob.overpass = new OverpassFrontend('')
    let d = JSON.parse(JSON.stringify(example))
    delete d.geometry
    ob.updateData(d, { properties: 7 })

    it('properties', function () {
      assert.equal(ob.properties, 7)
    })

    it('intersect()', function () {
      const expected = {
        'wrap': 2,
        'not wrap': 0,
        'not quite': 1,
        'intersect': 1
      }

      testIntersects({ ob, boundingboxes, expected })
    })
  })

  describe('without geometry', function () {
    const ob = new OverpassWay('w299709376')
    ob.overpass = new OverpassFrontend('')
    let d = JSON.parse(JSON.stringify(example))
    delete d.geometry
    delete d.bounds
    ob.updateData(d, { properties: 7 })

    it('properties', function () {
      assert.equal(ob.properties, 7)
    })

    it('intersect()', function () {
      const expected = {
        'wrap': 1,
        'not wrap': 1,
        'not quite': 1,
        'intersect': 1
      }

      testIntersects({ ob, boundingboxes, expected })
    })
  })

  describe('with tags, properties 0', function () {
    const ob = new OverpassWay('w299709376')
    ob.overpass = new OverpassFrontend('')
    let d = JSON.parse(JSON.stringify(example))
    ob.updateData(d, { properties: 0 })

    it('properties', function () {
      assert.equal(ob.properties, 56) // WRONG
      assert.deepEqual(ob.tags, example.tags)
    })
  })

  describe('without tags, properties 0', function () {
    const ob = new OverpassWay('w299709376')
    ob.overpass = new OverpassFrontend('')
    let d = JSON.parse(JSON.stringify(example))
    delete d.tags
    ob.updateData(d, { properties: 0 })

    it('properties', function () {
      assert.equal(ob.properties, 56)
      assert.deepEqual(ob.tags, undefined)
    })
  })

  describe('without tags, but properties TAGS', function () {
    const ob = new OverpassWay('w299709376')
    ob.overpass = new OverpassFrontend('')
    let d = JSON.parse(JSON.stringify(example))
    delete d.tags
    ob.updateData(d, { properties: OverpassFrontend.TAGS })

    it('properties', function () {
      assert.equal(ob.properties, 57)
      assert.deepEqual(ob.tags, {})
    })
  })

  describe('with meta, but properties 0', function () {
    const ob = new OverpassWay('w299709376')
    ob.overpass = new OverpassFrontend('')
    let d = JSON.parse(JSON.stringify(example))
    ob.updateData(d, { properties: 0 })

    it('properties', function () {
      assert.equal(ob.properties, 56) // WRONG
      if (!ob.meta || !ob.meta.timestamp) {
        assert.fail('Meta should have timestamp')
      }
    })
  })

  describe('without meta, but properties 0', function () {
    const ob = new OverpassWay('w299709376')
    ob.overpass = new OverpassFrontend('')
    let d = JSON.parse(JSON.stringify(example))
    delete d.timestamp
    delete d.changeset
    delete d.version
    delete d.uid
    delete d.user
    ob.updateData(d, { properties: 0 })

    it('properties', function () {
      assert.equal(ob.properties, 56) // WRONG
      if (ob.meta && ob.meta.timestamp) {
        assert.fail('Meta has timestamp')
      }
    })
  })
})
