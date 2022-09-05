const assert = require('assert')
const loki = require('lokijs')

const Filter = require('../src/Filter')

const objects = [
  { id: 1, osm_id: 1, type: 'node', tags: { amenity: 'restaurant' } },
  { id: 2, osm_id: 2, type: 'node', tags: { name: 'foobar', amenity: 'cafe', cuisine: 'ice_cream' } },
  { id: 3, osm_id: 3, type: 'node', tags: { name: 'test', amenity: 'cafe', cuisine: 'ice_cream;dessert' } },
  { id: 4, osm_id: 4, type: 'node', tags: { name: 'TESTER', amenity: 'cafe', cuisine: 'bagel;ice_cream' } },
  { id: 5, osm_id: 5, type: 'node', tags: { name: 'tester', amenity: 'cafe', cuisine: 'bagel;ice_cream;dessert' } },
  { id: 6, osm_id: 6, type: 'node', tags: { name: 'Tester', amenity: 'cafe', cuisine: 'bagel;dessert' } },
  { id: 7, osm_id: 7, type: 'node', tags: { name: 'Tëster', amenity: 'cafe' } }
]
objects.forEach(ob => {
  ob.GeoJSON = () => {return {type: 'Feature', properties: ob.tags, geometry: {type: 'Point', coordinates: [ 0, 0 ]}}}
  ob.intersects = () => {}
})

let db = new loki()
let lokidb = db.addCollection('db')
lokidb.insert(objects)

function check(filter, expectedMatches) {
  objects.forEach(
    ob => {
      assert.equal(filter.match(ob), expectedMatches.includes(ob.id), 'Object ' + ob.id + ' should ' + (expectedMatches.includes(ob.id) ? 'not ' : '') + 'match')
    }
  )

  let q = filter.toLokijs()
  if (q.needMatch) {
    delete q.needMatch
    r = lokidb.find(q)
    r = r.filter(o => filter.match(o))
  } else {
    r = lokidb.find(q)
  }

  assert.deepEqual(r.map(o => o.id), expectedMatches)
}

describe('Filter', function () {
  describe ('input exploded', function () {
    it ('nwr[amenity]', function () {
      var f = new Filter([ { op: 'has_key', key: 'amenity' } ])
      assert.equal(f.toString(), 'nwr["amenity"];')
    })

    it ('nwr[amenity=restaurant]', function () {
      var f = new Filter([ { op: '=', key: 'amenity', value: 'restaurant' } ])
      assert.equal(f.toString(), 'nwr["amenity"="restaurant"];')
    })

    it ('nwr[amenity=restaurant][shop]', function () {
      var f = new Filter([ { op: '=', key: 'amenity', value: 'restaurant' }, { op: 'has_key', key: 'shop' } ])
      assert.equal(f.toString(), 'nwr["amenity"="restaurant"]["shop"];')
    })

    it ('nwr[cuisine^asian]', function () {
      var f = new Filter([ { op: 'has', key: 'cuisine', value: 'asian' } ])
      assert.equal(f.toString(), 'nwr["cuisine"~"^(.*;|)asian(|;.*)$"];')
    })

    it ('nwr["amenity"=\'restaurant\']["sh\\"op"]', function () {
      var f = new Filter([ { op: '=', key: 'amenity', value: 'restaurant' }, { op: 'has_key', key: 'sh\"op' } ])
      assert.equal(f.toString(), 'nwr["amenity"="restaurant"]["sh\\"op"];')
    })

    it ('nwr["amenity"=\'restaurant\']["shop"~"super"]', function () {
      var f = new Filter([ { op: '=', key: 'amenity', value: 'restaurant' }, { op: '~', key: 'shop', value: 'super' } ])
      assert.equal(f.toString(), 'nwr["amenity"="restaurant"]["shop"~"super"];')
    })

    it ('  (node[amenity=cafe][cuisine=ice_cream];node[amenity=ice_cream];node[shop=ice_cream];)', function () {
      var f = new Filter({ "or": [
	[ { "type": "node" }, { "key": "amenity", "op": "=", "value": "cafe" }, { "key": "cuisine", "op": "=", "value": "ice_cream" } ],
	[ { "type": "node" }, { "key": "amenity", "op": "=", "value": "ice_cream" } ],
	[ { "type": "node" }, { "key": "shop", "op": "=", "value": "ice_cream" } ]
      ] })

      assert.equal(f.toString(), '(node["amenity"="cafe"]["cuisine"="ice_cream"];node["amenity"="ice_cream"];node["shop"="ice_cream"];);')
    })

    it ('nwr[~wikipedia~"."]', function () {
      var f = new Filter([ { keyRegexp: true, op: 'has_key', key: 'wikipedia' } ])
      assert.equal(f.toString(), 'nwr[~"wikipedia"~"."];')
    })

    it ('nwr[~wikipedia~"foo"]', function () {
      var f = new Filter([ { keyRegexp: true, op: '~', key: 'wikipedia', value: 'foo' } ])
      assert.equal(f.toString(), 'nwr[~"wikipedia"~"foo"];')
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
      var r = f.match({ tags: { 'Wikipedia:de': 'test' } })
      assert.equal(r, false, 'Object should not match')
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
      var r = f.match({ tags: { 'Wikipedia:de': 'foobar' } })
      assert.equal(r, false, 'Object should not match')
      var r = f.match({ tags: { 'wikipedia:de': 'Foobar' } })
      assert.equal(r, false, 'Object should not match')
      var r = f.match({ tags: { 'Wikipedia:de': 'Foobar' } })
      assert.equal(r, false, 'Object should not match')
    })

    it ('nwr[~wikipedia~".",i]', function () {
      var f = new Filter([ { keyRegexp: 'i', op: 'has_key', key: 'wikipedia' } ])

      var r = f.match({ tags: { amenity: 'restaurant' } })
      assert.equal(r, false, 'Object should not match')
      var r = f.match({ tags: { wikipedia: 'test' } })
      assert.equal(r, true, 'Object should match')
      var r = f.match({ tags: { 'de:wikipedia': 'test' } })
      assert.equal(r, true, 'Object should match')
      var r = f.match({ tags: { 'wikipedia:de': 'test' } })
      assert.equal(r, true, 'Object should match')
      var r = f.match({ tags: { 'Wikipedia:de': 'test' } })
      assert.equal(r, true, 'Object should match')
    })

    it ('nwr[~wikipedia~"foo",i]', function () {
      var f = new Filter([ { keyRegexp: 'i', op: '~i', key: 'wikipedia', value: 'foo' } ])

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
      var r = f.match({ tags: { 'Wikipedia:de': 'foobar' } })
      assert.equal(r, true, 'Object1 should match')
      var r = f.match({ tags: { 'wikipedia:de': 'Foobar' } })
      assert.equal(r, true, 'Object2 should match')
      var r = f.match({ tags: { 'Wikipedia:de': 'Foobar' } })
      assert.equal(r, true, 'Object3 should match')
    })

  })

  describe('toQl', function () {
    it ('nwr[amenity]', function () {
      var f = new Filter([ { op: 'has_key', key: 'amenity' } ])

      var r = f.toQl()
      assert.equal(r, 'nwr["amenity"];')

      r = f.toQl({
        inputSet: '.result'
      })
      assert.equal(r, 'nwr.result["amenity"];')

      r = f.toQl({
        outputSet: '.result'
      })
      assert.equal(r, 'nwr["amenity"]->.result;')
    })

    it ('nwr[amenity=restaurant]', function () {
      var f = new Filter([ { op: '=', key: 'amenity', value: 'restaurant' } ])

      var r = f.toQl()
      assert.equal(r, 'nwr["amenity"="restaurant"];')

      r = f.toQl({
        inputSet: '.result'
      })
      assert.equal(r, 'nwr.result["amenity"="restaurant"];')

      r = f.toQl({
        outputSet: '.result'
      })
      assert.equal(r, 'nwr["amenity"="restaurant"]->.result;')
    })

    it ('nwr[amenity=restaurant][shop]', function () {
      var f = new Filter([ { op: '=', key: 'amenity', value: 'restaurant' }, { op: 'has_key', key: 'shop' } ])

      var r = f.toQl()
      assert.equal(r, 'nwr["amenity"="restaurant"]["shop"];')

      r = f.toQl({
        inputSet: '.result'
      })
      assert.equal(r, 'nwr.result["amenity"="restaurant"]["shop"];')

      r = f.toQl({
        outputSet: '.result'
      })
      assert.equal(r, 'nwr["amenity"="restaurant"]["shop"]->.result;')
    })

    it ('[cuisine^asian]', function () {
      var f = new Filter([ { op: 'has', key: 'cuisine', value: 'asian' } ])

      var r = f.toQl()
      assert.equal(r, 'nwr["cuisine"~"^(.*;|)asian(|;.*)$"];')

      r = f.toQl({
        inputSet: '.result'
      })
      assert.equal(r, 'nwr.result["cuisine"~"^(.*;|)asian(|;.*)$"];')
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
      assert.equal(r, '(node.result["amenity"="cafe"]["cuisine"="ice_cream"];node.result["amenity"="ice_cream"];nwr.result["shop"="ice_cream"];);')

      var r = f.toQl({
        outputSet: '.result'
      })
      assert.equal(r, '(node["amenity"="cafe"]["cuisine"="ice_cream"];node["amenity"="ice_cream"];nwr["shop"="ice_cream"];)->.result;')
    })

    it ('nwr[~wikipedia~"."]', function () {
      var f = new Filter([ { keyRegexp: true, op: 'has_key', key: 'wikipedia' } ])

      var r = f.toQl()
      assert.equal(r, 'nwr[~"wikipedia"~"."];')
    })

    it ('nwr[~wikipedia~"foo"]', function () {
      var f = new Filter([ { keyRegexp: true, op: '~', key: 'wikipedia', value: 'foo' } ])

      var r = f.toQl()
      assert.equal(r, 'nwr[~"wikipedia"~"foo"];')
    })

    it ('nwr[~wikipedia~".",i]', function () {
      var f = new Filter([ { keyRegexp: 'i', op: 'has_key', key: 'wikipedia' } ])

      var r = f.toQl()
      assert.equal(r, 'nwr[~"wikipedia"~".",i];')
    })

    it ('nwr[~wikipedia~"foo",i]', function () {
      var f = new Filter([ { keyRegexp: 'i', op: '~i', key: 'wikipedia', value: 'foo' } ])

      var r = f.toQl()
      assert.equal(r, 'nwr[~"wikipedia"~"foo",i];')
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

    it ('nwr[~wikipedia~".",i]', function () {
      var f = new Filter([ { keyRegexp: 'i', op: 'has_key', key: 'wikipedia' } ])

      var r = f.toLokijs()
      assert.deepEqual(r, { needMatch: true })
    })

    it ('(nwr[~wikipedia~"."];)', function () {
      var f = new Filter('(nwr[~wikipedia~"."];)')

      var r = f.toLokijs()
      assert.deepEqual(r, { needMatch: true })
    })

    it ('(nwr[~wikipedia~"."];node[foo];)', function () {
      var f = new Filter('(nwr[~wikipedia~"."];node[foo];)')

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

    it ('nwr[~wikipedia~"foo",i]', function () {
      var f = new Filter([ { keyRegexp: 'i', op: '~i', key: 'wikipedia', value: 'foo' } ])

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
      assert.deepEqual(r, {"needMatch":true})
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
      assert.equal(f.toString(), 'nwr["amenity"];')
    })

    it (' nwr [ amenity ] ', function () {
      var f = new Filter(' nwr [ amenity ] ')
      assert.equal(f.toString(), 'nwr["amenity"];')
    })

    it ('nwr[amenity=restaurant]', function () {
      var f = new Filter('nwr[amenity=restaurant]')
      assert.equal(f.toString(), 'nwr["amenity"="restaurant"];')
    })

    it ('nwr[amenity=restaurant][shop]', function () {
      var f = new Filter('nwr[amenity=restaurant][shop]')
      assert.equal(f.toString(), 'nwr["amenity"="restaurant"]["shop"];')
    })

    it (' nwr [ amenity = restaurant ] [ shop ] ', function () {
      var f = new Filter(' nwr [ amenity = restaurant ] [ shop ]')
      assert.equal(f.toString(), 'nwr["amenity"="restaurant"]["shop"];')
    })

    it ('nwr[cuisine^asian]', function () {
      var f = new Filter('nwr[cuisine^asian]')
      assert.equal(f.toString(), 'nwr["cuisine"~"^(.*;|)asian(|;.*)$"];')
    })

    it ('nwr["amenity"=\'restaurant\']["sh\\"op"]', function () {
      var f = new Filter('nwr["amenity"=\'restaurant\']["sh\\"op"]')
      assert.equal(f.toString(), 'nwr["amenity"="restaurant"]["sh\\"op"];')
    })

    it ('(node[amenity=cafe][cuisine=ice_cream];node[amenity=ice_cream];node[shop=ice_cream];)', function () {
      var f = new Filter(' (\nnode[amenity=cafe][cuisine=ice_cream] ; node[amenity=ice_cream];node[shop=ice_cream];\n)')
      assert.equal(f.toString(), '(node["amenity"="cafe"]["cuisine"="ice_cream"];node["amenity"="ice_cream"];node["shop"="ice_cream"];);')
    })

    it ('node[~wikipedia~"."]', function () {
      var f = new Filter('node[~wikipedia]')
      assert.deepEqual(f.def, [
        { type: 'node' },
        { key: 'wikipedia', op: 'has_key', keyRegexp: true }
      ])
      assert.equal(f.toString(), 'node[~"wikipedia"~"."];')
    })

    it ('node[~"wikipedia"~"."]', function () {
      var f = new Filter('node[~"wikipedia"~"."]')
      assert.deepEqual(f.def, [
        { type: 'node' },
        { key: 'wikipedia', op: 'has_key', keyRegexp: true }
      ])
      assert.equal(f.toString(), 'node[~"wikipedia"~"."];')
    })

    it ('node[~"wikipedia"~"foo"]', function () {
      var f = new Filter('node[~"wikipedia"~"foo"]')
      assert.equal(f.toString(), 'node[~"wikipedia"~"foo"];')
    })

    it ('node[~"wikipedia"~".",i]', function () {
      var f = new Filter('node[~"wikipedia"~".",i]')

      assert.deepEqual(f.def, [
        { type: 'node' },
        { key: 'wikipedia', op: 'has_key', keyRegexp: 'i' }
      ])
      assert.equal(f.toString(), 'node[~"wikipedia"~".",i];')
    })

    it ('node[~"wikipedia"~"foo",i]', function () {
      var f = new Filter('node[~"wikipedia"~"foo",i]')

      assert.deepEqual(f.def, [
        { type: 'node' },
        { key: 'wikipedia', op: '~i', value: 'foo', keyRegexp: 'i' }
      ])
      assert.equal(f.toString(), 'node[~"wikipedia"~"foo",i];')
    })
  })

  describe('or', function () {
    it('or1', function () {
      let f = new Filter({ or: [ [ { key: 'name', value: '49', op: '~' } ], [ { key: 'ref', value: '49', op: '=' } ] ] })

      assert.equal(f.toString(), '(nwr["name"~"49"];nwr["ref"="49"];);')
      assert.equal(f.toQl(), '(nwr["name"~"49"];nwr["ref"="49"];);')
      assert.deepEqual(f.toLokijs(), {"$or":[{"tags.name":{"$regex":/49/}},{"tags.ref":{"$eq":"49"}}]})
    })

    it('or2', function () {
      let f = new Filter([
        { or: [ [ { key: 'name', value: '49', op: '~' } ], [ { key: 'ref', value: '49', op: '=' } ] ] },
        { key: 'route', value: 'bus', op: '=' }
      ])

      assert.equal(f.toString(), '(nwr["name"~"49"]["route"="bus"];nwr["ref"="49"]["route"="bus"];);')
      assert.equal(f.toQl(), '(nwr["name"~"49"]["route"="bus"];nwr["ref"="49"]["route"="bus"];);')
      assert.deepEqual(f.toLokijs(), {"tags.route":{"$eq":"bus"},"$or":[{"tags.name":{"$regex":/49/}},{"tags.ref":{"$eq":"49"}}]})
    })

    it('or3', function () {
      let f = new Filter([
        { or: [ [ { key: 'name', value: '49', op: '~' } ], [ { key: 'ref', value: '49', op: '=' } ] ] },
        { key: 'route', value: 'bus', op: '=' },
        { or: [ { key: 'operator', op: '=', value: 'ÖBB' }, { key: 'operator', op: '=', value: 'WL' } ] }
      ])

      assert.equal(f.toString(), '(nwr["name"~"49"]["route"="bus"]["operator"="ÖBB"];nwr["name"~"49"]["route"="bus"]["operator"="WL"];nwr["ref"="49"]["route"="bus"]["operator"="ÖBB"];nwr["ref"="49"]["route"="bus"]["operator"="WL"];);')
      assert.equal(f.toQl(), '(nwr["name"~"49"]["route"="bus"]["operator"="ÖBB"];nwr["name"~"49"]["route"="bus"]["operator"="WL"];nwr["ref"="49"]["route"="bus"]["operator"="ÖBB"];nwr["ref"="49"]["route"="bus"]["operator"="WL"];);')
      assert.deepEqual(f.toLokijs(), {"tags.route":{"$eq":"bus"},"$and":[{"$or":[{"tags.name":{"$regex":/49/}},{"tags.ref":{"$eq":"49"}}]},{"$or":[{"tags.operator":{"$eq":"ÖBB"}},{"tags.operator":{"$eq":"WL"}}]}]})
    })
  })

  it('case-sensitive regexp', function () {
    var f = new Filter('node["name"~"test"]')

    assert.deepEqual(f.def, [{"type":"node"},{"key":"name","op":"~","value":"test"}])
    assert.equal(f.toString(), 'node["name"~"test"];')
    assert.equal(f.toQl(), 'node["name"~"test"];')
    assert.deepEqual(f.toLokijs(), { type: { '$eq': 'node' }, 'tags.name': { '$regex': /test/ } })

    check(f, [ 3, 5 ])
  })

  it('case-sensitive !regexp', function () {
    var f = new Filter('node["name"!~"test"]')

    assert.deepEqual(f.def, [{"type":"node"},{"key":"name","op":"!~","value":"test"}])
    assert.equal(f.toString(), 'node["name"!~"test"];')
    assert.equal(f.toQl(), 'node["name"!~"test"];')
    assert.deepEqual(f.toLokijs(), { type: { '$eq': 'node' }, 'tags.name': { '$not': { '$regex': /test/ } } })

    check(f, [ 1, 2, 4, 6, 7 ])
  })

  it('case-insenstive regexp', function () {
    var f = new Filter('node["name"~"test",i]')

    assert.deepEqual(f.def, [{"type":"node"},{"key":"name","op":"~i","value":"test"}])
    assert.equal(f.toString(), 'node["name"~"test",i];')
    assert.equal(f.toQl(), 'node["name"~"test",i];')
    assert.deepEqual(f.toLokijs(), { type: { '$eq': 'node' }, 'tags.name': { '$regex': /test/i } })

    check(f, [ 3, 4, 5, 6 ])
  })

  it('case-insenstive !regexp', function () {
    var f = new Filter('node["name"!~"test",i]')

    assert.deepEqual(f.def, [{"type":"node"},{"key":"name","op":"!~i","value":"test"}])
    assert.equal(f.toString(), 'node["name"!~"test",i];')
    assert.equal(f.toQl(), 'node["name"!~"test",i];')
    assert.deepEqual(f.toLokijs(), { type: { '$eq': 'node' }, 'tags.name': { '$not': { '$regex': /test/i } } })

    check(f, [ 1, 2, 7 ])
  })

  it('!=', function () {
    var f = new Filter('node["name"!="test"]')

    assert.deepEqual(f.def, [{"type":"node"},{"key":"name","op":"!=","value":"test"}])
    assert.equal(f.toString(), 'node["name"!="test"];')
    assert.equal(f.toQl(), 'node["name"!="test"];')
    assert.deepEqual(f.toLokijs(), { type: { '$eq': 'node' }, 'tags.name': { '$ne': 'test' } })

    check(f, [ 1, 2, 4, 5, 6, 7 ])
  })

  it('key regexp', function () {
    var f = new Filter('node[~"na"~"."]')

    assert.deepEqual(f.def, [{"type":"node"},{"key":"na","keyRegexp":true,"op":"has_key"}])
    assert.equal(f.toString(), 'node[~"na"~"."];')
    assert.equal(f.toQl(), 'node[~"na"~"."];')
    assert.deepEqual(f.toLokijs(), { type: { '$eq': 'node' }, needMatch: true })

    check(f, [ 2, 3, 4, 5, 6, 7 ])
  })

  it('strsearch', function () {
    var f = new Filter('node["name"%"test"]')

    assert.deepEqual(f.def, [{"type":"node"},{"key":"name","op":"strsearch","value":"test"}])
    assert.equal(f.toString(), 'node["name"~"t[eèeéêëė][sß]t",i];')
    assert.equal(f.toQl(), 'node["name"~"t[eèeéêëė][sß]t",i];')
    assert.deepEqual(f.toLokijs(), { type: { '$eq': 'node' }, "tags.name": { "$regex": /t[eèeéêëė][sß]t/i } })

    check(f, [ 3, 4, 5, 6, 7 ])
  })

  it('has', function () {
    var f = new Filter('node["cuisine"^"ice_cream"]')

    assert.deepEqual(f.def, [{"type":"node"},{"key":"cuisine","op":"has","value":"ice_cream"}])
    assert.equal(f.toString(), 'node["cuisine"~"^(.*;|)ice_cream(|;.*)$"];')
    assert.equal(f.toQl(), 'node["cuisine"~"^(.*;|)ice_cream(|;.*)$"];')
    assert.deepEqual(f.toLokijs(), { type: { '$eq': 'node' }, "tags.cuisine": { "$regex": "^(.*;|)ice_cream(|;.*)$" } })

    check(f, [ 2, 3, 4, 5 ])
  })

  it('has_key', function () {
    var f = new Filter('node["cuisine"]')

    assert.deepEqual(f.def, [{"type":"node"},{"key":"cuisine","op":"has_key"}])
    assert.equal(f.toString(), 'node["cuisine"];')
    assert.equal(f.toQl(), 'node["cuisine"];')
    assert.deepEqual(f.toLokijs(), { type: { '$eq': 'node' }, "tags.cuisine": { "$exists": true } })

    check(f, [ 2, 3, 4, 5, 6 ])
  })

  it('not_exists', function () {
    var f = new Filter('node[!"cuisine"]')

    assert.deepEqual(f.def, [{"type":"node"},{"key":"cuisine","op":"not_exists"}])
    assert.equal(f.toString(), 'node[!"cuisine"];')
    assert.equal(f.toQl(), 'node[!"cuisine"];')
    assert.deepEqual(f.toLokijs(), { type: { '$eq': 'node' }, "tags.cuisine": { "$exists": false } })

    check(f, [ 1, 7 ])
  })

  it('and', function () {
    var f = new Filter({ "and": [
	[ { "type": "node" } ],
        [ { "key": "amenity", "op": "=", "value": "cafe" } ],
        [ { "key": "cuisine", "op": "has", "value": "ice_cream" } ]
      ] })

    assert.deepEqual(f.def, { "and": [
	[ { "type": "node" } ],
        [ { "key": "amenity", "op": "=", "value": "cafe" } ],
        [ { "key": "cuisine", "op": "has", "value": "ice_cream" } ]
      ] })

    assert.equal(f.toQl(), 'node->.x1;nwr.x1["amenity"="cafe"]->.x1;nwr.x1["cuisine"~"^(.*;|)ice_cream(|;.*)$"];')
    assert.deepEqual(f.toLokijs(), {"$and":[{"type":{"$eq":"node"}},{"tags.amenity":{"$eq":"cafe"}},{"tags.cuisine":{"$regex": "^(.*;|)ice_cream(|;.*)$"}}]})

    check(f, [ 2, 3, 4, 5 ])
  })

  it('and (mixed)', function () {
    var f = new Filter({ "and":
      [
	[ { "type": "node" } ],
        "nwr[amenity=cafe]",
      ]
    })

    assert.deepEqual(f.def, { "and": [
	[ { "type": "node" } ],
        [ { "key": "amenity", "op": "=", "value": "cafe" } ],
      ] })

    assert.equal(f.toQl(), 'node->.x1;nwr.x1["amenity"="cafe"];')
    assert.deepEqual(f.toLokijs(), {"$and":[{"type":{"$eq":"node"}},{"tags.amenity":{"$eq":"cafe"}}]})

    check(f, [ 2, 3, 4, 5, 6, 7 ])
  })
})

describe('Filter by id', function () {
  it('numeric', function () {
    var f = new Filter('node(3)')

    assert.deepEqual(f.def, [{"type":"node"},{"fun":"id", "value":[3]}])
    assert.equal(f.toString(), 'node(id:3);')
    assert.equal(f.toQl(), 'node(id:3);')
    assert.deepEqual(f.toLokijs(), { type: { '$eq': 'node' }, "osm_id": { "$eq": 3 } })

    check(f, [ 3 ])
  })

  it('id:', function () {
    var f = new Filter('node(id:3)')

    assert.deepEqual(f.def, [{"type":"node"},{"fun":"id", "value":[3]}])
    assert.equal(f.toString(), 'node(id:3);')
    assert.equal(f.toQl(), 'node(id:3);')
    assert.deepEqual(f.toLokijs(), { type: { '$eq': 'node' }, "osm_id": { "$eq": 3 } })

    check(f, [ 3 ])
  })

  it('id: (multiple)', function () {
    var f = new Filter('node(id:3,4,5)')

    assert.deepEqual(f.def, [{"type":"node"},{"fun":"id", "value":[3,4,5]}])
    assert.equal(f.toString(), 'node(id:3,4,5);')
    assert.equal(f.toQl(), 'node(id:3,4,5);')
    assert.deepEqual(f.toLokijs(), { type: { '$eq': 'node' }, "osm_id": { "$in": [ 3, 4, 5 ] } })

    check(f, [ 3, 4, 5 ])
  })
})

describe('Function "around"', function () {
  it('distance from coordinates', function () {
    var f = new Filter('node(around:100.0,47.0791163,15.4644484)')

    assert.deepEqual(f.def, [{"type":"node"},{
      fun: 'around',
      value: {
        distance: 100,
        geometry: {
          type: 'Point',
          coordinates: [
            15.4644484,
            47.0791163
          ]
        }
      }
    }])
    assert.equal(f.toString(), 'node(around:100,47.0791163,15.4644484);')
    assert.equal(f.toQl(), 'node(around:100,47.0791163,15.4644484);')
    assert.deepEqual(f.toLokijs(), { type: { '$eq': 'node' }, needMatch: true })

    check(f, [])
  })
})

describe('Function "bbox"', function () {
  it('simple', function () {
    var f = new Filter('node(10.2,40.0,11,45)')
    console.log(JSON.stringify(f.def))

    assert.deepEqual(f.def, [{"type":"node"},{"fun":"bbox","value":{"minlon":40,"minlat":10.2,"maxlon":45,"maxlat":11}}])
    assert.equal(f.toString(), 'node(10.2,40,11,45);')
    assert.equal(f.toQl(), 'node(10.2,40,11,45);')
    assert.deepEqual(f.toLokijs(), { type: { '$eq': 'node' }, needMatch: true })

    check(f, [])
  })
})
