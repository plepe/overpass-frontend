const assert = require('assert')
const loki = require('lokijs')

const Filter = require('../src/Filter')

describe('Filter', function () {
  let db = new loki()
  let lokidb = db.addCollection('db')
  lokidb.insert([
    { id: 1, type: 'node', tags: { amenity: 'restaurant' } },
    { id: 2, type: 'node', tags: { name: 'foobar', amenity: 'cafe' } },
    { id: 3, type: 'node', tags: { name: 'test', amenity: 'cafe' } },
    { id: 4, type: 'node', tags: { name: 'TESTER', amenity: 'cafe' } },
    { id: 5, type: 'node', tags: { name: 'tester', amenity: 'cafe' } },
    { id: 6, type: 'node', tags: { name: 'Tester', amenity: 'cafe' } },
  ])

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
      assert.deepEqual(r, {"type":{"$eq":"way"},"tags.railway":{"$and":[{"$eq":"rail"},{"$not":{"$regex":/^(platform|abandoned|disused|station|proposed|subway_entrance)$/}}]},"tags.usage":{"$regex":/^(main|branch)$/}})
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

  describe('or', function () {
    it('or1', function () {
      let f = new Filter({ or: [ [ { key: 'name', value: '49', op: '~' } ], [ { key: 'ref', value: '49', op: '=' } ] ] })

      assert.equal(f.toString(), '(nwr["name"~"49"];nwr["ref"="49"];)')
      assert.equal(f.toQl(), '(node["name"~"49"];way["name"~"49"];relation["name"~"49"];node["ref"="49"];way["ref"="49"];relation["ref"="49"];)')
      assert.deepEqual(f.toLokijs(), {"$or":[{"tags.name":{"$regex":/49/}},{"tags.ref":{"$eq":"49"}}]})
    })

    it('or2', function () {
      let f = new Filter([
        { or: [ [ { key: 'name', value: '49', op: '~' } ], [ { key: 'ref', value: '49', op: '=' } ] ] },
        { key: 'route', value: 'bus', op: '=' }
      ])

      assert.equal(f.toString(), '(nwr["name"~"49"]["route"="bus"];nwr["ref"="49"]["route"="bus"];)')
      assert.equal(f.toQl(), '(node["name"~"49"]["route"="bus"];way["name"~"49"]["route"="bus"];relation["name"~"49"]["route"="bus"];node["ref"="49"]["route"="bus"];way["ref"="49"]["route"="bus"];relation["ref"="49"]["route"="bus"];)')
      assert.deepEqual(f.toLokijs(), {"tags.route":{"$eq":"bus"},"$or":[{"tags.name":{"$regex":/49/}},{"tags.ref":{"$eq":"49"}}]})
    })

    it('or3', function () {
      let f = new Filter([
        { or: [ [ { key: 'name', value: '49', op: '~' } ], [ { key: 'ref', value: '49', op: '=' } ] ] },
        { key: 'route', value: 'bus', op: '=' },
        { or: [ { key: 'operator', op: '=', value: 'ÖBB' }, { key: 'operator', op: '=', value: 'WL' } ] }
      ])

      assert.equal(f.toString(), '(nwr["name"~"49"]["route"="bus"]["operator"="ÖBB"];nwr["name"~"49"]["route"="bus"]["operator"="WL"];nwr["ref"="49"]["route"="bus"]["operator"="ÖBB"];nwr["ref"="49"]["route"="bus"]["operator"="WL"];)')
      assert.equal(f.toQl(), '(node["name"~"49"]["route"="bus"]["operator"="ÖBB"];way["name"~"49"]["route"="bus"]["operator"="ÖBB"];relation["name"~"49"]["route"="bus"]["operator"="ÖBB"];node["name"~"49"]["route"="bus"]["operator"="WL"];way["name"~"49"]["route"="bus"]["operator"="WL"];relation["name"~"49"]["route"="bus"]["operator"="WL"];node["ref"="49"]["route"="bus"]["operator"="ÖBB"];way["ref"="49"]["route"="bus"]["operator"="ÖBB"];relation["ref"="49"]["route"="bus"]["operator"="ÖBB"];node["ref"="49"]["route"="bus"]["operator"="WL"];way["ref"="49"]["route"="bus"]["operator"="WL"];relation["ref"="49"]["route"="bus"]["operator"="WL"];)')
      assert.deepEqual(f.toLokijs(), {"tags.route":{"$eq":"bus"},"$and":[{"$or":[{"tags.name":{"$regex":{}}},{"tags.ref":{"$eq":"49"}}]},{"$or":[{"tags.operator":{"$eq":"ÖBB"}},{"tags.operator":{"$eq":"WL"}}]}]})
    })
  })

  it('case-senstive regexp', function () {
    var f = new Filter('node["name"~"test"]')
    let r

    assert.deepEqual(f.def, [{"type":"node"},{"key":"name","op":"~","value":"test"}])
    assert.equal(f.toString(), 'node["name"~"test"]')
    assert.equal(f.toQl(), '(node["name"~"test"];)')
    assert.deepEqual(f.toLokijs(), { type: { '$eq': 'node' }, 'tags.name': { '$regex': /test/ } })

    r = f.match({ type: 'node', tags: { amenity: 'restaurant' } })
    assert.equal(r, false, 'Object 1 should not match')
    r = f.match({ type: 'node', tags: { name: 'foobar', amenity: 'cafe' } })
    assert.equal(r, false, 'Object 2 should not match')
    r = f.match({ type: 'node', tags: { name: 'test', amenity: 'cafe' } })
    assert.equal(r, true, 'Object 3 should match')
    r = f.match({ type: 'node', tags: { name: 'TESTER', amenity: 'cafe' } })
    assert.equal(r, false, 'Object 4 should not match')
    r = f.match({ type: 'node', tags: { name: 'tester', amenity: 'cafe' } })
    assert.equal(r, true, 'Object 5 should match')
    r = f.match({ type: 'node', tags: { name: 'Tester', amenity: 'cafe' } })
    assert.equal(r, false, 'Object 6 should not match')

    r = lokidb.find(f.toLokijs())
    assert.deepEqual(r.map(o => o.id), [ 3, 5 ])
  })

  it('case-senstive !regexp', function () {
    var f = new Filter('node["name"!~"test"]')
    let r

    assert.deepEqual(f.def, [{"type":"node"},{"key":"name","op":"!~","value":"test"}])
    assert.equal(f.toString(), 'node["name"!~"test"]')
    assert.equal(f.toQl(), '(node["name"!~"test"];)')
    assert.deepEqual(f.toLokijs(), { type: { '$eq': 'node' }, 'tags.name': { '$not': { '$regex': /test/ } } })

    r = f.match({ type: 'node', tags: { amenity: 'restaurant' } })
    assert.equal(r, true, 'Object 1 should match')
    r = f.match({ type: 'node', tags: { name: 'foobar', amenity: 'cafe' } })
    assert.equal(r, true, 'Object 2 should match')
    r = f.match({ type: 'node', tags: { name: 'test', amenity: 'cafe' } })
    assert.equal(r, false, 'Object 3 should not match')
    r = f.match({ type: 'node', tags: { name: 'TESTER', amenity: 'cafe' } })
    assert.equal(r, true, 'Object 4 should match')
    r = f.match({ type: 'node', tags: { name: 'tester', amenity: 'cafe' } })
    assert.equal(r, false, 'Object 5 should not match')
    r = f.match({ type: 'node', tags: { name: 'Tester', amenity: 'cafe' } })
    assert.equal(r, true, 'Object 6 should match')

    r = lokidb.find(f.toLokijs())
    assert.deepEqual(r.map(o => o.id), [ 1, 2, 4, 6 ])
  })

  it('case-insenstive regexp', function () {
    var f = new Filter('node["name"~"test",i]')
    let r

    assert.deepEqual(f.def, [{"type":"node"},{"key":"name","op":"~i","value":"test"}])
    assert.equal(f.toString(), 'node["name"~"test",i]')
    assert.equal(f.toQl(), '(node["name"~"test",i];)')
    assert.deepEqual(f.toLokijs(), { type: { '$eq': 'node' }, 'tags.name': { '$regex': /test/i } })

    r = f.match({ type: 'node', tags: { amenity: 'restaurant' } })
    assert.equal(r, false, 'Object 1 should not match')
    r = f.match({ type: 'node', tags: { name: 'foobar', amenity: 'cafe' } })
    assert.equal(r, false, 'Object 2 should not match')
    r = f.match({ type: 'node', tags: { name: 'test', amenity: 'cafe' } })
    assert.equal(r, true, 'Object 3 should match')
    r = f.match({ type: 'node', tags: { name: 'TESTER', amenity: 'cafe' } })
    assert.equal(r, true, 'Object 4 should match')
    r = f.match({ type: 'node', tags: { name: 'tester', amenity: 'cafe' } })
    assert.equal(r, true, 'Object 5 should match')
    r = f.match({ type: 'node', tags: { name: 'Tester', amenity: 'cafe' } })
    assert.equal(r, true, 'Object 6 should match')

    r = lokidb.find(f.toLokijs())
    assert.deepEqual(r.map(o => o.id), [ 3, 4, 5, 6 ])
  })

  it('case-insenstive !regexp', function () {
    var f = new Filter('node["name"!~"test",i]')
    let r

    assert.deepEqual(f.def, [{"type":"node"},{"key":"name","op":"!~i","value":"test"}])
    assert.equal(f.toString(), 'node["name"!~"test",i]')
    assert.equal(f.toQl(), '(node["name"!~"test",i];)')
    assert.deepEqual(f.toLokijs(), { type: { '$eq': 'node' }, 'tags.name': { '$not': { '$regex': /test/i } } })

    r = f.match({ type: 'node', tags: { amenity: 'restaurant' } })
    assert.equal(r, true, 'Object 1 should match')
    r = f.match({ type: 'node', tags: { name: 'foobar', amenity: 'cafe' } })
    assert.equal(r, true, 'Object 2 should match')
    r = f.match({ type: 'node', tags: { name: 'test', amenity: 'cafe' } })
    assert.equal(r, false, 'Object 3 should not match')
    r = f.match({ type: 'node', tags: { name: 'TESTER', amenity: 'cafe' } })
    assert.equal(r, false, 'Object 4 should not match')
    r = f.match({ type: 'node', tags: { name: 'tester', amenity: 'cafe' } })
    assert.equal(r, false, 'Object 5 should not match')
    r = f.match({ type: 'node', tags: { name: 'Tester', amenity: 'cafe' } })
    assert.equal(r, false, 'Object 6 should not match')

    r = lokidb.find(f.toLokijs())
    assert.deepEqual(r.map(o => o.id), [ 1, 2 ])
  })

  it('!=', function () {
    var f = new Filter('node["name"!="test"]')
    let r

    assert.deepEqual(f.def, [{"type":"node"},{"key":"name","op":"!=","value":"test"}])
    assert.equal(f.toString(), 'node["name"!="test"]')
    assert.equal(f.toQl(), '(node["name"!="test"];)')
    assert.deepEqual(f.toLokijs(), { type: { '$eq': 'node' }, 'tags.name': { '$ne': 'test' } })

    r = f.match({ type: 'node', tags: { amenity: 'restaurant' } })
    assert.equal(r, true, 'Object 1 should match')
    r = f.match({ type: 'node', tags: { name: 'foobar', amenity: 'cafe' } })
    assert.equal(r, true, 'Object 2 should match')
    r = f.match({ type: 'node', tags: { name: 'test', amenity: 'cafe' } })
    assert.equal(r, false, 'Object 3 should not match')
    r = f.match({ type: 'node', tags: { name: 'TESTER', amenity: 'cafe' } })
    assert.equal(r, true, 'Object 4 should match')
    r = f.match({ type: 'node', tags: { name: 'tester', amenity: 'cafe' } })
    assert.equal(r, true, 'Object 5 should match')
    r = f.match({ type: 'node', tags: { name: 'Tester', amenity: 'cafe' } })
    assert.equal(r, true, 'Object 6 should match')

    r = lokidb.find(f.toLokijs())
    assert.deepEqual(r.map(o => o.id), [ 1, 2, 4, 5, 6 ])
  })
})
