const assert = require('assert').strict
const BoundingBox = require('boundingbox')

const OverpassRelation = require('../src/OverpassRelation')
const OverpassFrontend = require('..')
const testIntersects = require('../src/testIntersects')

const id = 'r3237099'
const example = {
  "type": "relation",
  "id": 3237099,
  "timestamp": "2013-09-30T16:54:29Z",
  "version": 2,
  "changeset": 18114098,
  "user": "Verdy_p",
  "uid": 90780,
  "bounds": {
    "minlat": 65.8635488,
    "minlon": 179.9918953,
    "maxlat": 65.8660500,
    "maxlon": -179.9872242
  },
  "members": [
    {
      "type": "way",
      "ref": 31254026,
      "role": "outer",
      "geometry": [
         { "lat": 65.8660500, "lon": 180.0000000 },
         { "lat": 65.8656870, "lon": 179.9993428 },
         { "lat": 65.8654192, "lon": 179.9985171 },
         { "lat": 65.8654691, "lon": 179.9980514 },
         { "lat": 65.8656684, "lon": 179.9976924 },
         { "lat": 65.8656932, "lon": 179.9967600 },
         { "lat": 65.8657772, "lon": 179.9961839 },
         { "lat": 65.8655057, "lon": 179.9950898 },
         { "lat": 65.8650905, "lon": 179.9939821 },
         { "lat": 65.8645748, "lon": 179.9933531 },
         { "lat": 65.8642209, "lon": 179.9918953 },
         { "lat": 65.8639992, "lon": 179.9919931 },
         { "lat": 65.8638760, "lon": 179.9926604 },
         { "lat": 65.8639219, "lon": 179.9938773 },
         { "lat": 65.8638153, "lon": 179.9949714 },
         { "lat": 65.8635867, "lon": 179.9961186 },
         { "lat": 65.8635488, "lon": 179.9975700 },
         { "lat": 65.8636742, "lon": 179.9987296 },
         { "lat": 65.8637000, "lon": 180.0000000 }
      ]
    },
    {
      "type": "way",
      "ref": 239992354,
      "role": "outer",
      "geometry": [
         { "lat": 65.8637000, "lon": 180.0000000 },
         { "lat": 65.8660500, "lon": 180.0000000 }
      ]
    },
    {
      "type": "way",
      "ref": 43019950,
      "role": "outer",
      "geometry": [
         { "lat": 65.8637000, "lon": -180.0000000 },
         { "lat": 65.8637649, "lon": -179.9979505 },
         { "lat": 65.8635833, "lon": -179.9913137 },
         { "lat": 65.8640706, "lon": -179.9884861 },
         { "lat": 65.8645484, "lon": -179.9872242 },
         { "lat": 65.8652460, "lon": -179.9872476 },
         { "lat": 65.8654657, "lon": -179.9882992 },
         { "lat": 65.8655804, "lon": -179.9932066 },
         { "lat": 65.8659435, "lon": -179.9965016 },
         { "lat": 65.8660295, "lon": -179.9978336 },
         { "lat": 65.8660500, "lon": -180.0000000 }
      ]
    },
    {
      "type": "way",
      "ref": 240006043,
      "role": "outer",
      "geometry": [
         { "lat": 65.8660500, "lon": -180.0000000 },
         { "lat": 65.8637000, "lon": -180.0000000 }
      ]
    }
  ],
  "tags": {
    "natural": "water",
    "type": "multipolygon"
  }
}

const boundingboxes = {
  'wrap': new BoundingBox({ minlon: 179, minlat: 65, maxlon: -179, maxlat: 66 }),
  'outside left': new BoundingBox({ minlon: 178, minlat: 65, maxlon: 179, maxlat: 66 }),
  'outside right': new BoundingBox({ minlon: -179, minlat: 65, maxlon: -178, maxlat: 66 }),
  'inside left': new BoundingBox({ minlon: 179.99660968780518, minlat: 65.86440853577867, maxlon: 179.99776840209958, maxlat: 65.86475949285342 }),
  'inside right': new BoundingBox({ minlon: -179.99545097351074, minlat: 65.86440853577867, maxlon: -179.99446392059326, maxlat: 65.86475949285342 }),
  'inside span lon180': new BoundingBox({ minlon: 179.99927043914795, minlat: 65.86440853577867, maxlon: -179.99914169311523, maxlat: 65.86475949285342 }),
  'border left': new BoundingBox({ minlon: 179.99660968780518, minlat: 65.86528591946968, maxlon: 179.99776840209958, maxlat: 65.86684758824924 }),
  'border right': new BoundingBox({ minlon: -179.99545097351074, minlat: 65.86528591946968, maxlon: -179.99446392059326, maxlat: 65.86684758824924 }),
  'border span lon180': new BoundingBox({ minlon: 179.99927043914795, minlat: 65.86528591946968, maxlon: -179.99914169311523, maxlat: 65.86684758824924 }),
  'geojson wrap': { type: 'Feature', geometry: { type: 'MultiPolygon', coordinates: [[[[179, 65], [180, 65], [180, 66], [179, 66], [179, 65]]], [[[-180, 65], [-179, 65], [-179, 66], [-180, 66], [-180, 65]]]] } },
  'geojson inside': { type: 'Feature', geometry: { type: 'MultiPolygon', coordinates: [[[[179.99927043914795, 65.86440853577867], [180, 65.86440853577867], [180, 65.86475949285342], [179.99927043914795, 65.86475949285342], [179.99927043914795, 65.86440853577867]]], [[[-180, 65.86440853577867], [-179.99914169311523, 65.86440853577867], [-179.99914169311523, 65.86475949285342], [-180, 65.86475949285342], [-180, 65.86440853577867]]]] } },
  'geojson outside left': { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[179.9979829788208, 65.86564563811554], [179.9987554550171, 65.8656105438354], [179.9986696243286, 65.86586497627945], [179.9979829788208, 65.86564563811554]]] } },
  'geojson inside left': { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[179.99512910842896, 65.8643471177973], [179.99699592590332, 65.86417163704091], [179.99648094177243, 65.86472439736187], [179.99512910842896, 65.8643471177973]]] } },
  'geojson intersect border left': { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[179.99300479888916, 65.86506657635815], [179.99264001846313, 65.86465420623477], [179.99431371688843, 65.86466298013616], [179.99300479888916, 65.86506657635815]]] } },
  'geojson outside right': { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[-179.99176025390625, 65.86563686455], [-179.99042987823486, 65.86618081994308], [-179.9925327301025, 65.86616327317483], [-179.99176025390625, 65.86563686455]]] } },
  'geojson inside right': { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[-179.99768257141113, 65.86482968369263], [-179.9966526031494, 65.86433834378796], [-179.99536514282227, 65.86479458829702], [-179.99768257141113, 65.86482968369263]]] } },
  'geojson intersect border right': { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[-179.98948574066162, 65.86430324772064], [-179.99115943908689, 65.86310995288424], [-179.9883270263672, 65.86303975734303], [-179.98948574066162, 65.86430324772064]]] } }
}


describe('OverpassRelation (multipolygon spanning lon180)', function () {
  describe('with geometry', function () {
    const ob = new OverpassRelation(id)
    ob.overpass = new OverpassFrontend('')
    ob.updateData(example, { properties: 0 })

    it('properties', function () {
      assert.equal(ob.properties, 63)
    })

    it('bounds', function () {
      assert.equal(ob.bounds.toLatLonString(), '65.8635488,179.9918953,65.86605,-179.9872242')
      assert.deepEqual(ob.bounds.toGeoJSON(), {
        "type":"Feature",
        "properties": {},
        "geometry": {
          "type":"MultiPolygon",
          "coordinates": [
            [[[179.9918953,65.8635488],[180,65.8635488],[180,65.86605],[179.9918953,65.86605],[179.9918953,65.8635488]]],
            [[[-180,65.8635488],[-179.9872242,65.8635488],[-179.9872242,65.86605],[-180,65.86605],[-180,65.8635488]]]
          ]
        }
      })
    })

    it('intersect()', function () {
      const expected = {
        'wrap': 2,
        'outside left': 0,
        'outside right': 0,
        'inside left': 2,
        'inside right': 2,
        'inside span lon180': 2,
        'border left': 2,
        'border right': 2,
        'border span lon180': 2,
        'geojson wrap': 2,
        'geojson inside': 2,
        'geojson outside left': 0,
        'geojson inside left': 2,
        'geojson intersect border left': 2,
        'geojson outside right': 0,
        'geojson inside right': 2,
        'geojson intersect border right': 2
      }

      testIntersects({ ob, boundingboxes, expected })
    })
  })

  describe('with geometry but without bounds', function () {
    const ob = new OverpassRelation(id)
    ob.overpass = new OverpassFrontend('')
    let d = JSON.parse(JSON.stringify(example))
    delete d.bounds
    ob.updateData(d, { properties: 0 })

    it('properties', function () {
      assert.equal(ob.properties, 63)
    })

    it('bounds', function () {
      assert.equal(ob.bounds.toLatLonString(), '65.8635488,179.9918953,65.86605,-179.9872242')
      assert.deepEqual(ob.bounds.toGeoJSON(), {
        "type":"Feature",
        "properties": {},
        "geometry": {
          "type":"MultiPolygon",
          "coordinates": [
            [[[179.9918953,65.8635488],[180,65.8635488],[180,65.86605],[179.9918953,65.86605],[179.9918953,65.8635488]]],
            [[[-180,65.8635488],[-179.9872242,65.8635488],[-179.9872242,65.86605],[-180,65.86605],[-180,65.8635488]]]
          ]
        }
      })
    })
  })

  describe('with bounds only', function () {
    const ob = new OverpassRelation(id)
    ob.overpass = new OverpassFrontend('')
    let d = JSON.parse(JSON.stringify(example))
    d.members.forEach(m => delete m.geometry)
    ob.updateData(d, { properties: 7 })

    it('properties', function () {
      assert.equal(ob.properties, 47)
    })

    it('bounds', function () {
      assert.equal(ob.bounds.toLatLonString(), '65.8635488,179.9918953,65.86605,-179.9872242')
      assert.deepEqual(ob.bounds.toGeoJSON(), {
        "type":"Feature",
        "properties": {},
        "geometry": {
          "type":"MultiPolygon",
          "coordinates": [
            [[[179.9918953,65.8635488],[180,65.8635488],[180,65.86605],[179.9918953,65.86605],[179.9918953,65.8635488]]],
            [[[-180,65.8635488],[-179.9872242,65.8635488],[-179.9872242,65.86605],[-180,65.86605],[-180,65.8635488]]]
          ]
        }
      })
    })

    it('intersect()', function () {
      const expected = {
        'wrap': 2,
        'outside left': 0,
        'outside right': 0,
        'inside left': 1,
        'inside right': 1,
        'inside span lon180': 1,
        'border left': 1,
        'border right': 1,
        'border span lon180': 1,
        'geojson wrap': 2,
        'geojson inside': 1,
        'geojson outside left': 1,
        'geojson inside left': 1,
        'geojson intersect border left': 1,
        'geojson outside right': 1,
        'geojson inside right': 1,
        'geojson intersect border right': 1
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
        'outside left': 1,
        'outside right': 1,
        'inside left': 1,
        'inside right': 1,
        'inside span lon180': 1,
        'border left': 1,
        'border right': 1,
        'border span lon180': 1,
        'geojson wrap': 1,
        'geojson inside': 1,
        'geojson outside left': 1,
        'geojson inside left': 1,
        'geojson intersect border left': 1,
        'geojson outside right': 1,
        'geojson inside right': 1,
        'geojson intersect border right': 1
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
