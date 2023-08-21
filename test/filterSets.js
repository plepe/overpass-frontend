var fs = require('fs')
var conf = JSON.parse(fs.readFileSync('test/conf.json', 'utf8'));

var assert = require('assert')
var async = require('async')

var OverpassFrontend = require('../src/OverpassFrontend')
const Filter = require('../src/Filter')
var BoundingBox = require('boundingbox')
var overpassFrontend

describe("Filter sets, compile", function () {
  it ('nwr[amenity]', function () {
    var f = new Filter('nwr[amenity]')

    assert.deepEqual(f.def, [[
      {"op":"has_key","key":"amenity"},
    ]])
    assert.equal(f.toString(), 'nwr["amenity"];')
    assert.equal(f.toQl(), 'nwr["amenity"];')
    assert.deepEqual(f.toQlParts(), {
      query: 'nwr["amenity"];'
    })
    assert.deepEqual(f.toLokijs(), {
      "tags.amenity": { $exists: true }
    })
    var r = f.cacheDescriptors()
    assert.deepEqual(r, [ { id: 'nwr["amenity"](properties:1)' }])
  })
  it ('nwr[amenity]->.a;', function () {
    var f = new Filter('nwr[amenity]->.a;')

    assert.deepEqual(f.def, [
      [
        {"op":"has_key","key":"amenity"},
        {"outputSet":"a"}
      ]
    ])
    assert.equal(f.toString(), 'nwr["amenity"]->.a;')
    assert.equal(f.toQl(), 'nwr["amenity"]->.a;')
    assert.deepEqual(f.toQlParts(), {
      query: null
    })
    assert.deepEqual(f.toQlParts({set: 'a'}), {
      query: 'nwr["amenity"]->.a;'
    })
    assert.deepEqual(f.toLokijs(), {
      $not: true
    })
    assert.deepEqual(f.toLokijs({set: 'a'}), {
      "tags.amenity": { $exists: true }
    })
    var r = f.cacheDescriptors()
    assert.deepEqual(r, [ ])
    r = f.cacheDescriptors({ set: 'a' })
    assert.deepEqual(r, [ { id: 'nwr["amenity"](properties:1)' }])
  })
  it ('(nwr[amenity];)->.a;', function () {
    var f = new Filter('(nwr[amenity];)->.a;')

    assert.deepEqual(f.def, [{
      or: [
        [ {"op":"has_key","key":"amenity"} ],
        {"outputSet":"a"}
      ]
    }])
    assert.equal(f.toString(), '((nwr["amenity"];);)->.a;')
    assert.equal(f.toQl(), '((nwr["amenity"];);)->.a;')
    assert.deepEqual(f.toQlParts(), {
      query: 'nwr["amenity"];'
    })
    assert.deepEqual(f.toLokijs(), {
      "tags.amenity": { $exists: true }
    })
    var r = f.cacheDescriptors()
    assert.deepEqual(r, [ { id: 'nwr["amenity"](properties:1)' } ])
  })
  it ('(nwr[amenity]->.a;);', function () {
    var f = new Filter('(nwr[amenity]->.a;);')

    assert.deepEqual(f.def, [{
      or: [
        [ {"op":"has_key","key":"amenity"},
          {"outputSet":"a"}
        ]
      ]
    }])
    assert.equal(f.toString(), '(nwr["amenity"]->.a;);')
    assert.equal(f.toQl(), '(nwr["amenity"]->.a;);')
    assert.deepEqual(f.toQlParts(), {
      query: '(nwr["amenity"]->.a;);'
    })
    assert.deepEqual(f.toLokijs(), {
      $or: [{
        "tags.amenity": { $exists: true }
      }]
    })
    var r = f.cacheDescriptors()
    assert.deepEqual(r, [ { id: 'nwr["amenity"](properties:1)' } ])
  })
  it ('(nwr[amenity](1,1,2,2)->.a;);', function () {
    var f = new Filter('(nwr[amenity](1,1,2,2)->.a;);')

    assert.deepEqual(f.def, [{
      or: [
        [ {"op":"has_key","key":"amenity"},
          {"fun":"bbox","value":{minlat:1,minlon:1,maxlat:2,maxlon:2}},
          {"outputSet":"a"}
        ]
      ]
    }])
    assert.equal(f.toString(), '(nwr["amenity"](1,1,2,2)->.a;);')
    assert.equal(f.toQl(), '(nwr["amenity"](1,1,2,2)->.a;);')
    assert.deepEqual(f.toQlParts(), {
      query: '(nwr["amenity"](1,1,2,2)->.a;);'
    })
    assert.deepEqual(f.toLokijs(), {
      $or: [{
        "tags.amenity": { $exists: true }
      }],
      needMatch: true
    })
    var r = f.cacheDescriptors()
    assert.deepEqual(r, [ { id: 'nwr["amenity"](properties:17)', bounds: { type: 'Polygon', coordinates: [[[1,1],[2,1],[2,2],[1,2],[1,1]]] } } ])
  })
  it ('nwr[amenity](1,1,2,2)->.a;node._[cuisine];', function () {
    var f = new Filter('(nwr[amenity](1,1,2,2)->.a;);node._[cuisine];')

    assert.deepEqual(f.def, [{
      or: [
        [ {"op":"has_key","key":"amenity"},
          {"fun":"bbox","value":{minlat:1,minlon:1,maxlat:2,maxlon:2}},
          {"outputSet":"a"}
        ]
      ]
    },
    [
      {type:'node'},
      {inputSet:'_'},
      {"op":"has_key","key":"cuisine"}
    ]
    ])
    assert.equal(f.toString(), '(nwr["amenity"](1,1,2,2)->.a;);node._["cuisine"];')
    assert.equal(f.toQl(), '(nwr["amenity"](1,1,2,2)->.a;);node._["cuisine"];')
    assert.deepEqual(f.toQlParts(), {
      query: '(nwr["amenity"](1,1,2,2)->.a;);node._["cuisine"];',
    })
    assert.deepEqual(f.toLokijs(), {
      needMatch: true,
      $and: [{
        $or: [{
          "tags.amenity": { $exists: true },
          }]
        },
        {
          "tags.cuisine": { $exists: true },
          type: { $eq: 'node' }
        },
      ]
    })
    var r = f.cacheDescriptors()
    assert.deepEqual(r, [ { id: 'node["amenity"]["cuisine"](properties:17)', bounds: { type: 'Polygon', coordinates: [[[1,1],[2,1],[2,2],[1,2],[1,1]]] } } ])
  })
  it ('nwr[amenity]->.a;nwr.a[cuisine];', function () {
    var f = new Filter('nwr[amenity]->.a;nwr.a[cuisine];')

    assert.deepEqual(f.def, [
      [
        {"op":"has_key","key":"amenity"},
        {"outputSet":"a"}
      ],
      [
        {"inputSet":"a"},
        {"op":"has_key","key":"cuisine"}
      ]
    ])
    assert.equal(f.toString(), 'nwr["amenity"]->.a;nwr.a["cuisine"];')
    assert.equal(f.toQl(), 'nwr["amenity"]->.a;nwr.a["cuisine"];')
    assert.deepEqual(f.toQlParts(), {
      query: 'nwr["amenity"]->.a;nwr.a["cuisine"];'
    })
    assert.deepEqual(f.toLokijs(), {
      $and: [
        {"tags.amenity": {$exists: true}},
        {"tags.cuisine": {$exists: true}}
      ]
    })
    assert.deepEqual(f.toLokijs({set: 'a'}), {
      "tags.amenity": {$exists: true}
    })
    var r = f.cacheDescriptors()
    assert.deepEqual(r, [ { id: 'nwr["amenity"]["cuisine"](properties:1)' }])
    var r = f.cacheDescriptors({set: 'a'})
    assert.deepEqual(r, [ { id: 'nwr["amenity"](properties:1)' }])
  })
  it ('(nwr[a]->a;(nwr[b]->b;nwr.a[b]););', function () {
    var f = new Filter('(nwr[a]->.a;(nwr[b]->.b;nwr.a[b];););')

    assert.deepEqual(f.def, [{
      or: [
        [ {"op":"has_key","key":"a"}, {"outputSet":"a"} ],
        { or: [
          [ {"op":"has_key","key":"b"}, {"outputSet":"b"} ],
          [ { inputSet: "a" }, {"op":"has_key","key":"b"} ],
        ]}
      ]
    }])
    assert.equal(f.toString(), '(nwr["a"]->.a;(nwr["b"]->.b;nwr.a["b"];););')
    assert.equal(f.toQl(), '(nwr["a"]->.a;(nwr["b"]->.b;nwr.a["b"];););')
    assert.deepEqual(f.toQlParts(), {
      query: '(nwr["a"]->.a;(nwr["b"]->.b;nwr.a["b"];););'
    })
    assert.deepEqual(f.toLokijs(), {
      $or: [
        { 'tags.a': { '$exists': true } },
        { '$or': [
            { 'tags.b': { '$exists': true } },
            { '$and': [
                { 'tags.a': { '$exists': true } },
                { 'tags.b': { '$exists': true } }
            ]}
          ]}
        ]
    })
    var r = f.cacheDescriptors()
    assert.deepEqual(r, [
      { id: 'nwr["a"](properties:1)' },
      { id: 'nwr["b"](properties:1)' },
      { id: 'nwr["a"]["b"](properties:1)' }
    ])
  })
  it ('(nwr[a]->.a;(nwr[b]->.b;nwr.a[b]);)->.a;', function () {
    var f = new Filter('(nwr[a]->.a;(nwr[b]->.b;nwr.a[b];);)->.a;')

    assert.deepEqual(f.def, [{
      or: [
        [ {"op":"has_key","key":"a"}, {"outputSet":"a"} ],
        { or: [
          [ {"op":"has_key","key":"b"}, {"outputSet":"b"} ],
          [ { inputSet: "a" }, {"op":"has_key","key":"b"} ],
        ]},
        {"outputSet":"a"}
      ]
    }])
    assert.equal(f.toString(), '((nwr["a"]->.a;(nwr["b"]->.b;nwr.a["b"];););)->.a;')
    assert.equal(f.toQl(), '((nwr["a"]->.a;(nwr["b"]->.b;nwr.a["b"];););)->.a;')
    assert.deepEqual(f.toQlParts(), {
      query: '(nwr["b"]->.b;nwr.a["b"];);'
    })
    assert.deepEqual(f.toQlParts({set: 'a'}), {
      query: '((nwr["a"]->.a;(nwr["b"]->.b;nwr.a["b"];););)->.a;'
    })
    assert.deepEqual(f.toQlParts({set: 'b'}), {
      query: 'nwr["b"]->.b;'
    })
    assert.deepEqual(f.toLokijs(), {
      $or: [
        { 'tags.b': { '$exists': true } },
        { '$and': [
            { 'tags.a': { '$exists': true } },
            { 'tags.b': { '$exists': true } }
          ]}
        ]
    })
    var r = f.cacheDescriptors()
    assert.deepEqual(r, [
      { id: 'nwr["b"](properties:1)' },
      { id: 'nwr["a"]["b"](properties:1)' }
    ])
  })
  it ('nwr.a[amenity];', function () {
    var f = new Filter('nwr.a[amenity];')

    assert.deepEqual(f.def, [
      [
        {"inputSet":"a"},
        {"op":"has_key","key":"amenity"}
      ]
    ])
    assert.equal(f.toString(), 'nwr.a["amenity"];')
    assert.equal(f.toQl(), 'nwr.a["amenity"];')
    assert.deepEqual(f.toQlParts(), {
      query: null
    })
    assert.deepEqual(f.toLokijs(), {
      $and: [
        {$not: true},
        {'tags.amenity': {$exists: true}}
      ]
    })
    var r = f.cacheDescriptors()
    assert.deepEqual(r, [])
  })
  it ('nwr.a.b[amenity]', function () {
    var f = new Filter('nwr.a.b[amenity]')

    assert.deepEqual(f.def, [
      [
        {"inputSet":"a"},
        {"inputSet":"b"},
        {"op":"has_key","key":"amenity"}
      ]
    ])
    assert.equal(f.toString(), 'nwr.a.b["amenity"];')
    assert.equal(f.toQl(), 'nwr.a.b["amenity"];')
    assert.deepEqual(f.toQlParts(), {
      query: null
    })
    assert.deepEqual(f.toLokijs(), {
      $and: [
        {$not: true},
        {$not: true},
        {'tags.amenity': {$exists: true}}
      ]
    })
    var r = f.cacheDescriptors()
    assert.deepEqual(r, [])
  })
  it ('nwr[amenity]->.a;nwr[xxx]->.b;nwr.a.b[cuisine];', function () {
    var f = new Filter('nwr[amenity]->.a;nwr[xxx]->.b;nwr.a.b[cuisine];')

    assert.deepEqual(f.def, [
      [
        {"op":"has_key","key":"amenity"},
        {"outputSet":"a"}
      ],
      [
        {"op":"has_key","key":"xxx"},
        {"outputSet":"b"}
      ],
      [
        {"inputSet":"a"},
        {"inputSet":"b"},
        {"op":"has_key","key":"cuisine"}
      ]
    ])
    assert.equal(f.toString(), 'nwr["amenity"]->.a;nwr["xxx"]->.b;nwr.a.b["cuisine"];')
    assert.equal(f.toQl(), 'nwr["amenity"]->.a;nwr["xxx"]->.b;nwr.a.b["cuisine"];')
    assert.deepEqual(f.toQlParts(), {
      query: 'nwr["amenity"]->.a;nwr["xxx"]->.b;nwr.a.b["cuisine"];'
    })
    assert.deepEqual(f.toLokijs(), {
      $and: [
        {'tags.amenity': {$exists: true}},
        {'tags.xxx': {$exists: true}},
        {'tags.cuisine': {$exists: true}}
      ]
    })
    var r = f.cacheDescriptors()
    assert.deepEqual(r, [ { id: 'nwr["amenity"]["xxx"]["cuisine"](properties:1)' }])
  })
}) 

describe("Filter sets with relations, compile", function () {
  it ('nwr[amenity];>', function () {
    var f = new Filter('nwr[amenity];>')

    assert.deepEqual(f.def, [
      [
        {"op":"has_key","key":"amenity"}
      ],
      {"recurse":">"}
    ])
    assert.equal(f.toString(), 'nwr["amenity"];>;')
    assert.equal(f.toQl(), 'nwr["amenity"];>;')
    assert.deepEqual(f.toQlParts(), {
      query: '>;',
      recurse: [{
        inputSet: '_',
        query: 'nwr["amenity"];',
        recurse: '>'
      }]
    })
    assert.deepEqual(f.toLokijs(), {
      recurse: [{
        recurse: '>',
        inputSet: '_',
        query: 'nwr["amenity"];'
      }]
    })
    //var r = f.cacheDescriptors()
    //assert.deepEqual(r, [ { id: 'nwr["amenity"](properties:5)' }])
  })
  it ('nwr[amenity];>;', function () {
    var f = new Filter('nwr[amenity];>;')

    assert.deepEqual(f.def, [
      [
        {"op":"has_key","key":"amenity"}
      ],
      {"recurse":">"}
    ])
    assert.equal(f.toString(), 'nwr["amenity"];>;')
    assert.equal(f.toQl(), 'nwr["amenity"];>;')
    assert.deepEqual(f.toQlParts(), {
      query: '>;',
      recurse: [{
        inputSet: '_',
        query: 'nwr["amenity"];',
        recurse: '>'
      }]
    })
    assert.deepEqual(f.toLokijs(), {
      recurse: [{
        recurse: '>',
        inputSet: '_',
        query: 'nwr["amenity"];'
      }]
    })
    //var r = f.cacheDescriptors()
    //assert.deepEqual(r, [ { id: 'nwr["amenity"](properties:5)' }])
  })
  it ('nwr[amenity]->.a;.a > ->.b', function () {
    var f = new Filter('nwr[amenity]->.a;.a > ->.b')

    assert.deepEqual(f.def, [
      [
        {"op":"has_key","key":"amenity"},
        {"outputSet": "a"}
      ],
      {"recurse":">","inputSet": "a", "outputSet": "b"}
    ])
    assert.equal(f.toString(), 'nwr["amenity"]->.a;.a > ->.b;')
    assert.equal(f.toQl(), 'nwr["amenity"]->.a;.a > ->.b;')
    assert.deepEqual(f.toQlParts(), {
      query: null
    })
    assert.deepEqual(f.toQlParts({ set: 'a' }), {
      query: 'nwr["amenity"]->.a;'
    })
    assert.deepEqual(f.toQlParts({ set: 'b' }), {
      query: '.a > ->.b;',
      recurse: [{
        inputSet: 'a',
        query: 'nwr["amenity"]->.a;',
        recurse: '>'
      }]
    })
    assert.deepEqual(f.toLokijs(), {
      $not: true
    })
    assert.deepEqual(f.toLokijs({set: 'a'}), {
      "tags.amenity": { $exists: true }
    })
    assert.deepEqual(f.toLokijs({set: 'b'}), {
      recurse: [{
        recurse: '>',
        inputSet: 'a',
        query: 'nwr["amenity"]->.a;'
      }]
    })
    var r = f.cacheDescriptors()
    assert.deepEqual(r, [ ])
  })
  it ('nwr[amenity];node(w);', function () {
    var f = new Filter('nwr[amenity];node(w);')

    assert.deepEqual(f.def, [
      [
        {"op":"has_key","key":"amenity"}
      ],
      [
        {"type": "node"},
        {"recurse":"w", "inputSet":"_"}
      ]
    ])
    assert.equal(f.toString(), 'nwr["amenity"];node(w);')
    assert.equal(f.toQl(), 'nwr["amenity"];node(w);')
    assert.deepEqual(f.toQlParts(), {
      query: 'node(w);',
      recurse: [{
        inputSet: '_',
        query: 'nwr["amenity"];',
        recurse: 'w'
      }]
    })
    assert.deepEqual(f.toLokijs(), {
      recurse: [{
        recurse: 'w',
        query: 'nwr["amenity"];',
        inputSet: '_'
      }],
      type: { $eq: 'node' }
    })
    //var r = f.cacheDescriptors()
    //assert.deepEqual(r, [ { id: 'nwr["amenity"](properties:5)' }])
  })
  it ('way[highway];node(w);node._[highway];', function () {
    var f = new Filter('way[highway];node(w);node._[highway];')

    assert.deepEqual(f.def, [
      [
        {"type":"way"},
        {"op":"has_key","key":"highway"}
      ],
      [
        {"type": "node"},
        {"recurse":"w","inputSet":"_"},
      ],
      [
        {"type": "node"},
        {"inputSet":"_"},
        {"op":"has_key","key":"highway"}
      ]
    ])
    assert.equal(f.toString(), 'way["highway"];node(w);node._["highway"];')
    assert.equal(f.toQl(), 'way["highway"];node(w);node._["highway"];')
    assert.deepEqual(f.toQlParts(), {
      recurse: [{
        inputSet: '_',
        query: 'way["highway"];',
        recurse: 'w'
      }],
      query: 'node(w);node._["highway"];'
    })
    assert.deepEqual(f.toLokijs(), {
      recurse: [{
        recurse: 'w',
        query: 'way["highway"];',
        inputSet: '_'
      }],
      $and: [
        {type: { $eq: 'node' }},
        {
          "tags.highway": { $exists: true },
          "type": { $eq: 'node' },
        }
      ]
    })
    //var r = f.cacheDescriptors()
    //assert.deepEqual(r, [ { id: 'nwr["amenity"](properties:5)' }])
  })
  it ('way["highway"];node(w)->.a;way["railway"];node.a(w);', function () {
    var f = new Filter('way["highway"];node(w)->.a;way["railway"];node.a(w);')

    assert.deepEqual(f.def, [
      [
        {"type":"way"},
        {"op":"has_key","key":"highway"}
      ],
      [
        {"type": "node"},
        {"recurse":"w","inputSet":"_"},
        {"outputSet":"a"}
      ],
      [
        {"type": "way"},
        {"op":"has_key","key":"railway"}
      ],
      [
        {"type": "node"},
        {"inputSet":"a"},
        {"recurse":"w", "inputSet":"_"}
      ]
    ])
    assert.equal(f.toString(), 'way["highway"];node(w)->.a;way["railway"];node.a(w);')
    assert.equal(f.toQl(), 'way["highway"];node(w)->.a;way["railway"];node.a(w);')
    assert.deepEqual(f.toQlParts(), {
      query: 'node(w)->.a;node.a(w);',
      recurse: [
        {
          inputSet: '_',
          query: 'way["railway"];',
          recurse: 'w'
        },
        {
          inputSet: '_',
          query: 'way["highway"];',
          recurse: 'w'
        }
      ]
    })
    assert.deepEqual(f.toLokijs(), {
      recurse: [{
        recurse: 'w',
        query: 'way["railway"];',
        inputSet: '_'
      }, {
        recurse: 'w',
        query: 'way["highway"];',
        inputSet: '_'
      }],
      $and: [
        {type: { $eq: 'node' }},
        {type: { $eq: 'node' }}
      ]
    })
    //var r = f.cacheDescriptors()
    //assert.deepEqual(r, [ { id: 'nwr["amenity"](properties:5)' }])
  })
  it ('way[highway]->.a;way[railway]->.b;node(w.a)(w.b);', function () {
    var f = new Filter('way[highway]->.a;way[railway]->.b;node(w.a)(w.b);')

    assert.deepEqual(f.def, [
      [
        {"type":"way"},
        {"op":"has_key","key":"highway"},
        {"outputSet":"a"}
      ],
      [
        {"type":"way"},
        {"op":"has_key","key":"railway"},
        {"outputSet":"b"}
      ],
      [
        {"type": "node"},
        {"recurse":"w","inputSet":"a"},
        {"recurse":"w","inputSet":"b"}
      ]
    ])
    assert.equal(f.toString(), 'way["highway"]->.a;way["railway"]->.b;node(w.a)(w.b);')
    assert.equal(f.toQl(), 'way["highway"]->.a;way["railway"]->.b;node(w.a)(w.b);')
    assert.deepEqual(f.toQlParts(), {
      query: 'node(w.a)(w.b);',
      recurse: [
        {
          inputSet: 'a',
          query: 'way["highway"]->.a;',
          recurse: 'w'
        },
        {
          inputSet: 'b',
          query: 'way["railway"]->.b;',
          recurse: 'w'
        }
      ]
    })
    assert.deepEqual(f.toLokijs(), {
      recurse: [{
        recurse: 'w',
        query: 'way["highway"]->.a;',
        inputSet: 'a'
      }, {
        recurse: 'w',
        query: 'way["railway"]->.b;',
        inputSet: 'b'
      }],
      type: { $eq: 'node' }
    })
    //var r = f.cacheDescriptors()
    //assert.deepEqual(r, [ { id: 'nwr["amenity"](properties:5)' }])
  })
})

describe("Filter sets with relations, apply base filter", function () {
  it ('nwr[amenity]; - additional filter: nwr(46,16,47,17)', function () {
    var f = new Filter('nwr[amenity]')
    f.setBaseFilter('nwr(46,16,47,17)')

    assert.deepEqual(f.def, [
      [
        {"op":"has_key","key":"amenity"}
      ]
    ])
    assert.equal(f.toString(), 'nwr(46,16,47,17)->._base;nwr._base["amenity"];')
    assert.equal(f.toQl(), 'nwr(46,16,47,17)->._base;nwr._base["amenity"];')
    assert.deepEqual(f.toQlParts(), {
      // TODO: '->._base' missing
      query: 'nwr(46,16,47,17);nwr._base["amenity"];'
    })
    assert.deepEqual(f.toLokijs(), {
      $and: [{
        "tags.amenity": { $exists: true },
      }],
      needMatch: true
    })
    var r = f.cacheDescriptors()
    assert.deepEqual(r, [
      { id: 'nwr["amenity"](properties:17)', bounds: { type: 'Polygon', coordinates: [[[16,46],[17,46],[17,47],[16,47],[16,46]]] } }
    ])
  })
  it ('(nwr[a];nwr[b];);>; - additional filter: nwr(46,16,47,17)', function () {
    var f = new Filter('(nwr[a];nwr[b];);>;')
    f.setBaseFilter('nwr(46,16,47,17)')

    assert.deepEqual(f.def, [
      {
        or: [
          [ {"op":"has_key","key":"a"} ],
          [ {"op":"has_key","key":"b"} ],
        ]
      },
      {"recurse":">"}
    ])
    assert.equal(f.toString(), 'nwr(46,16,47,17)->._base;(nwr._base["a"];nwr._base["b"];);>;')
    assert.equal(f.toQl(), 'nwr(46,16,47,17)->._base;(nwr._base["a"];nwr._base["b"];);>;')
    assert.deepEqual(f.toQlParts(), {
      query: '>;',
      recurse: [{
        inputSet: '_',
        // TODO: query: 'nwr(46,16,47,17)->._base;(nwr._base["a"];nwr._base["b"];);',
        query: '(nwr._base["a"];nwr._base["b"];);',
        recurse: '>'
      }]
    })
    assert.deepEqual(f.toLokijs(), {
      "recurse": [{
        "inputSet": "_",
        "recurse": ">",
        "query": '(nwr._base["a"];nwr._base["b"];);'
      }]
    })
    var r = f.cacheDescriptors()
    assert.deepEqual(r, [
      { id: 'nwr["a"];>;(properties:21)', bounds: { type: 'Polygon', coordinates: [[[16,46],[17,46],[17,47],[16,47],[16,46]]] } },
      { id: 'nwr["b"];>;(properties:21)', bounds: { type: 'Polygon', coordinates: [[[16,46],[17,46],[17,47],[16,47],[16,46]]] } }
    ])
  })
})

;[/*'via-server',*/ 'via-file'].forEach(mode => {
  describe('Test filter sets ' + mode, function () {
    describe('initalize', function () {
      if (mode === 'via-server') {
        it('load', function () {
          overpassFrontend = new OverpassFrontend(conf.url)
        })
      } else {
        it('load', function (done) {
          this.timeout(20000)
          overpassFrontend = new OverpassFrontend('test/data.osm.bz2')
          overpassFrontend.once('load', () => done())
        })
      }

      it('recurse down', function (done) {
        test({
          mode,
          query: 'way["highway"="secondary"];>;',
          bounds: {
            minlat: 48.19821,
            minlon: 16.33835,
            maxlat: 48.19827,
            maxlon: 16.33841
          },
          expected: [ 'n378459', 'n3037431688', 'n3037431653', 'n2208875391', 'n270328331', 'n2213568001', 'n378462' ],
          expectedSubRequestCount: 0,
          expectedCacheDescriptors: [{
            "id": 'way["highway"="secondary"];>;(properties:5)',
          }]
        }, done)
      })
      it('nodes of way', function (done) {
        test({
          mode,
          query: 'way["highway"];node(w);',
          bounds: {
            minlat: 48.19821,
            minlon: 16.33833,
            maxlat: 48.19830,
            maxlon: 16.33854
          },
          expected: [ "n2208875391", "n2213567988", "n2213567992", "n2213567995", "n2213567996", "n2213568000", "n2213568003", "n270328331" , "n3037431653", "n3037431688", "n378459", "n378462", "n683894778" ],
          expectedSubRequestCount: 0,
//          expectedCacheDescriptors: [{
//            "id": 'way["highway"="secondary"];>;(properties:5)',
//          }]
        }, done)
      })
      it('nodes of way, chain query', function (done) {
        test({
          mode,
          query: 'way["highway"];node(w);node._["highway"];',
          bounds: {
            minlat: 48.19821,
            minlon: 16.33833,
            maxlat: 48.19830,
            maxlon: 16.33854
          },
          expected: [ "n378459", "n378462" ],
          expectedSubRequestCount: 0,
//          expectedCacheDescriptors: [{
//            "id": 'way["highway"="secondary"];>;(properties:5)',
//          }]
        }, done)
      })
      it('nodes of highway and railway ways', function (done) {
        test({
          mode,
          query: 'way["highway"]->.a;way["railway"]->.b;node(w.a)(w.b);',
          bounds: {
            minlat: 48.19821,
            minlon: 16.33833,
            maxlat: 48.19830,
            maxlon: 16.33854
          },
          expected: [ 'n2208875391', 'n270328331', 'n2213568001' ],
          expectedSubRequestCount: 0,
//          expectedCacheDescriptors: [{
//            "id": 'way["highway"="secondary"];>;(properties:5)',
//          }]
        }, done)
      })
      it('nodes of highway and railway ways 2', function (done) {
        test({
          mode,
          query: 'way["highway"];node(w)->.a;way["railway"];node.a(w);',
          bounds: {
            minlat: 48.19821,
            minlon: 16.33833,
            maxlat: 48.19830,
            maxlon: 16.33854
          },
          expected: [ 'n2208875391', 'n270328331', 'n2213568001' ],
          expectedSubRequestCount: 0,
//          expectedCacheDescriptors: [{
//            "id": 'way["highway"="secondary"];>;(properties:5)',
//          }]
        }, done)
      })
      it('recurse up', function (done) {
        test({
          mode,
          query: 'node["highway"];<;',
          bounds: {
            minlat: 48.19839,
            minlon: 16.33901,
            maxlat: 48.19840,
            maxlon: 16.33902
          },
          expected: [ 'r3636229', 'w146678747', 'w170141442', 'w366446524' ],
          expectedSubRequestCount: 0,
//          expectedCacheDescriptors: [{
//            "id": 'way["highway"="secondary"];>;(properties:5)',
//          }]
        }, done)
      })
      it('recurse up, relation only', function (done) {
        test({
          mode,
          query: 'node["highway"];<;relation._;',
          bounds: {
            minlat: 48.19839,
            minlon: 16.33901,
            maxlat: 48.19840,
            maxlon: 16.33902
          },
          expected: [ 'r3636229' ],
          expectedSubRequestCount: 0,
//          expectedCacheDescriptors: [{
//            "id": 'way["highway"="secondary"];>;(properties:5)',
//          }]
        }, done)
      })
    })
  })
})

function test (options, callback) {
  const found = []
  let foundSubRequestCount = 0

  function compileListener (subrequest) {
    foundSubRequestCount++
  }

  const request = overpassFrontend.BBoxQuery(
    options.query,
    options.bounds,
    options.queryOptions || {},
    (err, ob) => {
      found.push(ob.id)
    },
    (err) => {
      if (err) {
        if (options.expectException) {
          assert.equal(err.message, options.expectException)
          return callback()
        }

        return callback(err)
      }

      assert.equal(request.filterQuery.toString(), options.expectedQuery || options.query)
      const expected = (options.mode === 'via-server' ? options.expectedViaServer : options.expectedViaFile) || options.expected
      assert.deepEqual(found.sort(), expected.sort(), 'List of found objects wrong!')
      if (options.mode === 'via-server') {
        assert.equal(foundSubRequestCount, options.expectedSubRequestCount, 'Wrong count of sub requests!')
      }

      request.off('subrequest-compile', compileListener)
      callback()
    }
  )

  request.on('subrequest-compile', compileListener)

  if (request.filterQuery) {
    const cacheDescriptors = request.filterQuery.cacheDescriptors()
    if (options.expectedCacheDescriptors) {
      assert.deepEqual(cacheDescriptors, options.expectedCacheDescriptors, 'Expected cache info')
    }
    if ('expectedProperties' in options) {
      assert.equal(request.filterQuery.properties(), options.expectedProperties)
    }
  }

  return request
}
