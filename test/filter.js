const assert = require('assert')

const Filter = require('../src/Filter')

describe('Filter', function () {
  describe ('input exploded', function () {
    it ('[amenity]', function () {
      var f = new Filter([ { op: 'has_key', key: 'amenity' } ])
      assert.equal(f.toString(), '["amenity"]')
    })

    it ('[amenity=restaurant]', function () {
      var f = new Filter([ { op: '=', key: 'amenity', value: 'restaurant' } ])
      assert.equal(f.toString(), '["amenity"="restaurant"]')
    })
  })

  describe ('match', function () {
    it ('[amenity]', function () {
      var f = new Filter([ { op: 'has_key', key: 'amenity' } ])

      var r = f.match({ tags: { amenity: 'restaurant' } })
      assert.equal(r, true, 'Object should match')
      var r = f.match({ tags: { amenity: 'cafe' } })
      assert.equal(r, true, 'Object should match')
      var r = f.match({ tags: { shop: 'supermarket' } })
      assert.equal(r, false, 'Object should not match')
    })

    it ('[amenity=restaurant]', function () {
      var f = new Filter([ { op: '=', key: 'amenity', value: 'restaurant' } ])

      var r = f.match({ tags: { amenity: 'restaurant' } })
      assert.equal(r, true, 'Object should match')
      var r = f.match({ tags: { amenity: 'cafe' } })
      assert.equal(r, false, 'Object should not match')
      var r = f.match({ tags: { shop: 'supermarket' } })
      assert.equal(r, false, 'Object should not match')
    })
  })
})
