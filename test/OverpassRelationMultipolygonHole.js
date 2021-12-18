const assert = require('assert').strict
const BoundingBox = require('boundingbox')

const OverpassRelation = require('../src/OverpassRelation')
const OverpassFrontend = require('..')
const testIntersects = require('../src/testIntersects')

const id = 'r2334391'
const example = {
  "type": "relation",
  "id": 2334391,
  "timestamp": "2012-08-06T03:08:07Z",
  "version": 1,
  "changeset": 12628312,
  "user": "KaiRo",
  "uid": 17047,
  "bounds": {
    "minlat": 48.1994112,
    "minlon": 16.3386374,
    "maxlat": 48.1998359,
    "maxlon": 16.3394272
  },
  "members": [
    {
      "type": "way",
      "ref": 174711722,
      "role": "outer",
      "geometry": [
         { "lat": 48.1997241, "lon": 16.3386374 },
         { "lat": 48.1994112, "lon": 16.3387568 },
         { "lat": 48.1994774, "lon": 16.3391364 },
         { "lat": 48.1995281, "lon": 16.3394272 },
         { "lat": 48.1998359, "lon": 16.3393112 },
         { "lat": 48.1998143, "lon": 16.3391813 },
         { "lat": 48.1997874, "lon": 16.3391895 },
         { "lat": 48.1997837, "lon": 16.3391645 },
         { "lat": 48.1998100, "lon": 16.3391556 },
         { "lat": 48.1997241, "lon": 16.3386374 }
      ]
    },
    {
      "type": "way",
      "ref": 174711721,
      "role": "inner",
      "geometry": [
         { "lat": 48.1996340, "lon": 16.3390834 },
         { "lat": 48.1996010, "lon": 16.3388933 },
         { "lat": 48.1996538, "lon": 16.3388735 },
         { "lat": 48.1996494, "lon": 16.3388471 },
         { "lat": 48.1996972, "lon": 16.3388325 },
         { "lat": 48.1997271, "lon": 16.3390013 },
         { "lat": 48.1997462, "lon": 16.3389943 },
         { "lat": 48.1997532, "lon": 16.3390377 },
         { "lat": 48.1996340, "lon": 16.3390834 }
      ]
    }
  ],
  "tags": {
    "building": "yes",
    "type": "multipolygon"
  }
}

const boundingboxes = {
  'wrap': new BoundingBox({minlon: 16, minlat: 48, maxlon: 17, maxlat: 49}),
  'not wrap': new BoundingBox({minlon: 16, minlat: 48, maxlon: 16.2, maxlat: 49}),
  'inside of the hole': new BoundingBox({ minlon: 16.33894443511963, minlat: 48.19965146865885, maxlon: 16.33899539709091, maxlat: 48.19968007331587 }),
  'inside building area': new BoundingBox({ minlon: 16.338808983564373, minlat: 48.19949682445519, maxlon: 16.33886530995369, maxlat: 48.199535262075436 }),
  'outside building area': new BoundingBox({ minlon: 16.338711082935333, minlat: 48.1994190552284, maxlon: 16.338735222816467, maxlat: 48.19943872102103 }),
  'intersecting outline': new BoundingBox({ minlon: 16.339346766471863, minlat: 48.19963001515559, maxlon: 16.33941650390625, maxlat: 48.199672922153106 }),
  'intersecting corner': new BoundingBox({ minlon: 16.33936285972595, minlat: 48.19949771835367, maxlon: 16.339470148086548, maxlat: 48.199565654591936 })
}


describe('OverpassRelation (multipolygon with hole)', function () {
  describe('with geometry', function () {
    const ob = new OverpassRelation(id)
    ob.overpass = new OverpassFrontend('')
    ob.updateData(example, { properties: 0 })

    it('properties', function () {
      assert.equal(ob.properties, 63)
    })

    it('intersect()', function () {
      const expected = {
        'wrap': 2,
        'not wrap': 0,
        'inside of the hole': 0,
        'inside building area': 2,
        'outside building area': 0,
        'intersecting outline': 2,
        'intersecting corner': 2
      }

      testIntersects({ ob, boundingboxes, expected })
    })
  })

  describe('with bounds only', function () {
    const ob = new OverpassRelation(id)
    ob.overpass = new OverpassFrontend('')
    let d = JSON.parse(JSON.stringify(example))
    d.members.forEach(m => delete m.geometry)
    ob.updateData(d, { properties: 7 })

    it('intersect()', function () {
      const expected = {
        'wrap': 2,
        'not wrap': 0,
        'inside of the hole': 1,
        'inside building area': 1,
        'outside building area': 1,
        'intersecting outline': 1,
        'intersecting corner': 1
      }

      testIntersects({ ob, boundingboxes, expected })
    })
  })

  describe('without geometry', function () {
    const ob = new OverpassRelation(id)
    ob.overpass = new OverpassFrontend('')
    let d = JSON.parse(JSON.stringify(example))
    d.members.forEach(m => delete m.geometry)
    delete d.bounds
    ob.updateData(d, { properties: 7 })

    it('intersect()', function () {
      const expected = {
        'wrap': 1,
        'not wrap': 1,
        'inside of the hole': 1,
        'inside building area': 1,
        'outside building area': 1,
        'intersecting outline': 1,
        'intersecting corner': 1
      }

      testIntersects({ ob, boundingboxes, expected })
    })
  })

  describe('without tags, properties 0', function () {
    const ob = new OverpassRelation('r2334391')
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
    const ob = new OverpassRelation('r2334391')
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
    const ob = new OverpassRelation('r2334391')
    ob.overpass = new OverpassFrontend('')
    let d = JSON.parse(JSON.stringify(example))
    ob.updateData(d, { properties: 0 })

    it('properties', function () {
      assert.equal(ob.properties, 63)
      if (!ob.meta || !ob.meta.timestamp) {
        assert.fail('Meta should have timestamp') // WRONG
      }
    })
  })

  describe('without meta, but properties 0', function () {
    const ob = new OverpassRelation('r2334391')
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
