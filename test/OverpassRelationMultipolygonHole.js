const assert = require('assert').strict
const BoundingBox = require('boundingbox')

const OverpassRelation = require('../src/OverpassRelation')
const OverpassFrontend = require('..')

const id = 'r2334391'
const example = {
  "type": "relation",
  "id": 2334391,
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

describe('OverpassRelation (multipolygon with hole)', function () {
  describe('with geometry', function () {
    const ob = new OverpassRelation(id)
    ob.overpass = new OverpassFrontend('')
    ob.updateData(example, { properties: 63 })

    it('intersect() -- with BoundingBox', function (done) {
      let result = ob.intersects(new BoundingBox({minlon: 16, minlat: 48, maxlon: 17, maxlat: 49}))
      assert.equal(result, 2)

      result = ob.intersects(new BoundingBox({minlon: 16, minlat: 48, maxlon: 16.2, maxlat: 49}))
      assert.equal(result, 0)

      result = ob.intersects(new BoundingBox({ minlon: 16.33894443511963, minlat: 48.19965146865885, maxlon: 16.33899539709091, maxlat: 48.19968007331587 }))
      assert.equal(result, 0) // (inside of the hole)

      result = ob.intersects(new BoundingBox({ minlon: 16.338808983564373, minlat: 48.19949682445519, maxlon: 16.33886530995369, maxlat: 48.199535262075436 }))
      assert.equal(result, 2) // (inside building area)

      result = ob.intersects(new BoundingBox({ minlon: 16.338711082935333, minlat: 48.1994190552284, maxlon: 16.338735222816467, maxlat: 48.19943872102103 }))
      assert.equal(result, 0) // (outside building area)

      result = ob.intersects(new BoundingBox({ minlon: 16.339346766471863, minlat: 48.19963001515559, maxlon: 16.33941650390625, maxlat: 48.199672922153106 }))
      assert.equal(result, 2) // (intersecting outline)

      result = ob.intersects(new BoundingBox({ minlon: 16.33936285972595, minlat: 48.19949771835367, maxlon: 16.339470148086548, maxlat: 48.199565654591936 }))
      assert.equal(result, 2) // (intersecting corner)

      done()
    })
  })

  describe('with bounds only', function () {
    const ob = new OverpassRelation(id)
    ob.overpass = new OverpassFrontend('')
    let d = JSON.parse(JSON.stringify(example))
    d.members.forEach(m => delete m.geometry)
    ob.updateData(d, { properties: 7 })

    it('intersect() -- with BoundingBox', function (done) {
      let result = ob.intersects(new BoundingBox({minlon: 16, minlat: 48, maxlon: 17, maxlat: 49}))
      assert.equal(result, 2)

      result = ob.intersects(new BoundingBox({minlon: 16, minlat: 48, maxlon: 16.2, maxlat: 49}))
      assert.equal(result, 0)

      result = ob.intersects(new BoundingBox({ minlon: 16.33894443511963, minlat: 48.19965146865885, maxlon: 16.33899539709091, maxlat: 48.19968007331587 }))
      assert.equal(result, 1) // (inside of the hole)

      result = ob.intersects(new BoundingBox({ minlon: 16.338808983564373, minlat: 48.19949682445519, maxlon: 16.33886530995369, maxlat: 48.199535262075436 }))
      assert.equal(result, 1) // (inside building area)

      result = ob.intersects(new BoundingBox({ minlon: 16.338711082935333, minlat: 48.1994190552284, maxlon: 16.338735222816467, maxlat: 48.19943872102103}))
      assert.equal(result, 1) // (outside building area)

      result = ob.intersects(new BoundingBox({ minlon: 16.339346766471863, minlat: 48.19963001515559, maxlon: 16.33941650390625, maxlat: 48.199672922153106 }))
      assert.equal(result, 1) // (intersecting outline)

      result = ob.intersects(new BoundingBox({ minlon: 16.33936285972595, minlat: 48.19949771835367, maxlon: 16.339470148086548, maxlat: 48.199565654591936 }))
      assert.equal(result, 1) // (intersecting corner)

      done()
    })
  })

  describe('without geometry', function () {
    const ob = new OverpassRelation(id)
    ob.overpass = new OverpassFrontend('')
    let d = JSON.parse(JSON.stringify(example))
    d.members.forEach(m => delete m.geometry)
    delete d.bounds
    ob.updateData(d, { properties: 7 })

    it('intersect() -- with BoundingBox', function (done) {
      let result = ob.intersects(new BoundingBox({minlon: 16, minlat: 48, maxlon: 17, maxlat: 49}))
      assert.equal(result, 1)

      result = ob.intersects(new BoundingBox({minlon: 16, minlat: 48, maxlon: 16.2, maxlat: 49}))
      assert.equal(result, 1)

      result = ob.intersects(new BoundingBox({ minlon: 16.33894443511963, minlat: 48.19965146865885, maxlon: 16.33899539709091, maxlat: 48.19968007331587 }))
      assert.equal(result, 1) // (inside of the hole)

      result = ob.intersects(new BoundingBox({ minlon: 16.338808983564373, minlat: 48.19949682445519, maxlon: 16.33886530995369, maxlat: 48.199535262075436 }))
      assert.equal(result, 1) // (inside building area)

      result = ob.intersects(new BoundingBox({ minlon: 16.338711082935333, minlat: 48.1994190552284, maxlon: 16.338735222816467, maxlat: 48.19943872102103}))
      assert.equal(result, 1) // (outside building area)

      result = ob.intersects(new BoundingBox({ minlon: 16.339346766471863, minlat: 48.19963001515559, maxlon: 16.33941650390625, maxlat: 48.199672922153106 }))
      assert.equal(result, 1) // (intersecting outline)

      result = ob.intersects(new BoundingBox({ minlon: 16.33936285972595, minlat: 48.19949771835367, maxlon: 16.339470148086548, maxlat: 48.199565654591936 }))
      assert.equal(result, 1) // (intersecting corner)

      done()
    })
  })
})
