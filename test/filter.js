const assert = require('assert')
const loki = require('lokijs')
const OverpassFrontend = require('../src/defines')

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


describe('Function "properties"', function () {
  it('simple', function () {
    var f = new Filter('node(properties:4)')

    assert.deepEqual(f.def, [{"type":"node"},{"fun":"properties","value":4}])
    assert.equal(f.toString(), 'node(properties:4);')
    assert.equal(f.toQl(), 'node;')
    assert.deepEqual(f.toLokijs(), { type: { '$eq': 'node' }, needMatch: true })

    check(f, [])

    var r = f.cacheDescriptors()
    assert.deepEqual(r, [ { id: "node(properties:4)" }])
  })
  it('double', function () {
    var f = new Filter('node(properties:11)(properties:4)')

    assert.deepEqual(f.def, [{"type":"node"},{"fun":"properties","value":11},{"fun":"properties","value":4}])
    assert.equal(f.toString(), 'node(properties:11)(properties:4);')
    assert.equal(f.toQl(), 'node;')
    assert.deepEqual(f.toLokijs(), { type: { '$eq': 'node' }, needMatch: true })

    check(f, [])

    var r = f.cacheDescriptors()
    assert.deepEqual(r, [ { id: "node(properties:15)" }])
  })
})
describe('Filter', function () {
  describe ('input exploded', function () {
    it ('nwr["amenity"=\'restaurant\']["sh\\"op"]', function () {
      var f = new Filter('nwr["amenity"=\'restaurant\']["sh\\"op"]')
      assert.deepEqual(f.def, [{"key":"amenity","op":"=","value":"restaurant"},{"key":"sh\"op","op":"has_key"}])
      assert.equal(f.toString(), 'nwr["amenity"="restaurant"]["sh\\"op"];')
    })

  })

  describe ('nesting filters', function () {
    it ('new Filter(new Filter("nwr[amenity]"))', function () {
      var f = new Filter(new Filter("nwr[amenity]"))
      assert.deepEqual(f.def, [{"key":"amenity","op":"has_key"}])
      assert.equal(f.toString(), 'nwr["amenity"];')
    })
  })

  describe ('match', function () {
    it('nwr', function () {
      var f = new Filter('nwr')

      assert.deepEqual(f.def, [])
      assert.equal(f.toString(), 'nwr;')
      assert.equal(f.toQl(), 'nwr;')
      assert.deepEqual(f.toLokijs(), {})

      check(f, [ 1, 2, 3, 4, 5, 6, 7 ])

      var r = f.cacheDescriptors()
      assert.deepEqual(r, [ { id: 'nwr(properties:0)' } ])
    })

    it('node', function () {
      var f = new Filter('node')

      assert.deepEqual(f.def, [{"type":"node"}])
      assert.equal(f.toString(), 'node;')
      assert.equal(f.toQl(), 'node;')
      assert.deepEqual(f.toLokijs(), {type:{$eq:'node'}})

      check(f, [ 1, 2, 3, 4, 5, 6, 7 ])

      var r = f.cacheDescriptors()
      assert.deepEqual(r, [ { id: 'node(properties:0)' } ])
    })

    it ('nwr[amenity]', function () {
      var f = new Filter('nwr[amenity]')
      assert.deepEqual(f.def, [{"key":"amenity","op":"has_key"}])
      assert.equal(f.toString(), 'nwr["amenity"];')

      var r = f.toLokijs()
      assert.deepEqual(r, { 'tags.amenity': { $exists: true }})

      var r = f.cacheDescriptors()
      assert.deepEqual(r, [ { id: 'nwr["amenity"](properties:1)' } ])

      var r = f.match({ tags: { amenity: 'restaurant' } })
      assert.equal(r, true, 'Object should match')
      var r = f.match({ tags: { amenity: 'cafe' } })
      assert.equal(r, true, 'Object should match')
      var r = f.match({ tags: { shop: 'supermarket' } })
      assert.equal(r, false, 'Object should not match')
    })

    it ('(nwr[amenity];)', function () {
      var f = new Filter('(nwr[amenity];)')
      assert.deepEqual(f.def, {or:[
        [{"key":"amenity","op":"has_key"}],
      ]})
      assert.equal(f.toString(), '(nwr["amenity"];);')

      var r = f.toLokijs()
      assert.deepEqual(r, { $or: [ { 'tags.amenity': { $exists: true } } ] })

      var r = f.cacheDescriptors()
      assert.deepEqual(r, [ { id: 'nwr["amenity"](properties:1)' } ])

      var r = f.match({ tags: { amenity: 'restaurant' } })
      assert.equal(r, true, 'Object should match')
      var r = f.match({ tags: { amenity: 'cafe' } })
      assert.equal(r, true, 'Object should match')
      var r = f.match({ tags: { shop: 'supermarket' } })
      assert.equal(r, false, 'Object should not match')
    })

    it ('\\n(   nwr [ amenity ]  ;\\n  )  ; ', function () {
      var f = new Filter('\n(   nwr [ amenity ]  ;\n  )  ; ')
      assert.deepEqual(f.def, {or:[
        [{"key":"amenity","op":"has_key"}],
      ]})
      assert.equal(f.toString(), '(nwr["amenity"];);')

      var r = f.toLokijs()
      assert.deepEqual(r, { $or: [ { 'tags.amenity': { $exists: true } } ] })

      var r = f.cacheDescriptors()
      assert.deepEqual(r, [ { id: 'nwr["amenity"](properties:1)' } ])

      var r = f.match({ tags: { amenity: 'restaurant' } })
      assert.equal(r, true, 'Object should match')
      var r = f.match({ tags: { amenity: 'cafe' } })
      assert.equal(r, true, 'Object should match')
      var r = f.match({ tags: { shop: 'supermarket' } })
      assert.equal(r, false, 'Object should not match')
    })

    it ('(node[amenity];way[amenity];)', function () {
      var f = new Filter('(node[amenity];way[amenity];)')
      assert.deepEqual(f.def, {or:[
        [{"type":"node"},{"key":"amenity","op":"has_key"}],
        [{"type":"way"},{"key":"amenity","op":"has_key"}],
      ]})
      assert.equal(f.toString(), '(node["amenity"];way["amenity"];);')

      var r = f.toLokijs()
      assert.deepEqual(r, { $or: [
        { type: { $eq: 'node' }, 'tags.amenity': { $exists: true } },
        { type: { $eq: 'way' }, 'tags.amenity': { $exists: true } }
      ] })

      var r = f.cacheDescriptors()
      assert.deepEqual(r, [ { id: 'node["amenity"](properties:1)' }, { id: 'way["amenity"](properties:1)' } ])

      var r = f.match({ type: 'node', tags: { amenity: 'restaurant' } })
      assert.equal(r, true, 'Object should match')
      var r = f.match({ type: 'node', tags: { amenity: 'cafe' } })
      assert.equal(r, true, 'Object should match')
      var r = f.match({ type: 'node', tags: { shop: 'supermarket' } })
      assert.equal(r, false, 'Object should not match')

      var r = f.match({ type: 'way', tags: { amenity: 'restaurant' } })
      assert.equal(r, true, 'Object should match')
      var r = f.match({ type: 'way', tags: { amenity: 'cafe' } })
      assert.equal(r, true, 'Object should match')
      var r = f.match({ type: 'way', tags: { shop: 'supermarket' } })
      assert.equal(r, false, 'Object should not match')

      var r = f.match({ type: 'relation', tags: { amenity: 'restaurant' } })
      assert.equal(r, false, 'Object should not match')
      var r = f.match({ type: 'relation', tags: { amenity: 'cafe' } })
      assert.equal(r, false, 'Object should not match')
      var r = f.match({ type: 'relation', tags: { shop: 'supermarket' } })
      assert.equal(r, false, 'Object should not match')
    })

    it ('((nwr[amenity];);)', function () {
      var f = new Filter('((nwr[amenity];);)')
      assert.deepEqual(f.def, {or:[
        {or:[
          [{"key":"amenity","op":"has_key"}],
        ]}
      ]})
      assert.equal(f.toString(), '((nwr["amenity"];););')

      var r = f.toLokijs()
      assert.deepEqual(r, { $or: [ { $or: [ { 'tags.amenity': { $exists: true } } ] } ] })

      var r = f.cacheDescriptors()
      assert.deepEqual(r, [ { id: 'nwr["amenity"](properties:1)' } ])

      var r = f.match({ tags: { amenity: 'restaurant' } })
      assert.equal(r, true, 'Object should match')
      var r = f.match({ tags: { amenity: 'cafe' } })
      assert.equal(r, true, 'Object should match')
      var r = f.match({ tags: { shop: 'supermarket' } })
      assert.equal(r, false, 'Object should not match')
    })

    it ('((nwr[a=b];nwr[c=d];);(nwr[amenity];);)', function () {
      var f = new Filter('((nwr[a=b];nwr[c=d];);(nwr[amenity];);)')
      assert.deepEqual(f.def, {or:[
        {or:[
          [{"key":"a","op":"=","value":"b"}],
          [{"key":"c","op":"=","value":"d"}],
        ]},
        {or:[
          [{"key":"amenity","op":"has_key"}]
        ]}
      ]})
      assert.equal(f.toString(), '((nwr["a"="b"];nwr["c"="d"];);(nwr["amenity"];););')

      var r = f.toLokijs()
      assert.deepEqual(r, { $or: [ { $or: [ { 'tags.a': { $eq: 'b' } }, { 'tags.c': { $eq: 'd' } } ] }, { $or: [ { 'tags.amenity': { $exists: true } } ] } ] })

      var r = f.cacheDescriptors()
      assert.deepEqual(r, [
        { id: 'nwr["a"="b"](properties:1)' },
        { id: 'nwr["c"="d"](properties:1)' },
        { id: 'nwr["amenity"](properties:1)' }
      ])

      var r = f.match({ tags: { amenity: 'restaurant' } })
      assert.equal(r, true, 'Object should match')
      var r = f.match({ tags: { amenity: 'cafe' } })
      assert.equal(r, true, 'Object should match')
      var r = f.match({ tags: { shop: 'supermarket' } })
      assert.equal(r, false, 'Object should not match')
    })

    it ('nwr[shop];nwr[amenity];', function () {
      var f = new Filter('nwr[shop];nwr[amenity];')
      assert.deepEqual(f.def, [
        [{"key":"shop","op":"has_key"}],
        [{"key":"amenity","op":"has_key"}],
      ])
      assert.equal(f.toString(), 'nwr["shop"];nwr["amenity"];')

      var r = f.toLokijs()
      assert.deepEqual(r, { 'tags.amenity': { $exists: true } })

      var r = f.cacheDescriptors()
      assert.deepEqual(r, [ { id: 'nwr["amenity"](properties:1)' } ])

      var r = f.match({ tags: { amenity: 'restaurant' } })
      assert.equal(r, true, 'Object should match')
      var r = f.match({ tags: { amenity: 'cafe' } })
      assert.equal(r, true, 'Object should match')
      var r = f.match({ tags: { shop: 'supermarket' } })
      assert.equal(r, false, 'Object should not match')
    })

    it ('node[amenity=restaurant]', function () {
      var f = new Filter('node[amenity=restaurant]')
      assert.deepEqual(f.def, [{type:"node"},{"key":"amenity","op":"=","value":"restaurant"}])
      assert.equal(f.toString(), 'node["amenity"="restaurant"];')

      var r = f.toLokijs()
      assert.deepEqual(r, { 'type': { $eq: 'node' }, 'tags.amenity': { $eq: 'restaurant' } })

      var r = f.cacheDescriptors()
      assert.deepEqual(r, [ { id: 'node["amenity"="restaurant"](properties:1)' } ])

      var r = f.match({ type: 'node', tags: { amenity: 'restaurant' } })
      assert.equal(r, true, 'Object should match')
      var r = f.match({ type: 'way', tags: { amenity: 'restaurant' } })
      assert.equal(r, false, 'Object should not match')
      var r = f.match({ type: 'node', tags: { amenity: 'cafe' } })
      assert.equal(r, false, 'Object should not match')
      var r = f.match({ type: 'node', tags: { shop: 'supermarket' } })
      assert.equal(r, false, 'Object should not match')
    })

    it ('node[amenity][amenity!=restaurant]', function () {
      var f = new Filter('node[amenity][amenity!=restaurant]')
      assert.deepEqual(f.def, [{type:"node"},{"key":"amenity","op":"has_key"},{"key":"amenity","op":"!=","value":"restaurant"}])
      assert.equal(f.toString(), 'node["amenity"]["amenity"!="restaurant"];')

      var r = f.toLokijs()
      assert.deepEqual(r, { 'type': { $eq: 'node' }, 'tags.amenity': { $and: [ { $exists: true }, { $ne: 'restaurant' } ] } } )

      var r = f.cacheDescriptors()
      assert.deepEqual(r, [ { id: 'node["amenity"]["amenity"!="restaurant"](properties:1)' } ])

      var r = f.match({ type: 'node', tags: { amenity: 'restaurant' } })
      assert.equal(r, false, 'Object should not match')
      var r = f.match({ type: 'way', tags: { amenity: 'restaurant' } })
      assert.equal(r, false, 'Object should not match')
      var r = f.match({ type: 'node', tags: { amenity: 'cafe' } })
      assert.equal(r, true, 'Object should match')
      var r = f.match({ type: 'node', tags: { shop: 'supermarket' } })
      assert.equal(r, false, 'Object should not match')
    })

    it ('node[amenity][amenity!=cafe][amenity!=restaurant]', function () {
      var f = new Filter('node[amenity][amenity!=cafe][amenity!=restaurant]')
      assert.deepEqual(f.def, [{type:"node"},{"key":"amenity","op":"has_key"},{"key":"amenity","op":"!=","value":"cafe"},{"key":"amenity","op":"!=","value":"restaurant"}])
      assert.equal(f.toString(), 'node["amenity"]["amenity"!="cafe"]["amenity"!="restaurant"];')

      var r = f.toLokijs()
      assert.deepEqual(r, { 'type': { $eq: 'node' }, 'tags.amenity': { $and: [ { $exists: true }, { $ne: 'cafe' }, { $ne: 'restaurant' } ] } } )

      var r = f.cacheDescriptors()
      assert.deepEqual(r, [ { id: 'node["amenity"]["amenity"!="cafe"]["amenity"!="restaurant"](properties:1)' } ])

      var r = f.match({ type: 'node', tags: { amenity: 'restaurant' } })
      assert.equal(r, false, 'Object should not match')
      var r = f.match({ type: 'way', tags: { amenity: 'restaurant' } })
      assert.equal(r, false, 'Object should not match')
      var r = f.match({ type: 'node', tags: { amenity: 'cafe' } })
      assert.equal(r, false, 'Object should not match')
      var r = f.match({ type: 'node', tags: { shop: 'supermarket' } })
      assert.equal(r, false, 'Object should not match')
    })

    it ('nwr[amenity=restaurant][shop]', function () {
      var f = new Filter('nwr[amenity=restaurant][shop]')
      assert.deepEqual(f.def, [{"key":"amenity","op":"=","value":"restaurant"},{"key":"shop","op":"has_key"}])
      assert.equal(f.toString(), 'nwr["amenity"="restaurant"]["shop"];')

      var r = f.toLokijs()
      assert.deepEqual(r, { 'tags.amenity': { $eq: 'restaurant' }, 'tags.shop': { $exists: true } })

      var r = f.cacheDescriptors()
      assert.deepEqual(r, [ { id: 'nwr["amenity"="restaurant"]["shop"](properties:1)' } ])

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
      var f = new Filter('nwr[cuisine^asian]')
      assert.deepEqual(f.def, [{"key":"cuisine","op":"has","value":"asian"}])
      assert.equal(f.toString(), 'nwr["cuisine"~"^(.*;|)asian(|;.*)$"];')

      var r = f.toLokijs()
      assert.deepEqual(r, { 'tags.cuisine': { $regex: '^(.*;|)asian(|;.*)$' } })

      var r = f.cacheDescriptors()
      assert.deepEqual(r, [ { id: 'nwr["cuisine"~"^(.*;|)asian(|;.*)$"](properties:1)' } ])

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

    it ('nwr["amenity"=\'restaurant\']["shop"~"super"]', function () {
      var f = new Filter('nwr["amenity"=\'restaurant\']["shop"~"super"]')
      assert.deepEqual(f.def, [{"key":"amenity","op":"=","value":"restaurant"},{"key":"shop","op":"~","value":"super"}])
      assert.equal(f.toString(), 'nwr["amenity"="restaurant"]["shop"~"super"];')

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
      var f = new Filter('(node[amenity=cafe][cuisine=ice_cream];node[amenity=ice_cream];node[shop=ice_cream];)')
      assert.deepEqual(f.def,
        {or: [
          [{type:"node"},{"key":"amenity","op":"=","value":"cafe"},{"key":"cuisine","op":"=","value":"ice_cream"}],
          [{type:"node"},{"key":"amenity","op":"=","value":"ice_cream"}],
          [{type:"node"},{"key":"shop","op":"=","value":"ice_cream"}]
        ]}
      )

      assert.equal(f.toString(), '(node["amenity"="cafe"]["cuisine"="ice_cream"];node["amenity"="ice_cream"];node["shop"="ice_cream"];);')

      var r = f.toLokijs()
      assert.deepEqual(r, { $or: [
        { 'type': { $eq: 'node' }, 'tags.amenity': { $eq: 'cafe' }, 'tags.cuisine': { $eq: 'ice_cream' } },
        { 'type': { $eq: 'node' }, 'tags.amenity': { $eq: 'ice_cream' } },
        { 'type': { $eq: 'node' }, 'tags.shop': { $eq: 'ice_cream' } }
      ]})

      var r = f.cacheDescriptors()
      assert.deepEqual(r, [
        { id: 'node["amenity"="cafe"]["cuisine"="ice_cream"](properties:1)' },
        { id: 'node["amenity"="ice_cream"](properties:1)' },
        { id: 'node["shop"="ice_cream"](properties:1)' },
      ])

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
      var f = new Filter('nwr[~wikipedia~"."]')
      assert.deepEqual(f.def, [{"key":"wikipedia","keyRegexp":true,"op":"has_key"}])
      assert.equal(f.toString(), 'nwr[~"wikipedia"~"."];')

      var r = f.toLokijs()
      assert.deepEqual(r, { needMatch: true })

      var r = f.cacheDescriptors()
      assert.deepEqual(r, [ { id: 'nwr[~"wikipedia"~"."](properties:1)' } ])

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
      var f = new Filter('nwr[~wikipedia~"foo"]')
      assert.deepEqual(f.def, [{"key":"wikipedia","keyRegexp":true,"op":"~","value":"foo"}])
      assert.equal(f.toString(), 'nwr[~"wikipedia"~"foo"];')

      var r = f.toLokijs()
      assert.deepEqual(r, { needMatch: true })

      var r = f.cacheDescriptors()
      assert.deepEqual(r, [ { id: 'nwr[~"wikipedia"~"foo"](properties:1)' } ])

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
      var f = new Filter('nwr[~wikipedia~".",i]')
      assert.deepEqual(f.def, [{"key":"wikipedia","keyRegexp":"i","op":"has_key"}])
      assert.equal(f.toString(), 'nwr[~"wikipedia"~".",i];')

      var r = f.toLokijs()
      assert.deepEqual(r, { needMatch: true })

      var r = f.cacheDescriptors()
      assert.deepEqual(r, [ { id: 'nwr[~"wikipedia"~".",i](properties:1)' } ])

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
      var f = new Filter('nwr[~wikipedia~"foo",i]')
      assert.deepEqual(f.def, [{"key":"wikipedia","keyRegexp":"i","op":"~i","value":"foo"}])
      assert.equal(f.toString(), 'nwr[~"wikipedia"~"foo",i];')

      var r = f.toLokijs()
      assert.deepEqual(r, { needMatch: true })

      var r = f.cacheDescriptors()
      assert.deepEqual(r, [ { id: 'nwr[~"wikipedia"~"foo",i](properties:1)' } ])

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

    it ('(nwr[~wikipedia~"foo"];node[amenity];)', function () {
      var f = new Filter('(nwr[~wikipedia~"foo"];node[amenity];)')
      assert.deepEqual(f.def, {or:[
        [{"key":"wikipedia","keyRegexp":true,"op":"~","value":"foo"}],
        [{"type":"node"},{"key":"amenity","op":"has_key"}],
      ]})
      assert.equal(f.toString(), '(nwr[~"wikipedia"~"foo"];node["amenity"];);')

      var r = f.toLokijs()
      assert.deepEqual(r, { needMatch: true })

      var r = f.cacheDescriptors()
      assert.deepEqual(r, [
        { id: 'nwr[~"wikipedia"~"foo"](properties:1)' },
        { id: 'node["amenity"](properties:1)' }
      ])

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
    it ('(nwr[~wikipedia~"."];)', function () {
      var f = new Filter('(nwr[~wikipedia~"."];)')

      var r = f.cacheDescriptors()
      assert.deepEqual(r, [ { id: 'nwr[~"wikipedia"~"."](properties:1)' } ])

      var r = f.toLokijs()
      assert.deepEqual(r, { needMatch: true })
    })

    it ('(nwr[~wikipedia~"."];node[foo];)', function () {
      var f = new Filter('(nwr[~wikipedia~"."];node[foo];)')

      var r = f.cacheDescriptors()
      assert.deepEqual(r, [
        { id: 'nwr[~"wikipedia"~"."](properties:1)' },
        { id: 'node["foo"](properties:1)' }
      ])

      var r = f.toLokijs()
      assert.deepEqual(r, { needMatch: true })
    })

    it ('node[amenity][~wikipedia~"."]', function () {
      var f = new Filter([ { type: 'node' }, { key: 'amenity', 'op': 'has_key' }, { keyRegexp: true, op: 'has_key', key: 'wikipedia' } ])

      var r = f.cacheDescriptors()
      assert.deepEqual(r, [ { id: 'node["amenity"][~"wikipedia"~"."](properties:1)' } ])

      var r = f.toLokijs()
      assert.deepEqual(r, { "type": { $eq: "node" }, "tags.amenity": { "$exists": true }, "needMatch": true })
    })

    it ('(nwr[~wikipedia~"foo"];node[amenity];)', function () {
      var f = new Filter({ "or": [
        [ { keyRegexp: true, op: '~', key: 'wikipedia', value: 'foo' } ],
        [ { type: 'node' }, { key: 'amenity', 'op': 'has_key' } ]
      ]})

      var r = f.cacheDescriptors()
      assert.deepEqual(r, [
        { id: 'nwr[~"wikipedia"~"foo"](properties:1)' },
        { id: 'node["amenity"](properties:1)' }
      ])

      var r = f.toLokijs()
      assert.deepEqual(r, {"needMatch":true})
    })

    it ("way[railway=rail][railway!~'^(platform|abandoned|disused|station|proposed|subway_entrance)$'][usage~'^(main|branch)$'];", function () {
      var f = new Filter("way[railway=rail][railway!~'^(platform|abandoned|disused|station|proposed|subway_entrance)$'][usage~'^(main|branch)$'];")

      var r = f.cacheDescriptors()
      assert.deepEqual(r, [ { id: 'way["railway"="rail"]["railway"!~"^(platform|abandoned|disused|station|proposed|subway_entrance)$"]["usage"~"^(main|branch)$"](properties:1)' } ])

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

      var r = f.cacheDescriptors()
      assert.deepEqual(r, [ { id: 'nwr["cuisine"~"^(.*;|)asian(|;.*)$"](properties:1)' } ])
    })

    it ('nwr["amenity"=\'restaurant\']["sh\\"op"]', function () {
      var f = new Filter('nwr["amenity"=\'restaurant\']["sh\\"op"]')
      assert.equal(f.toString(), 'nwr["amenity"="restaurant"]["sh\\"op"];')

      var r = f.cacheDescriptors()
      assert.deepEqual(r, [ { id: 'nwr["amenity"="restaurant"]["sh\\"op"](properties:1)' } ])
    })

    it ('(node[amenity=cafe][cuisine=ice_cream];node[amenity=ice_cream];node[shop=ice_cream];)', function () {
      var f = new Filter(' (\nnode[amenity=cafe][cuisine=ice_cream] ; node[amenity=ice_cream];node[shop=ice_cream];\n)')
      assert.equal(f.toString(), '(node["amenity"="cafe"]["cuisine"="ice_cream"];node["amenity"="ice_cream"];node["shop"="ice_cream"];);')

      var r = f.cacheDescriptors()
      assert.deepEqual(r, [
        { id: 'node["amenity"="cafe"]["cuisine"="ice_cream"](properties:1)' },
        { id: 'node["amenity"="ice_cream"](properties:1)' },
        { id: 'node["shop"="ice_cream"](properties:1)' },
      ])
    })

    it ('node[~wikipedia~"."]', function () {
      var f = new Filter('node[~wikipedia]')
      assert.deepEqual(f.def, [
        { type: 'node' },
        { key: 'wikipedia', op: 'has_key', keyRegexp: true }
      ])
      assert.equal(f.toString(), 'node[~"wikipedia"~"."];')

      var r = f.cacheDescriptors()
      assert.deepEqual(r, [ { id: 'node[~"wikipedia"~"."](properties:1)' } ])
    })

    it ('node[~"wikipedia"~"."]', function () {
      var f = new Filter('node[~"wikipedia"~"."]')
      assert.deepEqual(f.def, [
        { type: 'node' },
        { key: 'wikipedia', op: 'has_key', keyRegexp: true }
      ])
      assert.equal(f.toString(), 'node[~"wikipedia"~"."];')

      var r = f.cacheDescriptors()
      assert.deepEqual(r, [ { id: 'node[~"wikipedia"~"."](properties:1)' } ])
    })

    it ('node[~"wikipedia"~"foo"]', function () {
      var f = new Filter('node[~"wikipedia"~"foo"]')
      assert.equal(f.toString(), 'node[~"wikipedia"~"foo"];')

      var r = f.cacheDescriptors()
      assert.deepEqual(r, [ { id: 'node[~"wikipedia"~"foo"](properties:1)' } ])
    })

    it ('node[~"wikipedia"~".",i]', function () {
      var f = new Filter('node[~"wikipedia"~".",i]')

      assert.deepEqual(f.def, [
        { type: 'node' },
        { key: 'wikipedia', op: 'has_key', keyRegexp: 'i' }
      ])
      assert.equal(f.toString(), 'node[~"wikipedia"~".",i];')

      var r = f.cacheDescriptors()
      assert.deepEqual(r, [ { id: 'node[~"wikipedia"~".",i](properties:1)' } ])
    })

    it ('node[~"wikipedia"~"foo",i]', function () {
      var f = new Filter('node[~"wikipedia"~"foo",i]')

      assert.deepEqual(f.def, [
        { type: 'node' },
        { key: 'wikipedia', op: '~i', value: 'foo', keyRegexp: 'i' }
      ])
      assert.equal(f.toString(), 'node[~"wikipedia"~"foo",i];')

      var r = f.cacheDescriptors()
      assert.deepEqual(r, [ { id: 'node[~"wikipedia"~"foo",i](properties:1)' } ])
    })
  })

  describe('script (several statements)', function () {
    it('node;way[a=b];', function () {
      let f = new Filter('node;way[a=b];')
      assert.deepEqual(f.def, [[{"type":"node"}],[{"type":"way"},{"key":"a","op":"=","value":"b"}]])
      assert.equal(f.toString(), 'node;way["a"="b"];')
      assert.equal(f.toQl(), 'node;way["a"="b"];')
      assert.deepEqual(f.toLokijs(), {"type":{"$eq":"way"},"tags.a":{"$eq":"b"}})

      var r = f.cacheDescriptors()
      assert.deepEqual(r, [ { id: 'way["a"="b"](properties:1)' } ])
    })
  })

  describe('or', function () {
    it('or1', function () {
      let f = new Filter({ or: [ [ { key: 'name', value: '49', op: '~' } ], [ { key: 'ref', value: '49', op: '=' } ] ] })

      assert.equal(f.toString(), '(nwr["name"~"49"];nwr["ref"="49"];);')
      assert.equal(f.toQl(), '(nwr["name"~"49"];nwr["ref"="49"];);')
      assert.deepEqual(f.toLokijs(), {"$or":[{"tags.name":{"$regex":/49/}},{"tags.ref":{"$eq":"49"}}]})

      var r = f.cacheDescriptors()
      assert.deepEqual(r, [
        { id: 'nwr["name"~"49"](properties:1)' },
        { id: 'nwr["ref"="49"](properties:1)' }
      ])
    })

    it('or2', function () {
      let f = new Filter([
        { or: [ [ { key: 'name', value: '49', op: '~' } ], [ { key: 'ref', value: '49', op: '=' } ] ] },
        { key: 'route', value: 'bus', op: '=' }
      ])

      assert.equal(f.toString(), '(nwr["name"~"49"]["route"="bus"];nwr["ref"="49"]["route"="bus"];);')
      assert.equal(f.toQl(), '(nwr["name"~"49"]["route"="bus"];nwr["ref"="49"]["route"="bus"];);')
      assert.deepEqual(f.toLokijs(), {"tags.route":{"$eq":"bus"},"$or":[{"tags.name":{"$regex":/49/}},{"tags.ref":{"$eq":"49"}}]})

      var r = f.cacheDescriptors()
      assert.deepEqual(r, [
        { id: 'nwr["name"~"49"]["route"="bus"](properties:1)' },
        { id: 'nwr["ref"="49"]["route"="bus"](properties:1)' }
      ])
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

      var r = f.cacheDescriptors()
      assert.deepEqual(r, [
        { id: 'nwr["name"~"49"]["route"="bus"]["operator"="ÖBB"](properties:1)' },
        { id: 'nwr["ref"="49"]["route"="bus"]["operator"="ÖBB"](properties:1)' },
        { id: 'nwr["name"~"49"]["route"="bus"]["operator"="WL"](properties:1)' },
        { id: 'nwr["ref"="49"]["route"="bus"]["operator"="WL"](properties:1)' }
      ])
    })
  })

  it('case-sensitive regexp', function () {
    var f = new Filter('node["name"~"test"]')

    assert.deepEqual(f.def, [{"type":"node"},{"key":"name","op":"~","value":"test"}])
    assert.equal(f.toString(), 'node["name"~"test"];')
    assert.equal(f.toQl(), 'node["name"~"test"];')
    assert.deepEqual(f.toLokijs(), { type: { '$eq': 'node' }, 'tags.name': { '$regex': /test/ } })

    check(f, [ 3, 5 ])

    const r = f.cacheDescriptors()
    assert.deepEqual(r, [ { id: 'node["name"~"test"](properties:1)' } ])
  })

  it('case-sensitive !regexp', function () {
    var f = new Filter('node["name"!~"test"]')

    assert.deepEqual(f.def, [{"type":"node"},{"key":"name","op":"!~","value":"test"}])
    assert.equal(f.toString(), 'node["name"!~"test"];')
    assert.equal(f.toQl(), 'node["name"!~"test"];')
    assert.deepEqual(f.toLokijs(), { type: { '$eq': 'node' }, 'tags.name': { '$not': { '$regex': /test/ } } })

    check(f, [ 1, 2, 4, 6, 7 ])

    const r = f.cacheDescriptors()
    assert.deepEqual(r, [ { id: 'node["name"!~"test"](properties:1)' } ])
  })

  it('case-insenstive regexp', function () {
    var f = new Filter('node["name"~"test",i]')

    assert.deepEqual(f.def, [{"type":"node"},{"key":"name","op":"~i","value":"test"}])
    assert.equal(f.toString(), 'node["name"~"test",i];')
    assert.equal(f.toQl(), 'node["name"~"test",i];')
    assert.deepEqual(f.toLokijs(), { type: { '$eq': 'node' }, 'tags.name': { '$regex': /test/i } })

    check(f, [ 3, 4, 5, 6 ])

    var r = f.cacheDescriptors()
    assert.deepEqual(r, [ { id: 'node["name"~"test",i](properties:1)' } ])
  })

  it('case-insenstive !regexp', function () {
    var f = new Filter('node["name"!~"test",i]')

    assert.deepEqual(f.def, [{"type":"node"},{"key":"name","op":"!~i","value":"test"}])
    assert.equal(f.toString(), 'node["name"!~"test",i];')
    assert.equal(f.toQl(), 'node["name"!~"test",i];')
    assert.deepEqual(f.toLokijs(), { type: { '$eq': 'node' }, 'tags.name': { '$not': { '$regex': /test/i } } })

    check(f, [ 1, 2, 7 ])

    var r = f.cacheDescriptors()
    assert.deepEqual(r, [ { id: 'node["name"!~"test",i](properties:1)' } ])
  })

  it('!=', function () {
    var f = new Filter('node["name"!="test"]')

    assert.deepEqual(f.def, [{"type":"node"},{"key":"name","op":"!=","value":"test"}])
    assert.equal(f.toString(), 'node["name"!="test"];')
    assert.equal(f.toQl(), 'node["name"!="test"];')
    assert.deepEqual(f.toLokijs(), { type: { '$eq': 'node' }, 'tags.name': { '$ne': 'test' } })

    check(f, [ 1, 2, 4, 5, 6, 7 ])

    var r = f.cacheDescriptors()
    assert.deepEqual(r, [ { id: 'node["name"!="test"](properties:1)' } ])
  })

  it('key regexp', function () {
    var f = new Filter('node[~"na"~"."]')

    assert.deepEqual(f.def, [{"type":"node"},{"key":"na","keyRegexp":true,"op":"has_key"}])
    assert.equal(f.toString(), 'node[~"na"~"."];')
    assert.equal(f.toQl(), 'node[~"na"~"."];')
    assert.deepEqual(f.toLokijs(), { type: { '$eq': 'node' }, needMatch: true })

    check(f, [ 2, 3, 4, 5, 6, 7 ])

    var r = f.cacheDescriptors()
    assert.deepEqual(r, [ { id: 'node[~"na"~"."](properties:1)' } ])
  })

  it('strsearch', function () {
    var f = new Filter('node["name"%"test"]')

    assert.deepEqual(f.def, [{"type":"node"},{"key":"name","op":"strsearch","value":"test"}])
    assert.equal(f.toString(), 'node["name"~"t[eèeéêëė][sß]t",i];')
    assert.equal(f.toQl(), 'node["name"~"t[eèeéêëė][sß]t",i];')
    assert.deepEqual(f.toLokijs(), { type: { '$eq': 'node' }, "tags.name": { "$regex": /t[eèeéêëė][sß]t/i } })

    check(f, [ 3, 4, 5, 6, 7 ])

    var r = f.cacheDescriptors()
    assert.deepEqual(r, [ { id: 'node["name"~"t[eèeéêëė][sß]t",i](properties:1)' } ])
  })

  it('has', function () {
    var f = new Filter('node["cuisine"^"ice_cream"]')

    assert.deepEqual(f.def, [{"type":"node"},{"key":"cuisine","op":"has","value":"ice_cream"}])
    assert.equal(f.toString(), 'node["cuisine"~"^(.*;|)ice_cream(|;.*)$"];')
    assert.equal(f.toQl(), 'node["cuisine"~"^(.*;|)ice_cream(|;.*)$"];')
    assert.deepEqual(f.toLokijs(), { type: { '$eq': 'node' }, "tags.cuisine": { "$regex": "^(.*;|)ice_cream(|;.*)$" } })

    check(f, [ 2, 3, 4, 5 ])

    var r = f.cacheDescriptors()
    assert.deepEqual(r, [ { id: 'node["cuisine"~"^(.*;|)ice_cream(|;.*)$"](properties:1)' } ])
  })

  it('has_key', function () {
    var f = new Filter('node["cuisine"]')

    assert.deepEqual(f.def, [{"type":"node"},{"key":"cuisine","op":"has_key"}])
    assert.equal(f.toString(), 'node["cuisine"];')
    assert.equal(f.toQl(), 'node["cuisine"];')
    assert.deepEqual(f.toLokijs(), { type: { '$eq': 'node' }, "tags.cuisine": { "$exists": true } })

    check(f, [ 2, 3, 4, 5, 6 ])

    var r = f.cacheDescriptors()
    assert.deepEqual(r, [ { id: 'node["cuisine"](properties:1)' } ])
  })

  it('not_exists', function () {
    var f = new Filter('node[!"cuisine"]')

    assert.deepEqual(f.def, [{"type":"node"},{"key":"cuisine","op":"not_exists"}])
    assert.equal(f.toString(), 'node[!"cuisine"];')
    assert.equal(f.toQl(), 'node[!"cuisine"];')
    assert.deepEqual(f.toLokijs(), { type: { '$eq': 'node' }, "tags.cuisine": { "$exists": false } })

    check(f, [ 1, 7 ])

    var r = f.cacheDescriptors()
    assert.deepEqual(r, [ { id: 'node[!"cuisine"](properties:1)' } ])
  })

  describe('illegal filters', function () {
    it('nod', function () {
      try {
        var f = new Filter('nod')
      }
      catch (e) {
        return assert.equal(e.message, "Can't parse query, expected type of object (e.g. 'node'): nod")
      }
      assert.fail("Expect an Exception")
    })

    it('nodes', function () {
      try {
        var f = new Filter('nodes')
      }
      catch (e) {
        return assert.equal(e.message, "Can't parse query, expected '[' or ';': s")
      }
      assert.fail("Expect an Exception")
    })

    it('node[amenity', function () {
      try {
        var f = new Filter('node[amenity')
      }
      catch (e) {
        assert.equal(e.message, "Can't parse query, expected operator or ']': ")
        return
      }
      assert.fail("Expect an Exception")
    })

    it('node[amenity=bench', function () {
      try {
        var f = new Filter('node[amenity')
      }
      catch (e) {
        assert.equal(e.message, "Can't parse query, expected operator or ']': ")
        return
      }
      assert.fail("Expect an Exception")
    })
  })
})

describe('and', function () {
  /*
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

    var r = f.cacheDescriptors()
    assert.deepEqual(r, [ { id: 'node["amenity"="cafe"]["cuisine"~"^(.*;|)ice_cream(|;.*)$"](properties:1)' }])
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
*/
  it('merge two filters', function () {
    var f1 = new Filter('nwr[amenity=restaurant]')
    var f2 = new Filter('nwr[cuisine]')
    var f = new Filter({and: [ f1, f2 ]})

    assert.deepEqual(f.def, {"and":[[{"key":"amenity","op":"=","value":"restaurant"}],[{"key":"cuisine","op":"has_key"}]]})
    assert.equal(f.toString(), 'nwr["amenity"="restaurant"]->.x1;nwr.x1["cuisine"];')
    assert.equal(f.toQl(), 'nwr["amenity"="restaurant"]->.x2;nwr.x2["cuisine"];')
    assert.deepEqual(f.toLokijs(), { $and: [
      { 'tags.amenity': { $eq: 'restaurant' } },
      { 'tags.cuisine': { $exists: true } }
    ]})

    check(f, [])

    var r = f.cacheDescriptors()
    assert.deepEqual(r, [ { id: 'nwr["amenity"="restaurant"]["cuisine"](properties:1)' } ])
  })

  it('merge two filters - with or as first', function () {
    var f1 = new Filter('(node[amenity=restaurant];way[amenity=restaurant];)')
    var f2 = new Filter('nwr[cuisine]')
    var f = new Filter({and: [ f1, f2 ]})

    assert.deepEqual(f.def, {"and":[
      {"or":[
        [{"type":"node"},{"key":"amenity","op":"=","value":"restaurant"}],
        [{"type":"way"},{"key":"amenity","op":"=","value":"restaurant"}],
      ]},
      [{"key":"cuisine","op":"has_key"}]
    ]})
    assert.equal(f.toString(), '(node["amenity"="restaurant"];way["amenity"="restaurant"];)->.x1;nwr.x1["cuisine"];')
    assert.equal(f.toQl(), '(node["amenity"="restaurant"];way["amenity"="restaurant"];)->.x2;nwr.x2["cuisine"];')
    assert.deepEqual(f.toLokijs(), { $and: [
      { $or: [
        { type: { $eq: 'node' }, 'tags.amenity': { $eq: 'restaurant' } },
        { type: { $eq: 'way' }, 'tags.amenity': { $eq: 'restaurant' } }
      ]},
      { 'tags.cuisine': { $exists: true } }
    ]})

    check(f, [])

    var r = f.cacheDescriptors()
    assert.deepEqual(r, [
      { id: 'node["amenity"="restaurant"]["cuisine"](properties:1)' },
      { id: 'way["amenity"="restaurant"]["cuisine"](properties:1)' }
    ])
  })

  it('merge two filters - with or as first', function () {
    var f1 = new Filter('nwr[cuisine]')
    var f2 = new Filter('(node[amenity=restaurant];way[amenity=restaurant];)')
    var f = new Filter({and: [ f1, f2 ]})

    assert.deepEqual(f.def, {"and":[
      [{"key":"cuisine","op":"has_key"}],
      {"or":[
        [{"type":"node"},{"key":"amenity","op":"=","value":"restaurant"}],
        [{"type":"way"},{"key":"amenity","op":"=","value":"restaurant"}],
      ]}
    ]})
    assert.equal(f.toString(), 'nwr["cuisine"]->.x1;(node.x1["amenity"="restaurant"];way.x1["amenity"="restaurant"];);')
    assert.equal(f.toQl(), 'nwr["cuisine"]->.x2;(node.x2["amenity"="restaurant"];way.x2["amenity"="restaurant"];);')
    assert.deepEqual(f.toLokijs(), { $and: [
      { 'tags.cuisine': { $exists: true } },
      { $or: [
        { type: { $eq: 'node' }, 'tags.amenity': { $eq: 'restaurant' } },
        { type: { $eq: 'way' }, 'tags.amenity': { $eq: 'restaurant' } }
      ]}
    ]})

    check(f, [])

    var r = f.cacheDescriptors()
    assert.deepEqual(r, [
      { id: 'node["cuisine"]["amenity"="restaurant"](properties:1)' },
      { id: 'way["cuisine"]["amenity"="restaurant"](properties:1)' }
    ])
  })

  it('merge two filters - with or before and after', function () {
    var f1 = new Filter('(nwr[cuisine];nwr[diet];)')
    var f2 = new Filter('(node[amenity=restaurant];way[amenity=restaurant];)')
    var f = new Filter({and: [ f1, f2 ]})

    assert.deepEqual(f.def, {"and":[
      {"or":[
        [{"key":"cuisine","op":"has_key"}],
        [{"key":"diet","op":"has_key"}],
      ]},
      {"or":[
        [{"type":"node"},{"key":"amenity","op":"=","value":"restaurant"}],
        [{"type":"way"},{"key":"amenity","op":"=","value":"restaurant"}],
      ]}
    ]})
    assert.equal(f.toString(), '(nwr["cuisine"];nwr["diet"];)->.x1;(node.x1["amenity"="restaurant"];way.x1["amenity"="restaurant"];);')
    assert.equal(f.toQl(), '(nwr["cuisine"];nwr["diet"];)->.x2;(node.x2["amenity"="restaurant"];way.x2["amenity"="restaurant"];);')
    assert.deepEqual(f.toLokijs(), { $and: [
      { $or: [
        { 'tags.cuisine': { $exists: true } },
        { 'tags.diet': { $exists: true } },
      ]},
      { $or: [
        { type: { $eq: 'node' }, 'tags.amenity': { $eq: 'restaurant' } },
        { type: { $eq: 'way' }, 'tags.amenity': { $eq: 'restaurant' } }
      ]}
    ]})

    check(f, [])

    var r = f.cacheDescriptors()
    assert.deepEqual(r, [
      { id: 'node["cuisine"]["amenity"="restaurant"](properties:1)' },
      { id: 'node["diet"]["amenity"="restaurant"](properties:1)' },
      { id: 'way["cuisine"]["amenity"="restaurant"](properties:1)' },
      { id: 'way["diet"]["amenity"="restaurant"](properties:1)' }
    ])
  })

  it('merge two filters - with or before and after', function () {
    var f1 = new Filter('(nwr[cuisine];nwr[diet];)')
    var f2 = new Filter('(node[amenity=restaurant];way[amenity=restaurant];)')
    var f = new Filter({and: [ f1, f2 ]})

    assert.deepEqual(f.def, {"and":[
      {"or":[
        [{"key":"cuisine","op":"has_key"}],
        [{"key":"diet","op":"has_key"}],
      ]},
      {"or":[
        [{"type":"node"},{"key":"amenity","op":"=","value":"restaurant"}],
        [{"type":"way"},{"key":"amenity","op":"=","value":"restaurant"}],
      ]}
    ]})
    assert.equal(f.toString(), '(nwr["cuisine"];nwr["diet"];)->.x1;(node.x1["amenity"="restaurant"];way.x1["amenity"="restaurant"];);')
    assert.equal(f.toQl(), '(nwr["cuisine"];nwr["diet"];)->.x2;(node.x2["amenity"="restaurant"];way.x2["amenity"="restaurant"];);')
    assert.deepEqual(f.toLokijs(), { $and: [
      { $or: [
        { 'tags.cuisine': { $exists: true } },
        { 'tags.diet': { $exists: true } },
      ]},
      { $or: [
        { type: { $eq: 'node' }, 'tags.amenity': { $eq: 'restaurant' } },
        { type: { $eq: 'way' }, 'tags.amenity': { $eq: 'restaurant' } }
      ]}
    ]})

    check(f, [])

    var r = f.cacheDescriptors()
    assert.deepEqual(r, [
      { id: 'node["cuisine"]["amenity"="restaurant"](properties:1)' },
      { id: 'node["diet"]["amenity"="restaurant"](properties:1)' },
      { id: 'way["cuisine"]["amenity"="restaurant"](properties:1)' },
      { id: 'way["diet"]["amenity"="restaurant"](properties:1)' }
    ])
  })
})

describe('Filter by id', function () {
  it('numeric', function () {
    var f = new Filter('node(3)')

    assert.deepEqual(f.def, [{"type":"node"},{"fun":"id", "value":[3]}])
    assert.equal(f.toString(), 'node(id:3);')
    assert.equal(f.toQl(), 'node(id:3);')
    assert.deepEqual(f.toLokijs(), { type: { '$eq': 'node' }, $and: [{"osm_id": { "$eq": 3 }}]})

    check(f, [ 3 ])

    var r = f.cacheDescriptors()
    assert.deepEqual(r, [ { id: 'node(properties:0)', ids: [3] } ])
  })

  it('id:', function () {
    var f = new Filter('node(id:3)')

    assert.deepEqual(f.def, [{"type":"node"},{"fun":"id", "value":[3]}])
    assert.equal(f.toString(), 'node(id:3);')
    assert.equal(f.toQl(), 'node(id:3);')
    assert.deepEqual(f.toLokijs(), { type: { '$eq': 'node' }, $and: [{"osm_id": { "$eq": 3 } }]})

    check(f, [ 3 ])

    var r = f.cacheDescriptors()
    assert.deepEqual(r, [ { id: 'node(properties:0)', ids: [3] } ])
  })

  it('id: (multiple)', function () {
    var f = new Filter('node(id:3,4,5)')

    assert.deepEqual(f.def, [{"type":"node"},{"fun":"id", "value":[3,4,5]}])
    assert.equal(f.toString(), 'node(id:3,4,5);')
    assert.equal(f.toQl(), 'node(id:3,4,5);')
    assert.deepEqual(f.toLokijs(), { type: { '$eq': 'node' }, $and:[{"osm_id": { "$in": [ 3, 4, 5 ] }}]})

    check(f, [ 3, 4, 5 ])

    var r = f.cacheDescriptors()
    assert.deepEqual(r, [ { id: 'node(properties:0)', ids: [3, 4, 5] } ])
  })

  it('id: (multiple with or)', function () {
    var f = new Filter('(node(id:3,4,5);way(id:3,4);)')

    assert.deepEqual(f.def, {or: [
      [{"type":"node"},{"fun":"id", "value":[3,4,5]}],
      [{"type":"way"},{"fun":"id", "value":[3,4]}]
    ]})
    assert.equal(f.toString(), '(node(id:3,4,5);way(id:3,4););')
    assert.equal(f.toQl(), '(node(id:3,4,5);way(id:3,4););')
    assert.deepEqual(f.toLokijs(), { $or: [
      { type: { '$eq': 'node' }, $and: [{"osm_id": { "$in": [ 3, 4, 5 ] }}]},
      { type: { '$eq': 'way' }, $and: [{"osm_id": { "$in": [ 3, 4 ] }}]}
    ]})

    check(f, [ 3, 4, 5 ])

    var r = f.cacheDescriptors()
    assert.deepEqual(r, [
      { id: 'node(properties:0)', ids: [3, 4, 5] },
      { id: 'way(properties:0)', ids: [3, 4] }
    ])
  })

  it('id: (multiple with or)', function () {
    var f = new Filter([
      {or: [
        [{"fun":"id", "value":[3,4,5]}],
        [{"fun":"id", "value":[3,4]}]
      ]},
      {key:"amenity",op:"has_key"}
    ])

    assert.equal(f.toString(), '(nwr(id:3,4,5)["amenity"];nwr(id:3,4)["amenity"];);')
    assert.equal(f.toQl(), '(nwr(id:3,4,5)["amenity"];nwr(id:3,4)["amenity"];);')
    assert.deepEqual(f.toLokijs(), { $or: [
      {$and: [{ "osm_id": { "$in": [ 3, 4, 5 ] } }]},
      {$and: [{ "osm_id": { "$in": [ 3, 4 ] } }]}
    ], "tags.amenity": { $exists: true }})

    check(f, [ 3, 4, 5 ])

    var r = f.cacheDescriptors()
    assert.deepEqual(r, [
      { id: 'nwr["amenity"](properties:1)', ids: [3, 4, 5] },
      { id: 'nwr["amenity"](properties:1)', ids: [3, 4] }
    ])
  })

  it('id: (multiple in one query)', function () {
    var f = new Filter('node(id:1,2,4,5)(id:1,3,5)')

    assert.deepEqual(f.def, [{"type":"node"},{"fun":"id", "value":[1,2,4,5]},{"fun":"id", "value":[1,3,5]}])

    assert.equal(f.toString(), 'node(id:1,2,4,5)(id:1,3,5);')
    assert.equal(f.toQl(), 'node(id:1,2,4,5)(id:1,3,5);')
    assert.deepEqual(f.toLokijs(), { type: { '$eq': 'node' }, $and: [{"osm_id": { "$in": [ 1, 2, 4, 5 ] }}, {"osm_id":{ "$in": [ 1, 3, 5 ] }} ]})

    check(f, [ 1, 5 ])

    var r = f.cacheDescriptors()
    assert.deepEqual(r, [
      { id: 'node(properties:0)', ids: [1, 5] },
    ])
  })

  it('id: (multiple with and)', function () {
    var f = new Filter([
      {or: [
        [{"fun":"id", "value":[1, 2, 4, 5]}],
      ]},
      {"fun":"id", "value":[1, 3, 5]}
    ])

    assert.equal(f.toString(), 'nwr(id:1,2,4,5)(id:1,3,5);')
    assert.equal(f.toQl(), 'nwr(id:1,2,4,5)(id:1,3,5);')
    assert.deepEqual(f.toLokijs(),
      {
        $and: [ {"osm_id": { $in: [ 1, 3, 5 ] }} ],
        $or: [{ $and: [{"osm_id": { "$in": [ 1, 2, 4, 5 ] } }]}],
      })

    check(f, [ 1, 5 ])

    var r = f.cacheDescriptors()
    assert.deepEqual(r, [
      { id: 'nwr(properties:0)', ids: [1, 5] },
    ])
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

    var r = f.cacheDescriptors()
    assert.deepEqual(r, [ { id:"node(properties:16)",bounds:{"type":"Polygon","coordinates":[[[15.465769011510112,47.079116292410326],[15.46574364059531,47.079291741398514],[15.465668493825438,47.07946044852533],[15.465546458637188,47.07961593037691],[15.465382224499415,47.079752211732746],[15.465182102741352,47.0798640552115],[15.464953784026477,47.0799471625657],[15.46470604278992,47.07999833988624],[15.464448400000002,47.08001562036372],[15.464190757210083,47.07999833988624],[15.463943015973527,47.0799471625657],[15.463714697258652,47.0798640552115],[15.463514575500588,47.079752211732746],[15.463350341362815,47.07961593037691],[15.463228306174566,47.07946044852533],[15.463153159404694,47.079291741398514],[15.463127788489892,47.079116292410326],[15.463153167934774,47.07894084399987],[15.463228321936096,47.078772138518275],[15.463350361956252,47.078616659128976],[15.46351459779076,47.07848038067756],[15.463714717852085,47.07836854010326],[15.463943031735061,47.07828543521131],[15.464190765740163,47.07823425953603],[15.464448400000002,47.07821697963628],[15.46470603425984,47.07823425953603],[15.464953768264943,47.07828543521131],[15.46518208214792,47.07836854010326],[15.465382202209243,47.07848038067756],[15.465546438043752,47.078616659128976],[15.465668478063908,47.078772138518275],[15.46574363206523,47.07894084399987],[15.465769011510112,47.079116292410326]]]} }])
  })

  it('merge two filters (tags + around)', function () {
    var f1 = new Filter('nwr[amenity=restaurant]')
    var f2 = new Filter('nwr(around:100,47.0791163,15.4644484)')
    var f = new Filter({and: [ f1, f2 ]})

    assert.deepEqual(f.def, {"and":[[{"key":"amenity","op":"=","value":"restaurant"}],[{"fun":"around","value":{distance: 100, geometry: { coordinates: [ 15.4644484, 47.0791163 ], type: 'Point' }}}]]})
    assert.equal(f.toString(), 'nwr["amenity"="restaurant"]->.x1;nwr.x1(around:100,47.0791163,15.4644484);')
    assert.equal(f.toQl(), 'nwr["amenity"="restaurant"]->.x2;nwr.x2(around:100,47.0791163,15.4644484);')
    assert.deepEqual(f.toLokijs(), { $and: [
      { 'tags.amenity': { $eq: 'restaurant' } }
    ], needMatch: true})

    check(f, [])

    var r = f.cacheDescriptors()
    assert.deepEqual(r, [ { id: 'nwr["amenity"="restaurant"](properties:17)', bounds:{"type":"Polygon","coordinates":[[[15.465769011510112,47.079116292410326],[15.46574364059531,47.079291741398514],[15.465668493825438,47.07946044852533],[15.465546458637188,47.07961593037691],[15.465382224499415,47.079752211732746],[15.465182102741352,47.0798640552115],[15.464953784026477,47.0799471625657],[15.46470604278992,47.07999833988624],[15.464448400000002,47.08001562036372],[15.464190757210083,47.07999833988624],[15.463943015973527,47.0799471625657],[15.463714697258652,47.0798640552115],[15.463514575500588,47.079752211732746],[15.463350341362815,47.07961593037691],[15.463228306174566,47.07946044852533],[15.463153159404694,47.079291741398514],[15.463127788489892,47.079116292410326],[15.463153167934774,47.07894084399987],[15.463228321936096,47.078772138518275],[15.463350361956252,47.078616659128976],[15.46351459779076,47.07848038067756],[15.463714717852085,47.07836854010326],[15.463943031735061,47.07828543521131],[15.464190765740163,47.07823425953603],[15.464448400000002,47.07821697963628],[15.46470603425984,47.07823425953603],[15.464953768264943,47.07828543521131],[15.46518208214792,47.07836854010326],[15.465382202209243,47.07848038067756],[15.465546438043752,47.078616659128976],[15.465668478063908,47.078772138518275],[15.46574363206523,47.07894084399987],[15.465769011510112,47.079116292410326]]]} } ])
  })


  it('merge two filters (around + tags)', function () {
    var f1 = new Filter('nwr(around:100,47.0791163,15.4644484)')
    var f2 = new Filter('nwr[amenity=restaurant]')
    var f = new Filter({and: [ f1, f2 ]})

    assert.deepEqual(f.def, {"and":[[{"fun":"around","value":{distance: 100, geometry: { coordinates: [ 15.4644484, 47.0791163 ], type: 'Point' }}}],[{"key":"amenity","op":"=","value":"restaurant"}]]})
    assert.equal(f.toString(), 'nwr(around:100,47.0791163,15.4644484)->.x1;nwr.x1["amenity"="restaurant"];')
    assert.equal(f.toQl(), 'nwr(around:100,47.0791163,15.4644484)->.x2;nwr.x2["amenity"="restaurant"];')
    assert.deepEqual(f.toLokijs(), { $and: [
      { 'tags.amenity': { $eq: 'restaurant' } },
    ], needMatch: true})

    check(f, [])

    var r = f.cacheDescriptors()
    assert.deepEqual(r, [ { id: 'nwr["amenity"="restaurant"](properties:17)', bounds:{"type":"Polygon","coordinates":[[[15.465769011510112,47.079116292410326],[15.46574364059531,47.079291741398514],[15.465668493825438,47.07946044852533],[15.465546458637188,47.07961593037691],[15.465382224499415,47.079752211732746],[15.465182102741352,47.0798640552115],[15.464953784026477,47.0799471625657],[15.46470604278992,47.07999833988624],[15.464448400000002,47.08001562036372],[15.464190757210083,47.07999833988624],[15.463943015973527,47.0799471625657],[15.463714697258652,47.0798640552115],[15.463514575500588,47.079752211732746],[15.463350341362815,47.07961593037691],[15.463228306174566,47.07946044852533],[15.463153159404694,47.079291741398514],[15.463127788489892,47.079116292410326],[15.463153167934774,47.07894084399987],[15.463228321936096,47.078772138518275],[15.463350361956252,47.078616659128976],[15.46351459779076,47.07848038067756],[15.463714717852085,47.07836854010326],[15.463943031735061,47.07828543521131],[15.464190765740163,47.07823425953603],[15.464448400000002,47.07821697963628],[15.46470603425984,47.07823425953603],[15.464953768264943,47.07828543521131],[15.46518208214792,47.07836854010326],[15.465382202209243,47.07848038067756],[15.465546438043752,47.078616659128976],[15.465668478063908,47.078772138518275],[15.46574363206523,47.07894084399987],[15.465769011510112,47.079116292410326]]]} } ])
  })


  it('merge two filters (around + around)', function () {
    var f1 = new Filter('nwr(around:100,47.0791263,15.4644484)')
    var f2 = new Filter('nwr(around:100,47.0791163,15.4644484)')
    var f = new Filter({and: [ f1, f2 ]})

    assert.deepEqual(f.def, {"and":[[{"fun":"around","value":{distance: 100, geometry: { coordinates: [ 15.4644484, 47.0791263 ], type: 'Point' }}}],[{"fun":"around","value":{distance: 100, geometry: { coordinates: [ 15.4644484, 47.0791163 ], type: 'Point' }}}]]})
    assert.equal(f.toString(), 'nwr(around:100,47.0791263,15.4644484)->.x1;nwr.x1(around:100,47.0791163,15.4644484);')
    assert.equal(f.toQl(), 'nwr(around:100,47.0791263,15.4644484)->.x2;nwr.x2(around:100,47.0791163,15.4644484);')
    assert.deepEqual(f.toLokijs(), { $and: [
    ], needMatch: true})

    check(f, [])

    var r = f.cacheDescriptors()
    assert.deepEqual(r, [ { id: 'nwr(properties:16)', bounds:{"type":"Polygon","coordinates":[[[15.463128511517017,47.07912129240258],[15.463153167691685,47.07895084399988],[15.463228321707113,47.07878213851828],[15.463350361750171,47.078626659128986],[15.463514597615507,47.07849038067757],[15.463714717714389,47.078378540103266],[15.463943031640214,47.07829543521132],[15.464190765691809,47.078244259536035],[15.464448400000002,47.07822697963628],[15.464706034308195,47.078244259536035],[15.46495376835979,47.07829543521132],[15.465182082285615,47.078378540103266],[15.465382202384497,47.07849038067757],[15.465546438249833,47.078626659128986],[15.46566847829289,47.07878213851828],[15.46574363230832,47.07895084399988],[15.465768288482987,47.07912129240258],[15.46574364059531,47.079291741398514],[15.465668493825438,47.07946044852533],[15.465546458637188,47.07961593037691],[15.465382224499415,47.079752211732746],[15.465182102741352,47.0798640552115],[15.464953784026477,47.0799471625657],[15.46470604278992,47.07999833988624],[15.464448400000002,47.08001562036372],[15.464190757210083,47.07999833988624],[15.463943015973527,47.0799471625657],[15.463714697258652,47.0798640552115],[15.463514575500588,47.079752211732746],[15.463350341362815,47.07961593037691],[15.463228306174566,47.07946044852533],[15.463153159404694,47.079291741398514],[15.463128511517017,47.07912129240258]]]} } ])
  })

  it('merge two filters (around + around -> invalid)', function () {
    var f1 = new Filter('nwr(around:100,48.0791263,15.4644484)')
    var f2 = new Filter('nwr(around:100,47.0791163,15.4644484)')
    var f = new Filter({and: [ f1, f2 ]})

    assert.deepEqual(f.def, {"and":[[{"fun":"around","value":{distance: 100, geometry: { coordinates: [ 15.4644484, 48.0791263 ], type: 'Point' }}}],[{"fun":"around","value":{distance: 100, geometry: { coordinates: [ 15.4644484, 47.0791163 ], type: 'Point' }}}]]})
    assert.equal(f.toString(), 'nwr(around:100,48.0791263,15.4644484)->.x1;nwr.x1(around:100,47.0791163,15.4644484);')
    assert.equal(f.toQl(), 'nwr(around:100,48.0791263,15.4644484)->.x2;nwr.x2(around:100,47.0791163,15.4644484);')
    assert.deepEqual(f.toLokijs(), { $and: [
    ], needMatch: true})

    check(f, [])

    var r = f.cacheDescriptors()
    assert.deepEqual(r, [ { id: 'nwr(properties:16)', invalid: true } ])
  })

})

describe('Function "bbox"', function () {
  it('simple', function () {
    var f = new Filter('node(10.2,40.0,11,45)')

    assert.deepEqual(f.def, [{"type":"node"},{"fun":"bbox","value":{"minlon":40,"minlat":10.2,"maxlon":45,"maxlat":11}}])
    assert.equal(f.toString(), 'node(10.2,40,11,45);')
    assert.equal(f.toQl(), 'node(10.2,40,11,45);')
    assert.deepEqual(f.toLokijs(), { type: { '$eq': 'node' }, needMatch: true })

    check(f, [])

    var r = f.cacheDescriptors()
    assert.deepEqual(r, [ { id:"node(properties:16)",bounds:{"type":"Polygon","coordinates":[[[40,10.2],[45,10.2],[45,11],[40,11],[40,10.2]]]} }])
  })
})
