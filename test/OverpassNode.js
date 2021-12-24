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
  'matching': new BoundingBox({ minlon: 16, minlat: 48, maxlon: 17, maxlat: 49 }),
  'not matching': new BoundingBox({ minlon: 16, minlat: 48, maxlon: 16.2, maxlat: 49 }),
  'geojson around bbox': { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[16.338690631091595, 48.19852604150785], [16.33869230747223, 48.19854950678225], [16.338727176189423, 48.19854973026099], [16.338684931397438, 48.198556881580544], [16.338690631091595, 48.19852604150785]]] } },
  'geojson matching': { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[16.338693313300606, 48.19852403019814], [16.338731534779072, 48.1985593398464], [16.33868459612131, 48.19855017721849], [16.338693313300606, 48.19852403019814]]] } },
  'geojson not matching': { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[16.338693313300606, 48.19852403019814], [16.338724493980408, 48.198543025898005], [16.338731534779072, 48.1985593398464], [16.338693313300606, 48.19852403019814]]] } }
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
        'not matching': 0,
        'geojson around bbox': 0,
        'geojson matching': 2,
        'geojson not matching': 0
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
        'not matching': 1,
        'geojson around bbox': 1,
        'geojson matching': 1,
        'geojson not matching': 1
      }

      testIntersects({ ob, boundingboxes, expected })
    })
  })

  describe('with tags, properties 0', function () {
    const ob = new OverpassNode('n3037893171')
    ob.overpass = new OverpassFrontend('')
    let d = JSON.parse(JSON.stringify(example))
    ob.updateData(d, { properties: 0 })

    it('properties', function () {
      assert.equal(ob.properties, 63)
      assert.deepEqual(ob.tags, example.tags)
    })
  })

  describe('without tags, properties 0', function () {
    const ob = new OverpassNode('n3037893171')
    ob.overpass = new OverpassFrontend('')
    let d = JSON.parse(JSON.stringify(example))
    delete d.tags
    ob.updateData(d, { properties: 0 })

    it('properties', function () {
      assert.equal(ob.properties, 62)
      assert.deepEqual(ob.tags, undefined)
    })
  })

  describe('without tags, but properties TAGS', function () {
    const ob = new OverpassNode('n3037893171')
    ob.overpass = new OverpassFrontend('')
    let d = JSON.parse(JSON.stringify(example))
    delete d.tags
    ob.updateData(d, { properties: OverpassFrontend.TAGS })

    it('properties', function () {
      assert.equal(ob.properties, 63)
      assert.deepEqual(ob.tags, {})
    })
  })

  describe('with meta, but properties 0', function () {
    const ob = new OverpassNode('n3037893171')
    ob.overpass = new OverpassFrontend('')
    let d = JSON.parse(JSON.stringify(example))
    ob.updateData(d, { properties: 0 })

    it('properties', function () {
      assert.equal(ob.properties, 63)
      if (!ob.meta || !ob.meta.timestamp) {
        assert.fail('Meta should have timestamp')
      }
    })
  })

  describe('without meta, but properties 0', function () {
    const ob = new OverpassNode('n3037893171')
    ob.overpass = new OverpassFrontend('')
    let d = JSON.parse(JSON.stringify(example))
    delete d.timestamp
    delete d.changeset
    delete d.version
    delete d.uid
    delete d.user
    ob.updateData(d, { properties: 0 })

    it('properties', function () {
      assert.equal(ob.properties, 61)
      if (ob.meta && ob.meta.timestamp) {
        assert.fail('Meta has timestamp')
      }
    })
  })
})
