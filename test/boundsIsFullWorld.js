const assert = require('assert')
const BoundingBox = require('boundingbox')

const boundsIsFullWorld = require('../src/boundsIsFullWorld')

describe('boundsIsFullWorld', function () {
  it('full world', function () {
    assert.equal(boundsIsFullWorld(new BoundingBox(null)), true)
    assert.equal(boundsIsFullWorld(new BoundingBox({ minlat: -90, minlon: -180, maxlat: 90, maxlon: 180 })), true)
  })

  it('part world', function () {
    assert.equal(boundsIsFullWorld(new BoundingBox({ minlat: -90, minlon: -180, maxlat: 90, maxlon: 179 })), false)
  })
})
