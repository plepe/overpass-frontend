const assert = require('assert')
const Filter = require('../src/Filter')

const list = {
  'node[a];node._[b];': {
    str: 'node["b"]["a"];',
    loki: {"type":{"$eq":"node"},"tags.b":{"$exists":true},"tags.a":{"$exists":true}},
  },
  'way;node(w);': {
    str: 'way;node(w);',
    loki: {"type":{"$eq":"node"}},
  },
  'way[a];node(w)->.a;way[a];node.a(w);': {
    str: 'way["a"]->._1;way["a"];node(w)(w._1);',
    loki: {"type":{"$eq":"node"}},
  },
  '(node[a];node._[b];);': {
    str: '(node["a"];node["b"]["a"];);',
    loki: {"$or":[{"type":{"$eq":"node"},"tags.a":{"$exists":true}},{"type":{"$eq":"node"},"tags.b":{"$exists":true},"tags.a":{"$exists":true}}]},
  },
  '(node[a];);': {
    str: 'node["a"];',
    loki: {"type":{"$eq":"node"},"tags.a":{"$exists":true}},
  },
  '((node[a];););': {
    str: 'node["a"];',
    loki: {"type":{"$eq":"node"},"tags.a":{"$exists":true}},
  },
  //'((();node[a];););': {
  //  str: 'node["a"];', // TODO
  //  loki: {"type":{"$eq":"node"},"tags.a":{"$exists":true}},
  //},
  'relation[b];node(r)[b]->._a;node._a[a];': {
    str: 'relation["b"];node(r)["a"]["b"];',
    loki: {"type":{"$eq":"node"},"tags.a":{"$exists":true},"tags.b":{"$exists":true}},
  },
  'relation[b];node(r)[b]->._a;node._a[a];node._[c];': {
    str: 'relation["b"];node(r)["c"]["a"]["b"];',
    loki: {"type":{"$eq":"node"},"tags.c":{"$exists":true},"tags.a":{"$exists":true},"tags.b":{"$exists":true}},
  },
  '(way[c];way[d];)->._2;nwr._2[a];': {
    str: '(way["c"]["a"];way["d"]["a"];);',
    loki: {"$or":[{"type":{"$eq":"way"},"tags.c":{"$exists":true},"tags.a":{"$exists":true}},{"type":{"$eq":"way"},"tags.d":{"$exists":true},"tags.a":{"$exists":true}}]},
  },
  '(way[c];way[d];)->._2;nwr._2[a];nwr._[b];': {
    str: '(way["c"]["b"]["a"];way["d"]["b"]["a"];);',
    loki: {"$or":[{"type":{"$eq":"way"},"tags.c":{"$exists":true},"tags.b":{"$exists":true},"tags.a":{"$exists":true}},{"type":{"$eq":"way"},"tags.d":{"$exists":true},"tags.b":{"$exists":true},"tags.a":{"$exists":true}}]},
  },
  'relation->._a;(node(r._a)[a];way[b];);': {
    str: 'relation->._a;(node(r._a)["a"];way["b"];);',
    loki: {},
  },
  'nwr(48.195,16.335,48.2,16.345)->._base;nwr._base["cuisine"]->._base;(node._base["amenity"="restaurant"];way._base["amenity"="restaurant"];relation._base["amenity"="restaurant"];);nwr._(properties:13);': {
    str: '(node["amenity"="restaurant"]["cuisine"](48.195,16.335,48.2,16.345)(properties:13);way["amenity"="restaurant"]["cuisine"](48.195,16.335,48.2,16.345)(properties:13);relation["amenity"="restaurant"]["cuisine"](48.195,16.335,48.2,16.345)(properties:13););',
    loki: {"$or":[{"type":{"$eq":"node"},"tags.amenity":{"$eq":"restaurant"},"tags.cuisine":{"$exists":true},"$and":[{"minlat":{"$lte":48.2},"minlon":{"$lte":16.345},"maxlat":{"$gte":48.195},"maxlon":{"$gte":16.335}}]},{"type":{"$eq":"way"},"tags.amenity":{"$eq":"restaurant"},"tags.cuisine":{"$exists":true},"$and":[{"minlat":{"$lte":48.2},"minlon":{"$lte":16.345},"maxlat":{"$gte":48.195},"maxlon":{"$gte":16.335}}]},{"type":{"$eq":"relation"},"tags.amenity":{"$eq":"restaurant"},"tags.cuisine":{"$exists":true},"$and":[{"minlat":{"$lte":48.2},"minlon":{"$lte":16.345},"maxlat":{"$gte":48.195},"maxlon":{"$gte":16.335}}]}],"needMatch":true},
  },
  'nwr(48.1990347,16.3384616,48.1991437,16.3386118)->._1;(nwr._1[~"amenity"~"."]->._3;)->._2;nwr._2': {
    str: 'nwr[~"amenity"~"."](48.1990347,16.3384616,48.1991437,16.3386118)->._3;nwr._2;',
    loki: { '$and': [ { '$and': [ { maxlat: { '$gte': 48.1990347 }, maxlon: { '$gte': 16.3384616 }, minlat: { '$lte': 48.1991437 }, minlon: { '$lte': 16.3386118 } } ] } ], needMatch: true }
  }
}

describe('Filter.conflate()', function () {
  Object.entries(list).forEach(([input, expected]) => {
    it(input, function () {
      const filter = new Filter(input)
      filter.conflate()

      const actualStr = filter.toString()
      assert.equal(actualStr, expected.str)

      const actualLoki = filter.toLokijs()
      //console.log('loki:', JSON.stringify(actualLoki))
      assert.deepEqual(actualLoki, expected.loki)
    })
  })
})
