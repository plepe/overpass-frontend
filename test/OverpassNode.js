const assert = require('assert').strict
const BoundingBox = require('boundingbox')

const OverpassNode = require('../src/OverpassNode')

describe('OverpassNode', function () {
  describe('with geometry', function () {
    const node = new OverpassNode('n3037893171')
    node.updateData({
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
    }, { properties: 63 })

    it('intersect() -- with BoundingBox', function (done) {
      let result = node.intersects(new BoundingBox({minlon: 16, minlat: 48, maxlon: 17, maxlat: 49}))
      assert.equal(result, 2)

      result = node.intersects(new BoundingBox({minlon: 16, minlat: 48, maxlon: 16.2, maxlat: 49}))
      assert.equal(result, 0)

      done()
    })
  })

  describe('without geometry', function () {
    const node = new OverpassNode('n3037893171')
    node.updateData({
      "type": "node",
      "id": 3037893171,
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
    }, { properties: 7 })

    it('intersect() -- with BoundingBox', function (done) {
      let result = node.intersects(new BoundingBox({minlon: 16, minlat: 48, maxlon: 17, maxlat: 49}))
      assert.equal(result, 1)

      result = node.intersects(new BoundingBox({minlon: 16, minlat: 48, maxlon: 16.2, maxlat: 49}))
      assert.equal(result, 1)

      done()
    })
  })
})
