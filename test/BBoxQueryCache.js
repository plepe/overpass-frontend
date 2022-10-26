var assert = require('assert')
var async = require('async')

var BoundingBox = require('boundingbox')
var BBoxQueryCache = require('../src/BBoxQueryCache')

describe('BBoxQueryCache', function() {
  describe('add', function() {
    it('single add', function () {
      var area = new BBoxQueryCache()

      area.add({
            minlon: 16,
            minlat: 48,
            maxlon: 17,
            maxlat: 49
          })
      

      assert.deepEqual(
        area.toGeoJSON(),
        {"type":"Feature","properties":{},"geometry":{"type":"Polygon","coordinates":[[[16,48],[17,48],[17,49],[16,49],[16,48]]]}}
      )
    })

    it('two add', function () {
      var area = new BBoxQueryCache()

      area.add({
            minlon: 16,
            minlat: 48,
            maxlon: 17,
            maxlat: 49
          })
      area.add({
            minlon: 15.5,
            minlat: 48,
            maxlon: 16,
            maxlat: 49
          })
      
      assert.deepEqual(
        area.toGeoJSON(),
        {"type":"Feature","properties":{},"geometry":{"type":"Polygon","coordinates":[[[15.5,48],[17,48],[17,49],[15.5,49],[15.5,48]]]}}
      )
    })

    it('init with area, single add', function () {
      var area = new BBoxQueryCache()
      area.add({"type":"Feature","properties":{},"geometry":{"type":"Polygon","coordinates":[[[16,48],[17,48],[17,49],[16,49],[16,48]]]}})
      area.add({
            minlon: 15.5,
            minlat: 48,
            maxlon: 16,
            maxlat: 49
          })
      
      assert.deepEqual(
        area.toGeoJSON(),
        {"type":"Feature","properties":{},"geometry":{"type":"Polygon","coordinates":[[[15.5,48],[17,48],[17,49],[15.5,49],[15.5,48]]]}}
      )
    })

    it('two add - disconnected', function () {
      var area = new BBoxQueryCache()

      area.add({
            minlon: 16,
            minlat: 48,
            maxlon: 17,
            maxlat: 49
          })
      area.add({
            minlon: 14,
            minlat: 48,
            maxlon: 15,
            maxlat: 49
          })
      
      assert.deepEqual(
        area.toGeoJSON(),
        {"type":"Feature","properties":{},"geometry":{"type":"MultiPolygon","coordinates":[[[[14,48],[15,48],[15,49],[14,49],[14,48]]],[[[16,48],[17,48],[17,49],[16,49],[16,48]]]]}}
      )
    })

    it('three add', function () {
      var area = new BBoxQueryCache()

      area.add({
            minlon: 16,
            minlat: 48,
            maxlon: 17,
            maxlat: 49
          })
      area.add({
            minlon: 14,
            minlat: 48,
            maxlon: 15,
            maxlat: 49
          })
      area.add({
            minlon: 14.5,
            minlat: 48.4,
            maxlon: 16.5,
            maxlat: 48.6
          })
      
      assert.deepEqual(
        area.toGeoJSON(),
        {"type":"Feature","properties":{},"geometry":{"type":"Polygon","coordinates":[[[14,48],[15,48],[15,48.4],[16,48.4],[16,48],[17,48],[17,49],[16,49],[16,48.6],[15,48.6],[15,49],[14,49],[14,48]]]}}
      )
    })
  })

  describe('check', function() {
    it('exact match', function () {
      var area = new BBoxQueryCache()
      area.add({"type":"Feature","properties":{},"geometry":{"type":"Polygon","coordinates":[[[16,48],[17,48],[17,49],[16,49],[16,48]]]}})

      var result = area.check({
            minlon: 16,
            minlat: 48,
            maxlon: 17,
            maxlat: 49
          })

      assert.equal(result, true)
    })

    it('fully within', function () {
      var area = new BBoxQueryCache()
      area.add({"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[16,48.4],[15,48.4],[15,48],[14,48],[14,49],[15,49],[15,48.6],[16,48.6],[16,49],[17,49],[17,48],[16,48],[16,48.4]]]},"properties":{}})

      var result = area.check({
            minlon: 14.5,
            minlat: 48.5,
            maxlon: 14.6,
            maxlat: 48.6
          })
      
      assert.equal(result, true)
    })

    it('larger', function () {
      var area = new BBoxQueryCache()
      area.add({"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[16,48.4],[15,48.4],[15,48],[14,48],[14,49],[15,49],[15,48.6],[16,48.6],[16,49],[17,49],[17,48],[16,48],[16,48.4]]]},"properties":{}})

      var result = area.check({
            minlon: 13,
            minlat: 47,
            maxlon: 18,
            maxlat: 50
          })
      
      assert.equal(result, false)
    })

    it('outside', function () {
      var area = new BBoxQueryCache()
      area.add({"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[16,48.4],[15,48.4],[15,48],[14,48],[14,49],[15,49],[15,48.6],[16,48.6],[16,49],[17,49],[17,48],[16,48],[16,48.4]]]},"properties":{}})

      var result = area.check({
            minlon: 13.5,
            minlat: 48.5,
            maxlon: 13.6,
            maxlat: 48.6
          })
      
      assert.equal(result, false)
    })

    it('overlap', function () {
      var area = new BBoxQueryCache()
      area.add({"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[16,48.4],[15,48.4],[15,48],[14,48],[14,49],[15,49],[15,48.6],[16,48.6],[16,49],[17,49],[17,48],[16,48],[16,48.4]]]},"properties":{}})

      var result = area.check({
            minlon: 13.5,
            minlat: 48.5,
            maxlon: 14.6,
            maxlat: 48.6
          })
      
      assert.equal(result, false)
    })

    it('another example', function () {
      var area = new BBoxQueryCache()
      area.add({
        maxlat: 48.19953,
        maxlon: 16.33506,
        minlat: 48.198,
        minlon: 16.32581
      })
      area.add({
        maxlat: 48.204,
        maxlon: 16.33106,
        minlat: 48.1994,
        minlon: 16.32281
      })

      var result = area.check({
        maxlat: 48.1998,
        maxlon: 16.33106,
        minlat: 48.1994,
        minlon: 16.32281
      })

      assert.equal(result, true)
    })

  })
})

