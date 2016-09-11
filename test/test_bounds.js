var assert = require('assert')
var OverpassBounds = require('../src/OverpassBounds')
var bounds1, bounds2, bounds3, bounds4, bounds5

describe('OverpassBounds', function() {
  it('create', function(done) {
    bounds1 = new OverpassBounds({
      minlat: 48,
      minlon: 16,
      maxlat: 49,
      maxlon: 17
    })
    assert.deepEqual(
      {"minlat":48,"minlon":16,"maxlat":49,"maxlon":17},
      bounds1.bounds
    )

    bounds2 = new OverpassBounds({
      minlat: 46,
      minlon: 16,
      maxlat: 47,
      maxlon: 17
    })
    assert.deepEqual(
      {"minlat":46,"minlon":16,"maxlat":47,"maxlon":17},
      bounds2.bounds
    )

    // note: minlat/maxlat interchanged
    bounds3 = new OverpassBounds({
      minlat: 48.2,
      minlon: 16,
      maxlat: 47.2,
      maxlon: 17
    })
    assert.deepEqual(
      {"minlat":47.2,"minlon":16,"maxlat":48.2,"maxlon":17},
      bounds3.bounds
    )

    bounds4 = new OverpassBounds({
      lat: 48.1,
      lon: 16.1
    })
    assert.deepEqual(
      {"minlat":48.1,"minlon":16.1,"maxlat":48.1,"maxlon":16.1},
      bounds4.bounds
    )

    bounds5 = new OverpassBounds({
      lat: 48.2,
      lon: 16.2
    })
    assert.deepEqual(
      {"minlat":48.2,"minlon":16.2,"maxlat":48.2,"maxlon":16.2},
      bounds5.bounds
    )

    done()
  })

  it('create from OverpassBounds', function(done) {
    var b = new OverpassBounds(bounds1)
    assert.deepEqual(
      {"minlat":48,"minlon":16,"maxlat":49,"maxlon":17},
      b.bounds
    )

    done()
  })

  it('intersects', function(done) {
    assert.equal(false, bounds1.intersects(bounds2))
    assert.equal(true, bounds1.intersects(bounds3))
    assert.equal(true, bounds1.intersects(bounds4))
    assert.equal(true, bounds1.intersects(bounds5))
    assert.equal(false, bounds2.intersects(bounds5))
    assert.equal(true, bounds3.intersects(bounds5))

    done()
  })

})
