const assert = require('assert')

const Filter = require('../src/Filter')

describe('Filter', function () {
  describe ('input exploded', function () {
    it ('nwr[amenity]', function () {
      var f = new Filter([ { op: 'has_key', key: 'amenity' } ])
      assert.equal(f.toString(), 'nwr["amenity"]')
    })

    it ('nwr[amenity=restaurant]', function () {
      var f = new Filter([ { op: '=', key: 'amenity', value: 'restaurant' } ])
      assert.equal(f.toString(), 'nwr["amenity"="restaurant"]')
    })

    it ('nwr[amenity=restaurant][shop]', function () {
      var f = new Filter([ { op: '=', key: 'amenity', value: 'restaurant' }, { op: 'has_key', key: 'shop' } ])
      assert.equal(f.toString(), 'nwr["amenity"="restaurant"]["shop"]')
    })

    it ('nwr[cuisine^asian]', function () {
      var f = new Filter([ { op: 'has', key: 'cuisine', value: 'asian' } ])
      assert.equal(f.toString(), 'nwr["cuisine"~"^(.*;|)asian(|;.*)$"]')
    })

    it ('nwr["amenity"=\'restaurant\']["sh\\"op"]', function () {
      var f = new Filter([ { op: '=', key: 'amenity', value: 'restaurant' }, { op: 'has_key', key: 'sh\"op' } ])
      assert.equal(f.toString(), 'nwr["amenity"="restaurant"]["sh\\"op"]')
    })

    it ('nwr["amenity"=\'restaurant\']["shop"~"super"]', function () {
      var f = new Filter([ { op: '=', key: 'amenity', value: 'restaurant' }, { op: '~', key: 'shop', value: 'super' } ])
      assert.equal(f.toString(), 'nwr["amenity"="restaurant"]["shop"~"super"]')
    })
  })

  describe ('match', function () {
    it ('nwr[amenity]', function () {
      var f = new Filter([ { op: 'has_key', key: 'amenity' } ])

      var r = f.match({ tags: { amenity: 'restaurant' } })
      assert.equal(r, true, 'Object should match')
      var r = f.match({ tags: { amenity: 'cafe' } })
      assert.equal(r, true, 'Object should match')
      var r = f.match({ tags: { shop: 'supermarket' } })
      assert.equal(r, false, 'Object should not match')
    })

    it ('node[amenity=restaurant]', function () {
      var f = new Filter([ { type: 'node' }, { op: '=', key: 'amenity', value: 'restaurant' } ])

      var r = f.match({ type: 'node', tags: { amenity: 'restaurant' } })
      assert.equal(r, true, 'Object should match')
      var r = f.match({ type: 'way', tags: { amenity: 'restaurant' } })
      assert.equal(r, false, 'Object should not match')
      var r = f.match({ type: 'node', tags: { amenity: 'cafe' } })
      assert.equal(r, false, 'Object should not match')
      var r = f.match({ type: 'node', tags: { shop: 'supermarket' } })
      assert.equal(r, false, 'Object should not match')
    })

    it ('nwr[amenity=restaurant][shop]', function () {
      var f = new Filter([ { op: '=', key: 'amenity', value: 'restaurant' }, { op: 'has_key', key: 'shop' } ])

      var r = f.match({ tags: { amenity: 'restaurant' } })
      assert.equal(r, false, 'Object should not match')
      var r = f.match({ tags: { amenity: 'cafe' } })
      assert.equal(r, false, 'Object should not match')
      var r = f.match({ tags: { shop: 'supermarket' } })
      assert.equal(r, false, 'Object should not match')
      var r = f.match({ tags: { amenity: 'restaurant', shop: 'supermarket' } })
      assert.equal(r, true, 'Object should match')
    })

    it ('nwr[cuisine^asian]', function () {
      var f = new Filter([ { op: 'has', key: 'cuisine', value: 'asian' } ])

      var r = f.match({ tags: { amenity: 'restaurant' } })
      assert.equal(r, false, 'Object should not match')
      var r = f.match({ tags: { amenity: 'cafe', cuisine: 'regional' } })
      assert.equal(r, false, 'Object should not match')
      var r = f.match({ tags: { amenity: 'cafe', cuisine: 'regional;kebab' } })
      assert.equal(r, false, 'Object should not match')
      var r = f.match({ tags: { amenity: 'supermarket', cuisine: 'asian' } })
      assert.equal(r, true, 'Object should match')
      var r = f.match({ tags: { amenity: 'supermarket', cuisine: 'kebab;asian' } })
      assert.equal(r, true, 'Object should match')
      var r = f.match({ tags: { amenity: 'supermarket', cuisine: 'asian;kebab' } })
      assert.equal(r, true, 'Object should match')
      var r = f.match({ tags: { amenity: 'supermarket', cuisine: 'kebab;asian;regional' } })
      assert.equal(r, true, 'Object should match')
    })

    it ('nwr[amenity=restaurant][shop~super]', function () {
      var f = new Filter([ { op: '=', key: 'amenity', value: 'restaurant' }, { op: '~', key: 'shop', value: 'super' } ])

      var r = f.match({ tags: { amenity: 'restaurant' } })
      assert.equal(r, false, 'Object should not match')
      var r = f.match({ tags: { amenity: 'cafe' } })
      assert.equal(r, false, 'Object should not match')
      var r = f.match({ tags: { shop: 'supermarket' } })
      assert.equal(r, false, 'Object should not match')
      var r = f.match({ tags: { amenity: 'restaurant', shop: 'supermarket' } })
      assert.equal(r, true, 'Object should match')
      var r = f.match({ tags: { amenity: 'restaurant', shop: 'grocery' } })
      assert.equal(r, false, 'Object should not match')
    })

  })

  describe('toQl', function () {
    it ('nwr[amenity]', function () {
      var f = new Filter([ { op: 'has_key', key: 'amenity' } ])

      var r = f.toQl()
      assert.equal(r, '(node["amenity"];way["amenity"];relation["amenity"];)')

      r = f.toQl({
        inputSet: '.result'
      })
      assert.equal(r, '(node.result["amenity"];way.result["amenity"];relation.result["amenity"];)')
    })

    it ('nwr[amenity=restaurant]', function () {
      var f = new Filter([ { op: '=', key: 'amenity', value: 'restaurant' } ])

      var r = f.toQl()
      assert.equal(r, '(node["amenity"="restaurant"];way["amenity"="restaurant"];relation["amenity"="restaurant"];)')

      r = f.toQl({
        inputSet: '.result'
      })
      assert.equal(r, '(node.result["amenity"="restaurant"];way.result["amenity"="restaurant"];relation.result["amenity"="restaurant"];)')
    })

    it ('nwr[amenity=restaurant][shop]', function () {
      var f = new Filter([ { op: '=', key: 'amenity', value: 'restaurant' }, { op: 'has_key', key: 'shop' } ])

      var r = f.toQl()
      assert.equal(r, '(node["amenity"="restaurant"]["shop"];way["amenity"="restaurant"]["shop"];relation["amenity"="restaurant"]["shop"];)')

      r = f.toQl({
        inputSet: '.result'
      })
      assert.equal(r, '(node.result["amenity"="restaurant"]["shop"];way.result["amenity"="restaurant"]["shop"];relation.result["amenity"="restaurant"]["shop"];)')
    })

    it ('[cuisine^asian]', function () {
      var f = new Filter([ { op: 'has', key: 'cuisine', value: 'asian' } ])

      var r = f.toQl()
      assert.equal(r, '(node["cuisine"~"^(.*;|)asian(|;.*)$"];way["cuisine"~"^(.*;|)asian(|;.*)$"];relation["cuisine"~"^(.*;|)asian(|;.*)$"];)')

      r = f.toQl({
        inputSet: '.result'
      })
      assert.equal(r, '(node.result["cuisine"~"^(.*;|)asian(|;.*)$"];way.result["cuisine"~"^(.*;|)asian(|;.*)$"];relation.result["cuisine"~"^(.*;|)asian(|;.*)$"];)')
    })
  })

  describe ('parse', function () {
    it ('nwr[amenity]', function () {
      var f = new Filter('nwr[amenity]')
      assert.equal(f.toString(), 'nwr["amenity"]')
    })

    it ('nwr[amenity=restaurant]', function () {
      var f = new Filter('nwr[amenity=restaurant]')
      assert.equal(f.toString(), 'nwr["amenity"="restaurant"]')
    })

    it ('nwr[amenity=restaurant][shop]', function () {
      var f = new Filter('nwr[amenity=restaurant][shop]')
      assert.equal(f.toString(), 'nwr["amenity"="restaurant"]["shop"]')
    })

    it ('nwr[cuisine^asian]', function () {
      var f = new Filter('nwr[cuisine^asian]')
      assert.equal(f.toString(), 'nwr["cuisine"~"^(.*;|)asian(|;.*)$"]')
    })

    it ('nwr["amenity"=\'restaurant\']["sh\\"op"]', function () {
      var f = new Filter('nwr["amenity"=\'restaurant\']["sh\\"op"]')
      assert.equal(f.toString(), 'nwr["amenity"="restaurant"]["sh\\"op"]')
    })
  })
})
