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
  'intersect': new BoundingBox({ minlon: 16.338586695492268, minlat: 48.19886528128624, maxlon: 16.338611505925655, maxlat: 48.198870644742975 }),
  'geojson around bbox': { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[16.33849985897541, 48.198801813672446], [16.338546127080917, 48.19892427927929], [16.338677555322647, 48.19893277140904], [16.338514611124992, 48.19893724095045], [16.33849985897541, 48.198801813672446]]] } },
  'geojson not matching in bbox': { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[16.338579654693604, 48.19885097873226], [16.338585019111633, 48.1987311946858], [16.338617876172066, 48.19880226062775], [16.338579654693604, 48.19885097873226]]] } },
  'geojson intersects': { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[16.338623240590096, 48.198745497273215], [16.33866548538208, 48.19875443638835], [16.338664144277573, 48.198770526791634], [16.338623240590096, 48.198745497273215]]] } },
  'geojson wrap': { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[16.338362395763397, 48.19887377342582], [16.338678896427155, 48.198447376890584], [16.338674873113632, 48.19900607183903], [16.338362395763397, 48.19887377342582]]] } }
}

describe('OverpassWay', function () {
  describe('with geometry', function () {
    const ob = new OverpassWay('w299709376')
    ob.overpass = new OverpassFrontend('')
    ob.updateData(example, { properties: 0 })

    it('properties', function () {
      assert.equal(ob.properties, 63)
    })

    it('intersect()', function () {
      const expected = {
        'wrap': 2,
        'not wrap': 0,
        'not quite': 0,
        'intersect': 2,
        'geojson around bbox': 0,
        'geojson not matching in bbox': 0,
        'geojson intersects': 2,
        'geojson wrap': 2
      }

      testIntersects({ ob, boundingboxes, expected })
    })
  })

  describe('with bounds only', function () {
    const ob = new OverpassWay('w299709376')
    ob.overpass = new OverpassFrontend('')
    let d = JSON.parse(JSON.stringify(example))
    delete d.geometry
    ob.updateData(d, { properties: 0 })

    it('properties', function () {
      assert.equal(ob.properties, 7)
    })

    it('intersect()', function () {
      const expected = {
        'wrap': 2,
        'not wrap': 0,
        'not quite': 1,
        'intersect': 1,
        'geojson around bbox': 0,
        'geojson not matching in bbox': 1,
        'geojson intersects': 1,
        'geojson wrap': 2
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
    ob.updateData(d, { properties: 0 })

    it('properties', function () {
      assert.equal(ob.properties, 7)
    })

    it('intersect()', function () {
      const expected = {
        'wrap': 1,
        'not wrap': 1,
        'not quite': 1,
        'intersect': 1,
        'geojson around bbox': 1,
        'geojson not matching in bbox': 1,
        'geojson intersects': 1,
        'geojson wrap': 1
      }

      testIntersects({ ob, boundingboxes, expected })
    })
  })

  describe('without nodes but geometry', function () {
    const ob = new OverpassWay('w299709376')
    ob.overpass = new OverpassFrontend('')
    let d = JSON.parse(JSON.stringify(example))
    delete d.nodes
    ob.updateData(d, { properties: 0 })

    it('properties', function () {
      assert.equal(ob.properties, 59)
    })

    it('intersect()', function () {
      const expected = {
        'wrap': 2,
        'not wrap': 0,
        'not quite': 0,
        'intersect': 2,
        'geojson around bbox': 0,
        'geojson not matching in bbox': 0,
        'geojson intersects': 2,
        'geojson wrap': 2
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
      assert.equal(ob.properties, 63)
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
      assert.equal(ob.properties, 62)
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
      assert.equal(ob.properties, 63)
      assert.deepEqual(ob.tags, {})
    })
  })

  describe('with meta, but properties 0', function () {
    const ob = new OverpassWay('w299709376')
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
      assert.equal(ob.properties, 61)
      if (ob.meta && ob.meta.timestamp) {
        assert.fail('Meta has timestamp')
      }
    })
  })
})
