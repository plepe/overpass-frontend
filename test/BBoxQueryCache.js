var assert = require('assert')
var async = require('async')

var OverpassFrontend = require('../src/OverpassFrontend')
var overpassFrontend = new OverpassFrontend()
var BoundingBox = require('boundingbox')
var Filter = require('../src/Filter')
var BBoxQueryCache = require('../src/BBoxQueryCache')
var bboxQueryCache = new BBoxQueryCache(overpassFrontend)

describe('BBoxQueryCache', function() {
  describe('add', function() {
    it('single add', function () {
      bboxQueryCache.clear()

      const filter = new Filter('nwr(48,16,49,17)')
      const descriptor = filter.cacheDescriptors()[0]
      const cache = bboxQueryCache.get(descriptor)

      cache.add(descriptor)

      assert.deepEqual(
        cache.toGeoJSON(),
        {"type":"Polygon","coordinates":[[[16,48],[17,48],[17,49],[16,49],[16,48]]]}
      )
    })

    it('two add', function () {
      bboxQueryCache.clear()

      const filter1 = new Filter('nwr(48,16,49,17)')
      const descriptor1 = filter1.cacheDescriptors()[0]
      const cache1 = bboxQueryCache.get(descriptor1)
      cache1.add(descriptor1)

      const filter2 = new Filter('nwr(48,15.5,49,16)')
      const descriptor2 = filter2.cacheDescriptors()[0]
      const cache2 = bboxQueryCache.get(descriptor2)
      cache2.add(descriptor2)

      assert.deepEqual(
        cache2.toGeoJSON(),
        {"type":"Feature","properties":{},"geometry":{"type":"Polygon","coordinates":[[[15.5,48],[17,48],[17,49],[15.5,49],[15.5,48]]]}}
      )
    })

    it('two add - disconnected', function () {
      bboxQueryCache.clear()

      const filter1 = new Filter('nwr(48,16,49,17)')
      const descriptor1 = filter1.cacheDescriptors()[0]
      const cache1 = bboxQueryCache.get(descriptor1)
      cache1.add(descriptor1)

      const filter2 = new Filter('nwr(48,14,49,15)')
      const descriptor2 = filter2.cacheDescriptors()[0]
      const cache2 = bboxQueryCache.get(descriptor2)
      cache2.add(descriptor2)

      assert.deepEqual(
        cache2.toGeoJSON(),
        {"type":"Feature","properties":{},"geometry":{"type":"MultiPolygon","coordinates":[[[[14,48],[15,48],[15,49],[14,49],[14,48]]],[[[16,48],[17,48],[17,49],[16,49],[16,48]]]]}}
      )
    })
  })

  describe('check', function() {
    it('self', function () {
      bboxQueryCache.clear()

      const filter1 = new Filter('nwr(48,16,49,17)')
      const descriptor1 = filter1.cacheDescriptors()[0]
      const cache1 = bboxQueryCache.get(descriptor1)
      cache1.add(descriptor1)

      const result = cache1.check(descriptor1)
      assert.equal(result, true)
    })

    it('exact match', function () {
      bboxQueryCache.clear()

      const filter1 = new Filter('nwr(48,16,49,17)')
      const descriptor1 = filter1.cacheDescriptors()[0]
      const cache1 = bboxQueryCache.get(descriptor1)
      cache1.add(descriptor1)

      const filter2 = new Filter('nwr(48,16,49,17)')
      const descriptor2 = filter2.cacheDescriptors()[0]
      const cache2 = bboxQueryCache.get(descriptor2)

      const result = cache2.check(descriptor2)
      assert.equal(result, true)
    })

    it('fully within', function () {
      bboxQueryCache.clear()

      const filter1 = new Filter('nwr(48,16,49,17)')
      const descriptor1 = filter1.cacheDescriptors()[0]
      const cache1 = bboxQueryCache.get(descriptor1)
      cache1.add(descriptor1)

      const filter2 = new Filter('nwr(48.2,16.2,48.8,16.8)')
      const descriptor2 = filter2.cacheDescriptors()[0]
      const cache2 = bboxQueryCache.get(descriptor2)

      const result = cache2.check(descriptor2)
      assert.equal(result, true)
    })

    it('larger', function () {
      bboxQueryCache.clear()

      const filter1 = new Filter('nwr(48,16,49,17)')
      const descriptor1 = filter1.cacheDescriptors()[0]
      const cache1 = bboxQueryCache.get(descriptor1)
      cache1.add(descriptor1)

      const filter2 = new Filter('nwr(47.8,15.8,49.2,17.2)')
      const descriptor2 = filter2.cacheDescriptors()[0]
      const cache2 = bboxQueryCache.get(descriptor2)

      const result = cache2.check(descriptor2)
      assert.equal(result, false)
    })

    it('outside', function () {
      bboxQueryCache.clear()

      const filter1 = new Filter('nwr(48,16,49,17)')
      const descriptor1 = filter1.cacheDescriptors()[0]
      const cache1 = bboxQueryCache.get(descriptor1)
      cache1.add(descriptor1)

      const filter2 = new Filter('nwr(47.2,16,47.4,17)')
      const descriptor2 = filter2.cacheDescriptors()[0]
      const cache2 = bboxQueryCache.get(descriptor2)

      const result = cache2.check(descriptor2)
      assert.equal(result, false)
    })

    it('overlap', function () {
      bboxQueryCache.clear()

      const filter1 = new Filter('nwr(48,16,49,17)')
      const descriptor1 = filter1.cacheDescriptors()[0]
      const cache1 = bboxQueryCache.get(descriptor1)
      cache1.add(descriptor1)

      const filter2 = new Filter('nwr(47.8,16,48.4,17)')
      const descriptor2 = filter2.cacheDescriptors()[0]
      const cache2 = bboxQueryCache.get(descriptor2)

      const result = cache2.check(descriptor2)
      assert.equal(result, false)
    })

    it('id', function () {
      bboxQueryCache.clear()
      overpassFrontend.cacheElements.n1 = true

      const filter1 = new Filter('nwr(48,16,49,17)')
      const descriptor1 = filter1.cacheDescriptors()[0]
      const cache1 = bboxQueryCache.get(descriptor1)
      cache1.add(descriptor1)

      const filter2 = new Filter('node(id:1)')
      const descriptor2 = filter2.cacheDescriptors()[0]
      const cache2 = bboxQueryCache.get(descriptor2)
      const result2 = cache2.check(descriptor2)
      assert.equal(result2, true)

      const filter3 = new Filter('node(id:2)')
      const descriptor3 = filter3.cacheDescriptors()[0]
      const cache3 = bboxQueryCache.get(descriptor3)
      const result3 = cache3.check(descriptor3)
      assert.equal(result3, false)
    })

    it('superset', function () {
      bboxQueryCache.clear()

      const filter1 = new Filter('nwr(48,16,49,17)')
      const descriptor1 = filter1.cacheDescriptors()[0]
      const cache1 = bboxQueryCache.get(descriptor1)
      cache1.add(descriptor1)

      const filter2 = new Filter('way(48.2,16,48.4,17)')
      const descriptor2 = filter2.cacheDescriptors()[0]
      const cache2 = bboxQueryCache.get(descriptor2)

      const result = cache2.check(descriptor2)
      assert.equal(result, true)
    })

    it('recurse 1', function () {
      bboxQueryCache.clear()

      const filter1 = new Filter('way(48,16,49,17);node(w);')
      const descriptor1 = filter1.cacheDescriptors()[0]
      console.log(descriptor1)
      const cache1 = bboxQueryCache.get(descriptor1)
      cache1.add(descriptor1)

      const filter2 = new Filter('way(48.2,16.2,48.8,16.8);node(w);')
      const descriptor2 = filter2.cacheDescriptors()[0]
      const cache2 = bboxQueryCache.get(descriptor2)
      const result2 = cache2.check(descriptor2)
      assert.equal(result2, true)
      console.log(3)

      const filter3 = new Filter('way(47.2,16.2,47.8,16.8);node(w);')
      const descriptor3 = filter3.cacheDescriptors()[0]
      const cache3 = bboxQueryCache.get(descriptor3)
      const result3 = cache3.check(descriptor3)
      assert.equal(result3, false)
    })

    it('recurse with id', function () {
      bboxQueryCache.clear()
      overpassFrontend.cacheElements.n1 = true

      const filter1 = new Filter('relation[route=bus];nwr(r)(48,16,49,17)')
      const descriptor1 = filter1.cacheDescriptors()[0]
      const cache1 = bboxQueryCache.get(descriptor1)
      cache1.add(descriptor1)

      const filter2 = new Filter('relation[route=bus];node(r)(id:1)')
      const descriptor2 = filter2.cacheDescriptors()[0]
      const cache2 = bboxQueryCache.get(descriptor2)
      const result2 = cache2.check(descriptor2)
      assert.equal(result2, true)

      const filter3 = new Filter('relation[route=bus];node(r)(id:2)')
      const descriptor3 = filter3.cacheDescriptors()[0]
      const cache3 = bboxQueryCache.get(descriptor3)
      const result3 = cache3.check(descriptor3)
      assert.equal(result3, false)

      const filter4 = new Filter('relation[route=tram];node(r)(id:1)')
      const descriptor4 = filter3.cacheDescriptors()[0]
      const cache4 = bboxQueryCache.get(descriptor4)
      const result4 = cache4.check(descriptor4)
      assert.equal(result4, false)
    })

  })
})

