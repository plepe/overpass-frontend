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

    it ('  (node[amenity=cafe][cuisine=ice_cream];node[amenity=ice_cream];node[shop=ice_cream];)', function () {
      var f = new Filter({ "or": [
	[ { "type": "node" }, { "key": "amenity", "op": "=", "value": "cafe" }, { "key": "cuisine", "op": "=", "value": "ice_cream" } ],
	[ { "type": "node" }, { "key": "amenity", "op": "=", "value": "ice_cream" } ],
	[ { "type": "node" }, { "key": "shop", "op": "=", "value": "ice_cream" } ]
      ] })

      assert.equal(f.toString(), '(node["amenity"="cafe"]["cuisine"="ice_cream"];node["amenity"="ice_cream"];node["shop"="ice_cream"];)')
    })

    it ('node["amenity"="cafe"];node._["cuisine"="ice_cream"]', function () {
      var f = new Filter({ "and": [
	[ { "type": "node" }, { "key": "amenity", "op": "=", "value": "cafe" } ],
	[ { "type": "node" }, { "key": "cuisine", "op": "=", "value": "ice_cream" } ]
      ] })

      assert.equal(f.toString(), 'node["amenity"="cafe"]->.a0;node.a0["cuisine"="ice_cream"]')
    })

    it ('nwr[~wikipedia~"."]', function () {
      var f = new Filter([ { keyRegexp: true, op: 'has_key', key: 'wikipedia' } ])
      assert.equal(f.toString(), 'nwr[~"wikipedia"~"."]')
    })

    it ('nwr[~wikipedia~"foo"]', function () {
      var f = new Filter([ { keyRegexp: true, op: '~', key: 'wikipedia', value: 'foo' } ])
      assert.equal(f.toString(), 'nwr[~"wikipedia"~"foo"]')
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

    it ('(node[amenity=cafe][cuisine=ice_cream];node[amenity=ice_cream];node[shop=ice_cream];)', function () {
      var f = new Filter({ "or": [
	[ { "type": "node" }, { "key": "amenity", "op": "=", "value": "cafe" }, { "key": "cuisine", "op": "=", "value": "ice_cream" } ],
	[ { "type": "node" }, { "key": "amenity", "op": "=", "value": "ice_cream" } ],
	[ { "type": "node" }, { "key": "shop", "op": "=", "value": "ice_cream" } ]
      ] })

      var r = f.match({ type: 'node', tags: { amenity: 'restaurant' } })
      assert.equal(r, false, 'Object should not match')
      var r = f.match({ type: 'way', tags: { amenity: 'restaurant' } })
      assert.equal(r, false, 'Object should not match')
      var r = f.match({ type: 'node', tags: { amenity: 'ice_cream' } })
      assert.equal(r, true, 'Object should match')
      var r = f.match({ type: 'way', tags: { amenity: 'ice_cream' } })
      assert.equal(r, false, 'Object should not match')
      var r = f.match({ type: 'node', tags: { amenity: 'cafe' } })
      assert.equal(r, false, 'Object should not match')
      var r = f.match({ type: 'node', tags: { amenity: 'cafe', cuisine: 'kebab' } })
      assert.equal(r, false, 'Object should not match')
      var r = f.match({ type: 'node', tags: { amenity: 'cafe', cuisine: 'ice_cream' } })
      assert.equal(r, true, 'Object should match')
      var r = f.match({ type: 'node', tags: { shop: 'supermarket' } })
      assert.equal(r, false, 'Object should not match')
    })

    it ('node["amenity"="cafe"];node._["cuisine"="ice_cream"]', function () {
      var f = new Filter({ "and": [
	[ { "type": "node" }, { "key": "amenity", "op": "=", "value": "cafe" } ],
	[ { "type": "node" }, { "key": "cuisine", "op": "=", "value": "ice_cream" } ]
      ] })

      var r = f.match({ type: 'node', tags: { amenity: 'cafe' } })
      assert.equal(r, false, 'Object should not match')
      var r = f.match({ type: 'node', tags: { cuisine: 'ice_cream' } })
      assert.equal(r, false, 'Object should not match')
      var r = f.match({ type: 'node', tags: { amenity: 'cafe', cuisine: 'ice_cream' } })
      assert.equal(r, true, 'Object should match')
      var r = f.match({ type: 'way', tags: { amenity: 'cafe', cuisine: 'ice_cream', name: 'bar' } })
      assert.equal(r, false, 'Object should not match')
      var r = f.match({ type: 'node', tags: { amenity: 'restaurant', cuisine: 'ice_cream' } })
      assert.equal(r, false, 'Object should not match')
    })

    it ('nwr[~wikipedia~"."]', function () {
      var f = new Filter([ { keyRegexp: true, op: 'has_key', key: 'wikipedia' } ])

      var r = f.match({ tags: { amenity: 'restaurant' } })
      assert.equal(r, false, 'Object should not match')
      var r = f.match({ tags: { wikipedia: 'test' } })
      assert.equal(r, true, 'Object should match')
      var r = f.match({ tags: { 'de:wikipedia': 'test' } })
      assert.equal(r, true, 'Object should match')
      var r = f.match({ tags: { 'wikipedia:de': 'test' } })
      assert.equal(r, true, 'Object should match')
    })

    it ('nwr[~wikipedia~"foo"]', function () {
      var f = new Filter([ { keyRegexp: true, op: '~', key: 'wikipedia', value: 'foo' } ])

      var r = f.match({ tags: { amenity: 'restaurant' } })
      assert.equal(r, false, 'Object should not match')
      var r = f.match({ tags: { wikipedia: 'test' } })
      assert.equal(r, false, 'Object should not match')
      var r = f.match({ tags: { 'de:wikipedia': 'test' } })
      assert.equal(r, false, 'Object should not match')
      var r = f.match({ tags: { 'wikipedia:de': 'test' } })
      assert.equal(r, false, 'Object should not match')
      var r = f.match({ tags: { wikipedia: 'foobar' } })
      assert.equal(r, true, 'Object should match')
      var r = f.match({ tags: { 'de:wikipedia': 'foobar' } })
      assert.equal(r, true, 'Object should match')
      var r = f.match({ tags: { 'wikipedia:de': 'foobar' } })
      assert.equal(r, true, 'Object should match')
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

    it ('(node[amenity=cafe][cuisine=ice_cream];node[amenity=ice_cream];nwr[shop=ice_cream];)', function () {
      var f = new Filter({ "or": [
	[ { "type": "node" }, { "key": "amenity", "op": "=", "value": "cafe" }, { "key": "cuisine", "op": "=", "value": "ice_cream" } ],
	[ { "type": "node" }, { "key": "amenity", "op": "=", "value": "ice_cream" } ],
	[ { "key": "shop", "op": "=", "value": "ice_cream" } ]
      ] })

      var r = f.toQl({
        inputSet: '.result'
      })
      assert.equal(r, '(node.result["amenity"="cafe"]["cuisine"="ice_cream"];node.result["amenity"="ice_cream"];node.result["shop"="ice_cream"];way.result["shop"="ice_cream"];relation.result["shop"="ice_cream"];)')
    })

    it ('node["amenity"="cafe"];node._["cuisine"="ice_cream"]', function () {
      var f = new Filter({ "and": [
	[ { "type": "node" }, { "key": "amenity", "op": "=", "value": "cafe" } ],
	[ { "type": "node" }, { "key": "cuisine", "op": "=", "value": "ice_cream" } ]
      ] })

      assert.equal(f.toQl(), '(node["amenity"="cafe"];)->.a0;(node.a0["cuisine"="ice_cream"];)')
    })

    it ('nwr["amenity"="cafe"];nwr._["cuisine"="ice_cream"]', function () {
      var f = new Filter({ "and": [
	[ { "key": "amenity", "op": "=", "value": "cafe" } ],
        [ { "key": "name", "op": "has_key" } ],
	[ { "key": "cuisine", "op": "=", "value": "ice_cream" } ]
      ] })

      assert.equal(f.toQl(), '(node["amenity"="cafe"];way["amenity"="cafe"];relation["amenity"="cafe"];)->.a0;(node.a0["name"];way.a0["name"];relation.a0["name"];)->.a0;(node.a0["cuisine"="ice_cream"];way.a0["cuisine"="ice_cream"];relation.a0["cuisine"="ice_cream"];)')
    })

    it ('nwr[~wikipedia~"."]', function () {
      var f = new Filter([ { keyRegexp: true, op: 'has_key', key: 'wikipedia' } ])

      var r = f.toQl()
      assert.equal(r, '(node[~"wikipedia"~"."];way[~"wikipedia"~"."];relation[~"wikipedia"~"."];)')
    })

    it ('nwr[~wikipedia~"foo"]', function () {
      var f = new Filter([ { keyRegexp: true, op: '~', key: 'wikipedia', value: 'foo' } ])

      var r = f.toQl()
      assert.equal(r, '(node[~"wikipedia"~"foo"];way[~"wikipedia"~"foo"];relation[~"wikipedia"~"foo"];)')
    })
  })

  describe('toLokijs', function () {
    it ('nwr[amenity]', function () {
      var f = new Filter([ { op: 'has_key', key: 'amenity' } ])

      var r = f.toLokijs()
      assert.deepEqual(r, { 'tags.amenity': { $exists: true }})
    })

    it ('nwr[amenity=restaurant]', function () {
      var f = new Filter([ { op: '=', key: 'amenity', value: 'restaurant' } ])

      var r = f.toLokijs()
      assert.deepEqual(r, { 'tags.amenity': { $eq: 'restaurant' } })
    })

    it ('nwr[amenity][amenity!=restaurant]', function () {
      var f = new Filter([ { op: 'has_key', key: 'amenity' }, { op: '!=', key: 'amenity', value: 'restaurant' } ])

      var r = f.toLokijs()
      assert.deepEqual(r, { 'tags.amenity': { $and: [ { $exists: true }, { $ne: 'restaurant' } ] } } )
    })

    it ('nwr[amenity][amenity!=cafe][amenity!=restaurant]', function () {
      var f = new Filter([ { op: 'has_key', key: 'amenity' }, { op: '!=', key: 'amenity', value: 'cafe' }, { op: '!=', key: 'amenity', value: 'restaurant' } ])

      var r = f.toLokijs()
      assert.deepEqual(r, { 'tags.amenity': { $and: [ { $exists: true }, { $ne: 'cafe' }, { $ne: 'restaurant' } ] } } )
    })

    it ('nwr[amenity=restaurant][shop]', function () {
      var f = new Filter([ { op: '=', key: 'amenity', value: 'restaurant' }, { op: 'has_key', key: 'shop' } ])

      var r = f.toLokijs()
      assert.deepEqual(r, { 'tags.amenity': { $eq: 'restaurant' }, 'tags.shop': { $exists: true } })
    })

    it ('[cuisine^asian]', function () {
      var f = new Filter([ { op: 'has', key: 'cuisine', value: 'asian' } ])

      var r = f.toLokijs()
      assert.deepEqual(r, { 'tags.cuisine': { $regex: '^(.*;|)asian(|;.*)$' } })
    })

    it ('(node[amenity=cafe][cuisine=ice_cream];node[amenity=ice_cream];nwr[shop=ice_cream];)', function () {
      var f = new Filter({ "or": [
	[ { "type": "node" }, { "key": "amenity", "op": "=", "value": "cafe" }, { "key": "cuisine", "op": "=", "value": "ice_cream" } ],
	[ { "type": "node" }, { "key": "amenity", "op": "=", "value": "ice_cream" } ],
	[ { "key": "shop", "op": "=", "value": "ice_cream" } ]
      ] })

      var r = f.toLokijs()
      assert.deepEqual(r, { $or: [
        { 'type': { $eq: 'node' }, 'tags.amenity': { $eq: 'cafe' }, 'tags.cuisine': { $eq: 'ice_cream' } },
        { 'type': { $eq: 'node' }, 'tags.amenity': { $eq: 'ice_cream' } },
        { 'tags.shop': { $eq: 'ice_cream' } }
      ]})
    })

    it ('nwr[~wikipedia~"."]', function () {
      var f = new Filter([ { keyRegexp: true, op: 'has_key', key: 'wikipedia' } ])

      var r = f.toLokijs()
      assert.deepEqual(r, { needMatch: true })
    })

    it ('node[amenity][~wikipedia~"."]', function () {
      var f = new Filter([ { type: 'node' }, { key: 'amenity', 'op': 'has_key' }, { keyRegexp: true, op: 'has_key', key: 'wikipedia' } ])

      var r = f.toLokijs()
      assert.deepEqual(r, { "type": { $eq: "node" }, "tags.amenity": { "$exists": true }, "needMatch": true })
    })

    it ('nwr[~wikipedia~"foo"]', function () {
      var f = new Filter([ { keyRegexp: true, op: '~', key: 'wikipedia', value: 'foo' } ])

      var r = f.toLokijs()
      assert.deepEqual(r, { needMatch: true })
    })

    it ('nwr[~wikipedia~"foo"][~wikipedia~"bar"]', function () {
      var f = new Filter([ { keyRegexp: true, op: '~', key: 'wikipedia', value: 'foo' }, { keyRegexp: true, op: '~', key: 'wikipedia', value: 'bar' } ])

      var r = f.toLokijs()
      assert.deepEqual(r, { needMatch: true })
    })

    it ('(nwr[~wikipedia~"foo"];node[amenity];)', function () {
      var f = new Filter({ "or": [
        [ { keyRegexp: true, op: '~', key: 'wikipedia', value: 'foo' } ],
        [ { type: 'node' }, { key: 'amenity', 'op': 'has_key' } ]
      ]})

      var r = f.toLokijs()
      assert.deepEqual(r, {"$or":[{},{"type":{$eq:"node"},"tags.amenity":{"$exists":true}}],"needMatch":true})
    })

    it ("way[railway=rail][railway!~'^(platform|abandoned|disused|station|proposed|subway_entrance)$'][usage~'^(main|branch)$'];", function () {
      var f = new Filter("way[railway=rail][railway!~'^(platform|abandoned|disused|station|proposed|subway_entrance)$'][usage~'^(main|branch)$'];")

      var r = f.toLokijs()
      assert.deepEqual(r, {"type":{"$eq":"way"},"tags.railway":{"$and":[{"$eq":"rail"},{"$not":{"$regex":"^(platform|abandoned|disused|station|proposed|subway_entrance)$"}}]},"tags.usage":{"$regex":"^(main|branch)$"}})
    })

    it ('node["amenity"="cafe"];node._["cuisine"="ice_cream"]', function () {
      var f = new Filter({ "and": [
	[ { "type": "node" }, { "key": "amenity", "op": "=", "value": "cafe" } ],
	[ { "type": "node" }, { "key": "cuisine", "op": "=", "value": "ice_cream" } ]
      ] })

      console.log(JSON.stringify(f.toLokijs()))
      assert.deepEqual(f.toLokijs(), '(node["amenity"="cafe"];)->.a0;(node.a0["cuisine"="ice_cream"];)')
    })

    it ('nwr["amenity"="cafe"];nwr._["cuisine"="ice_cream"]', function () {
      var f = new Filter({ "and": [
	[ { "key": "amenity", "op": "=", "value": "cafe" } ],
        [ { "key": "name", "op": "has_key" } ],
	[ { "key": "cuisine", "op": "=", "value": "ice_cream" } ]
      ] })

      console.log(JSON.stringify(f.toLokijs()))
      assert.deepEqual(f.toLokijs(), '(node["amenity"="cafe"];way["amenity"="cafe"];relation["amenity"="cafe"];)->.a0;(node.a0["name"];way.a0["name"];relation.a0["name"];)->.a0;(node.a0["cuisine"="ice_cream"];way.a0["cuisine"="ice_cream"];relation.a0["cuisine"="ice_cream"];)')
    })

  })

  describe ('parse', function () {
    it ('nwr[amenity]', function () {
      var f = new Filter(' nwr [amenity]')
      assert.equal(f.toString(), 'nwr["amenity"]')
    })

    it (' nwr [ amenity ] ', function () {
      var f = new Filter(' nwr [ amenity ] ')
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

    it (' nwr [ amenity = restaurant ] [ shop ] ', function () {
      var f = new Filter(' nwr [ amenity = restaurant ] [ shop ]')
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

    it ('(node[amenity=cafe][cuisine=ice_cream];node[amenity=ice_cream];node[shop=ice_cream];)', function () {
      var f = new Filter(' (\nnode[amenity=cafe][cuisine=ice_cream] ; node[amenity=ice_cream];node[shop=ice_cream];\n)')
      assert.equal(f.toString(), '(node["amenity"="cafe"]["cuisine"="ice_cream"];node["amenity"="ice_cream"];node["shop"="ice_cream"];)')
    })

    it ('node[~wikipedia~"."]', function () {
      var f = new Filter('node[~wikipedia]')
      assert.equal(f.toString(), 'node[~"wikipedia"~"."]')
    })

    it ('node[~"wikipedia"~"."]', function () {
      var f = new Filter('node[~"wikipedia"~"."]')
      assert.equal(f.toString(), 'node[~"wikipedia"~"."]')
    })

    it ('node[~"wikipedia"~"foo"]', function () {
      var f = new Filter('node[~"wikipedia"~"foo"]')
      assert.equal(f.toString(), 'node[~"wikipedia"~"foo"]')
    })
  })

  describe('more tests', function () {
    it ('(nwr[cuisine^asian];nwr[cuisine=chinese];)', function () {
      var f = new Filter('(nwr[cuisine^asian];nwr[cuisine=chinese];)')

      assert.equal(f.toString(), '(nwr["cuisine"~"^(.*;|)asian(|;.*)$"];nwr["cuisine"="chinese"];)')
      assert.equal(f.toQl(), '(node["cuisine"~"^(.*;|)asian(|;.*)$"];way["cuisine"~"^(.*;|)asian(|;.*)$"];relation["cuisine"~"^(.*;|)asian(|;.*)$"];node["cuisine"="chinese"];way["cuisine"="chinese"];relation["cuisine"="chinese"];)')
      var r = f.toLokijs()
      assert.deepEqual(r, {"$or":[{"tags.cuisine":{"$regex":"^(.*;|)asian(|;.*)$"}},{"tags.cuisine":{"$eq":"chinese"}}]})

      r = f.match({ tags: { amenity: 'restaurant', cuisine: 'asian' } })
      assert.equal(r, true, 'Object should match')
      r = f.match({ tags: { amenity: 'cafe', cuisine: 'asian;turkish' } })
      assert.equal(r, true, 'Object should match')
      r = f.match({ tags: { amenity: 'cafe', cuisine: 'argentinian;turkish' } })
      assert.equal(r, false, 'Object should not match')
      r = f.match({ tags: { amenity: 'cafe', cuisine: 'chinese' } })
      assert.equal(r, true, 'Object should match')
      r = f.match({ tags: { amenity: 'cafe', cuisine: 'asian;chinese' } })
      assert.equal(r, true, 'Object should match')
      r = f.match({ tags: { amenity: 'cafe', cuisine: 'turkish;chinese' } })
      assert.equal(r, false, 'Object should not match')
    })
  })
})
