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
    assert.equal(f.toQl({ setsUseStatementIds: true }), 'nwr["amenity"]->._1;')
    assert.equal(f.toQuery(), 'nwr["amenity"]->._1;')
    assert.deepEqual(f.recurse(), [])
    assert.deepEqual(f.getScript(), [
      { id: 1, recurse: [] }
    ])

    assert.deepEqual(f.compileQuery(), {
      query: 'nwr["amenity"];',
      loki: {
        "tags.amenity": { $exists: true }
      }
    })
    assert.deepEqual(f.toLokijs(), {
      "tags.amenity": { $exists: true }
    })
    assert.deepEqual(f.derefSets(), [
      { type: 'nwr', filters: [ { key: 'amenity', op: 'has_key' } ] }
    ])
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
    assert.equal(f.toQl({ setsUseStatementIds: true }), 'nwr["amenity"]->._1;')
    assert.equal(f.toQuery(), null)
    assert.equal(f.toQuery({ set: 'a' }), 'nwr["amenity"]->._1;')
    assert.deepEqual(f.getScript(), [])
    assert.deepEqual(f.getScript({ set: 'a' }), [
      { id: 1, recurse: [] }
    ])
    assert.deepEqual(f.recurse(), [])
    assert.deepEqual(f.recurse({ set: 'a' }), [])
    assert.deepEqual(f.compileQuery(), {
      query: null
    })
    assert.deepEqual(f.compileQuery({set: 'a'}), {
      query: 'nwr["amenity"]->.a;',
      loki: {
        "tags.amenity": { $exists: true }
      }
    })
    assert.deepEqual(f.toLokijs(), {
      $not: true
    })
    assert.deepEqual(f.derefSets(), [
    ])
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
    assert.equal(f.toString(), '(nwr["amenity"];)->.a;')
    assert.equal(f.toQl(), '(nwr["amenity"];)->.a;')
    assert.equal(f.toQl({ setsUseStatementIds: true }), '(nwr["amenity"]->._2;)->._1;')
    assert.equal(f.toQuery(), 'nwr["amenity"]->._2;')
    assert.equal(f.toQuery({ set: 'a' }), '(nwr["amenity"]->._2;)->._1;')
    assert.deepEqual(f.recurse(), [])
    assert.deepEqual(f.recurse({ set: 'a' }), [])
    assert.deepEqual(f.getScript(), [
      { id: 2, recurse: [] }
    ])
    assert.deepEqual(f.getScript({ set: 'a' }), [
      { id: 1, recurse: [] }
    ])
    assert.deepEqual(f.compileQuery(), {
      query: 'nwr["amenity"];',
      loki: {
        "tags.amenity": { $exists: true }
      }
    })
    assert.deepEqual(f.derefSets(), [
      { type: 'nwr', filters: [ { key: 'amenity', op: 'has_key' } ] }
    ])
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
    assert.equal(f.toQl({ setsUseStatementIds: true }), '(nwr["amenity"]->._2;)->._1;')
    assert.equal(f.toQuery(), '(nwr["amenity"]->._2;)->._1;')
    assert.equal(f.toQuery({ set: 'a' }), 'nwr["amenity"]->._2;')
    assert.deepEqual(f.recurse(), [])
    assert.deepEqual(f.recurse({ set: 'a' }), [])
    assert.deepEqual(f.getScript(), [
      { id: 1, recurse: [] }
    ])
    assert.deepEqual(f.getScript({ set: 'a' }), [
      { id: 2, recurse: [] }
    ])
    assert.deepEqual(f.compileQuery(), {
      query: '(nwr["amenity"]->.a;);',
      loki: {
        $or: [{
          "tags.amenity": { $exists: true }
        }]
      }
    })
    assert.deepEqual(f.derefSets(), [
      { type: 'nwr', filters: [ { key: 'amenity', op: 'has_key' } ] }
    ])
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
    assert.equal(f.toQl({ setsUseStatementIds: true }), '(nwr["amenity"](1,1,2,2)->._2;)->._1;')
    assert.equal(f.toQuery(), '(nwr["amenity"](1,1,2,2)->._2;)->._1;')
    assert.equal(f.toQuery({ set: 'a' }), 'nwr["amenity"](1,1,2,2)->._2;')
    assert.deepEqual(f.recurse(), [])
    assert.deepEqual(f.recurse({ set: 'a' }), [])
    assert.deepEqual(f.getScript(), [
      { id: 1, recurse: [] }
    ])
    assert.deepEqual(f.getScript({ set: 'a' }), [
      { id: 2, recurse: [] }
    ])
    assert.deepEqual(f.compileQuery(), {
      query: '(nwr["amenity"](1,1,2,2)->.a;);',
      loki: {
        $or: [{
          "tags.amenity": { $exists: true }
        }],
        needMatch: true
      }
    })
    assert.deepEqual(f.derefSets(), [
      { type: 'nwr', filters: [ { key: 'amenity', op: 'has_key' }, { fun: 'bbox', value: { minlat: 1, minlon: 1, maxlat: 2, maxlon: 2 } } ] }
    ])
    assert.deepEqual(f.toLokijs(), {
      $or: [{
        "tags.amenity": { $exists: true }
      }],
      needMatch: true
    })
    var r = f.cacheDescriptors()
    assert.deepEqual(r, [ { id: 'nwr["amenity"](properties:17)', bounds: { type: 'Polygon', coordinates: [[[1,1],[2,1],[2,2],[1,2],[1,1]]] } } ])
  })
  it ('(nwr[amenity](1,1,2,2)->.a;);node._[cuisine];', function () {
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
    assert.equal(f.toQl({ setsUseStatementIds: true }), '(nwr["amenity"](1,1,2,2)->._2;)->._1;node._1["cuisine"]->._3;')
    assert.equal(f.toQuery(), '(nwr["amenity"](1,1,2,2)->._2;)->._1;node._1["cuisine"]->._3;')
    assert.equal(f.toQuery({ set: 'a' }), 'nwr["amenity"](1,1,2,2)->._2;')
    assert.deepEqual(f.recurse(), [])
    assert.deepEqual(f.recurse({ set: 'a' }), [])
    assert.deepEqual(f.getScript(), [
      { id: 3, recurse: [] }
    ])
    assert.deepEqual(f.getScript({ set: 'a' }), [
      { id: 2, recurse: [] }
    ])
    assert.deepEqual(f.compileQuery(), {
      query: '(nwr["amenity"](1,1,2,2)->.a;);node._["cuisine"];',
      loki: {
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
      }
    })
    assert.deepEqual(f.derefSets(), [
      { type: 'node', filters: [ { key: 'amenity', op: 'has_key' }, { fun: 'bbox', value: { minlat: 1, minlon: 1, maxlat: 2, maxlon: 2 } }, { key: 'cuisine', op: 'has_key' } ] }
    ])
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
    assert.equal(f.toQl({ setsUseStatementIds: true }), 'nwr["amenity"]->._1;nwr._1["cuisine"]->._2;')
    assert.equal(f.toQuery(), 'nwr["amenity"]->._1;nwr._1["cuisine"]->._2;')
    assert.equal(f.toQuery({ set: 'a' }), 'nwr["amenity"]->._1;')
    assert.deepEqual(f.recurse(), [])
    assert.deepEqual(f.recurse({ set: 'a' }), [])
    assert.deepEqual(f.getScript(), [
      { id: 2, recurse: [] }
    ])
    assert.deepEqual(f.getScript({ set: 'a' }), [
      { id: 1, recurse: [] }
    ])
    assert.deepEqual(f.compileQuery(), {
      query: 'nwr["amenity"]->.a;nwr.a["cuisine"];',
      loki: {
        $and: [
          {"tags.amenity": {$exists: true}},
          {"tags.cuisine": {$exists: true}}
        ]
      }
    })
    assert.deepEqual(f.derefSets(), [
      { type: 'nwr', filters: [ { key: 'amenity', op: 'has_key' }, { key: 'cuisine', op: 'has_key' } ] }
    ])
    assert.deepEqual(f.toLokijs(), {
      $and: [
        {"tags.amenity": {$exists: true}},
        {"tags.cuisine": {$exists: true}}
      ]
    })
    assert.deepEqual(f.derefSets({set: 'a'}), [
      { type: 'nwr', filters: [ { key: 'amenity', op: 'has_key' } ] }
    ])
    assert.deepEqual(f.toLokijs({set: 'a'}), {
      "tags.amenity": {$exists: true}
    })
    var r = f.cacheDescriptors()
    assert.deepEqual(r, [ { id: 'nwr["amenity"]["cuisine"](properties:1)' }])
    var r = f.cacheDescriptors({set: 'a'})
    assert.deepEqual(r, [ { id: 'nwr["amenity"](properties:1)' }])
  })
  it ('nwr[a]->.a;(nwr[b]->.b;nwr.a[b];);', function () {
    var f = new Filter('nwr[a]->.a;(nwr[b]->.b;nwr.a[b];);')

    assert.deepEqual(f.def, [
        [ {"op":"has_key","key":"a"}, {"outputSet":"a"} ],
        { or: [
          [ {"op":"has_key","key":"b"}, {"outputSet":"b"} ],
          [ { inputSet: "a" }, {"op":"has_key","key":"b"} ],
        ]}
      ]
    )
    assert.equal(f.toString(), 'nwr["a"]->.a;(nwr["b"]->.b;nwr.a["b"];);')
    assert.equal(f.toQl(), 'nwr["a"]->.a;(nwr["b"]->.b;nwr.a["b"];);')
    assert.equal(f.toQl({ setsUseStatementIds: true }), 'nwr["a"]->._1;(nwr["b"]->._3;nwr._1["b"]->._4;)->._2;')
    assert.equal(f.toQuery(), 'nwr["a"]->._1;(nwr["b"]->._3;nwr._1["b"]->._4;)->._2;')
    assert.deepEqual(f.recurse(), [])
    assert.deepEqual(f.recurse({ set: 'a' }), [])
    assert.deepEqual(f.getScript(), [
      { id: 2, recurse: [] }
    ])
    assert.deepEqual(f.getScript({ set: 'a' }), [
      { id: 1, recurse: [] }
    ])
    assert.deepEqual(f.derefSets(), [
      { type: 'nwr', filters: [ { key: 'b', op: 'has_key' } ] },
      { type: 'nwr', filters: [ { key: 'a', op: 'has_key' }, { key: 'b', op: 'has_key' } ] }
    ])
    assert.deepEqual(f.derefSets({ set: 'a' }), [
      { type: 'nwr', filters: [ { key: 'a', op: 'has_key' } ] }
    ])
    assert.deepEqual(f.derefSets({ set: 'b' }), [
      { type: 'nwr', filters: [ { key: 'b', op: 'has_key' } ] }
    ])
    assert.deepEqual(f.toLokijs(),
        { '$or': [
            { 'tags.b': { '$exists': true } },
            { '$and': [
                { 'tags.a': { '$exists': true } },
                { 'tags.b': { '$exists': true } }
            ]}
          ]}
    )
    var r = f.cacheDescriptors()
    assert.deepEqual(r, [
      { id: 'nwr["b"](properties:1)' },
      { id: 'nwr["a"]["b"](properties:1)' }
    ])
  })
  it ('(nwr[a]->.a;(nwr[b]->.b;nwr.a[b]););', function () {
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
    assert.equal(f.toQl({ setsUseStatementIds: true }), '(nwr["a"]->._2;(nwr["b"]->._4;nwr._2["b"]->._5;)->._3;)->._1;')
    assert.equal(f.toQuery(), '(nwr["a"]->._2;(nwr["b"]->._4;nwr._2["b"]->._5;)->._3;)->._1;')
    assert.deepEqual(f.recurse(), [])
    assert.deepEqual(f.recurse({ set: 'a' }), [])
    assert.deepEqual(f.getScript(), [
      { id: 1, recurse: [] }
    ])
    assert.deepEqual(f.getScript({ set: 'a' }), [
      { id: 2, recurse: [] }
    ])
    assert.deepEqual(f.getScript({ set: 'b' }), [
      { id: 4, recurse: [] }
    ])

    assert.deepEqual(f.compileQuery(), {
      query: '(nwr["a"]->.a;(nwr["b"]->.b;nwr.a["b"];););',
      loki: {
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
      }
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
    assert.deepEqual(f.derefSets(), [
      { type: 'nwr', filters: [ { key: 'a', op: 'has_key' } ] },
      { type: 'nwr', filters: [ { key: 'b', op: 'has_key' } ] },
      { type: 'nwr', filters: [ { key: 'a', op: 'has_key' }, { key: 'b', op: 'has_key' } ] }
    ])
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
    assert.equal(f.toString(), '(nwr["a"]->.a;(nwr["b"]->.b;nwr.a["b"];);)->.a;')
    assert.equal(f.toQl(), '(nwr["a"]->.a;(nwr["b"]->.b;nwr.a["b"];);)->.a;')
    assert.equal(f.toQl({ setsUseStatementIds: true }), '(nwr["a"]->._2;(nwr["b"]->._4;nwr._2["b"]->._5;)->._3;)->._1;')
    assert.equal(f.toQuery(), 'nwr["a"]->._2;(nwr["b"]->._4;nwr._2["b"]->._5;)->._3;')
    assert.deepEqual(f.recurse(), [])
    assert.deepEqual(f.recurse({ set: 'a' }), [])
    assert.deepEqual(f.getScript(), [
      { id: 3, recurse: [] }
    ])
    assert.deepEqual(f.getScript({ set: 'a' }), [
      { id: 1, recurse: [] }
    ])
    assert.deepEqual(f.compileQuery(), {
      query: '(nwr["b"]->.b;nwr.a["b"];);',
      loki: {
        $or: [
          { 'tags.b': { '$exists': true } },
          { '$and': [
              { 'tags.a': { '$exists': true } },
              { 'tags.b': { '$exists': true } }
            ]}
          ]
      }
    })
    assert.deepEqual(f.compileQuery({set: 'a'}), {
      query: '(nwr["a"]->.a;(nwr["b"]->.b;nwr.a["b"];);)->.a;',
      loki: {
        '$or': [
          { 'tags.a': { '$exists': true } },
          { '$or': [
            { 'tags.b': { '$exists': true } },
            { '$and': [
              { 'tags.a': { '$exists': true } },
              { 'tags.b': { '$exists': true } }
            ]}
          ]}
        ]
      }
    })
    assert.deepEqual(f.compileQuery({set: 'b'}), {
      query: 'nwr["b"]->.b;',
      loki: {
        "tags.b": { $exists: true }
      }
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
    assert.deepEqual(f.derefSets(), [
      { type: 'nwr', filters: [ { key: 'b', op: 'has_key' } ] },
      { type: 'nwr', filters: [ { key: 'a', op: 'has_key' }, { key: 'b', op: 'has_key' } ] }
    ])
    assert.deepEqual(f.derefSets({ set: 'a' }), [
      { type: 'nwr', filters: [ { key: 'a', op: 'has_key' } ] },
      { type: 'nwr', filters: [ { key: 'b', op: 'has_key' } ] },
      { type: 'nwr', filters: [ { key: 'a', op: 'has_key' }, { key: 'b', op: 'has_key' } ] }
    ])
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
    assert.equal(f.toQl({ setsUseStatementIds: true }), 'nwr._missing["amenity"]->._1;')
    assert.equal(f.toQuery(), null)
    assert.deepEqual(f.recurse(), [])
    assert.deepEqual(f.recurse({ set: 'a' }), [])
    assert.deepEqual(f.getScript(), [
      { id: 1, recurse: [] }
    ])
    assert.deepEqual(f.getScript({ set: 'a' }), [])
    assert.deepEqual(f.compileQuery(), {
      query: null
    })
    assert.deepEqual(f.toLokijs(), {
      $and: [
        {$not: true},
        {'tags.amenity': {$exists: true}}
      ]
    })
    assert.deepEqual(f.derefSets(), [
    ])
    assert.deepEqual(f.derefSets({ set: 'a' }), [
    ])
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
    assert.equal(f.toQl({ setsUseStatementIds: true }), 'nwr._missing._missing["amenity"]->._1;')
    assert.equal(f.toQuery(), null)
    assert.deepEqual(f.recurse(), [])
    assert.deepEqual(f.recurse({ set: 'a' }), [])
    assert.deepEqual(f.getScript(), [
      { id: 1, recurse: [] }
    ])
    assert.deepEqual(f.getScript({ set: 'a' }), [])
    assert.deepEqual(f.compileQuery(), {
      query: null
    })
    assert.deepEqual(f.toLokijs(), {
      $and: [
        {$not: true},
        {$not: true},
        {'tags.amenity': {$exists: true}}
      ]
    })
    assert.deepEqual(f.derefSets(), [
    ])
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
    assert.equal(f.toQl({ setsUseStatementIds: true }), 'nwr["amenity"]->._1;nwr["xxx"]->._2;nwr._1._2["cuisine"]->._3;')
    assert.equal(f.toQuery(), 'nwr["amenity"]->._1;nwr["xxx"]->._2;nwr._1._2["cuisine"]->._3;')
    assert.deepEqual(f.recurse(), [])
    assert.deepEqual(f.recurse({ set: 'a' }), [])
    assert.deepEqual(f.getScript(), [
      { id: 3, recurse: [] }
    ])
    assert.deepEqual(f.getScript({ set: 'a' }), [
      { id: 1, recurse: [] }
    ])
    assert.deepEqual(f.compileQuery(), {
      query: 'nwr["amenity"]->.a;nwr["xxx"]->.b;nwr.a.b["cuisine"];',
      loki: {
        $and: [
          {'tags.amenity': {$exists: true}},
          {'tags.xxx': {$exists: true}},
          {'tags.cuisine': {$exists: true}}
        ]
      }
    })
    assert.deepEqual(f.toLokijs(), {
      $and: [
        {'tags.amenity': {$exists: true}},
        {'tags.xxx': {$exists: true}},
        {'tags.cuisine': {$exists: true}}
      ]
    })
    assert.deepEqual(f.derefSets(), [
      { type: 'nwr', filters: [ { key: 'amenity', op: 'has_key' }, { key: 'xxx', op: 'has_key' }, { key: 'cuisine', op: 'has_key' } ] }
    ])
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
    assert.equal(f.toQl({ setsUseStatementIds: true }), 'nwr["amenity"]->._1;._1 > ->._2;')
    assert.equal(f.toQuery(), '._1 > ->._2;')
    assert.equal(f.toQuery({ statement: 1 }), 'nwr["amenity"]->._1;')
    assert.deepEqual(f.recurse(), [
      { id: 1, type: '>' }
    ])
    assert.deepEqual(f.recurse({ statement: 1 }), [])
    assert.deepEqual(f.getScript(), [
      { id: 1, recurse: [] },
      { id: 2, recurse: [
        { id: 1, type: '>' }
      ]}
    ])
    assert.deepEqual(f.getScript({ set: 'a' }), [])
    assert.deepEqual(f.compileQuery(), {
      query: '>;',
      loki: {},
      recurse: [{
        inputSet: '_',
        query: 'nwr["amenity"];',
        loki: {
          "tags.amenity": { $exists: true }
        },
        type: '>'
      }]
    })
    assert.deepEqual(f.toLokijs(), {})
    assert.deepEqual(f.derefSets(), [
      { type: 'nwr', filters: [], recurse:
        [
          { recurseType: '>', type: 'nwr', filters: [ { key: 'amenity', op: 'has_key' } ] }
        ]
      }
    ])
    var r = f.cacheDescriptors()
    assert.deepEqual(r, [
      { id: 'nwr(properties:0)',
        recurse: [
          { id: 'nwr["amenity"](properties:5)', recurseType: '>' }
        ]
      },
      { id: 'node(properties:0)',
        recurse: [
          { id: 'nwr(properties:4)',
            recurse: [
              { id: 'nwr["amenity"](properties:5)', recurseType: '>' }
            ],
            recurseType: 'w'
          }
        ]
      }
    ])
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
    assert.equal(f.toQl({ setsUseStatementIds: true }), 'nwr["amenity"]->._1;._1 > ->._2;')
    assert.equal(f.toQuery(), '._1 > ->._2;')
    assert.equal(f.toQuery({ statement: 1 }), 'nwr["amenity"]->._1;')
    assert.deepEqual(f.recurse(), [
      { id: 1, type: '>' }
    ])
    assert.deepEqual(f.recurse({ statement: 1 }), [])
    assert.deepEqual(f.getScript(), [
      { id: 1, recurse: [] },
      { id: 2, recurse: [
        { id: 1, type: '>' }
      ]}
    ])
    assert.deepEqual(f.compileQuery(), {
      query: '>;',
      loki: {},
      recurse: [{
        type: '>',
        inputSet: '_',
        query: 'nwr["amenity"];',
        loki: {
          "tags.amenity": { $exists: true }
        }
      }]
    })
    assert.deepEqual(f.toLokijs(), {})
    assert.deepEqual(f.derefSets(), [
      { type: 'nwr', filters: [], recurse:
        [
          { recurseType: '>', type: 'nwr', filters: [ { key: 'amenity', op: 'has_key' } ] }
        ]
      }
    ])
    var r = f.cacheDescriptors()
    assert.deepEqual(r, [
      { id: 'nwr(properties:0)',
        recurse: [
          { id: 'nwr["amenity"](properties:5)', recurseType: '>' }
        ]
      },
      { id: 'node(properties:0)',
        recurse: [
          { id: 'nwr(properties:4)',
            recurse: [
              { id: 'nwr["amenity"](properties:5)', recurseType: '>' }
            ],
            recurseType: 'w'
          }
        ]
      }
    ])
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
    assert.equal(f.toQl({ setsUseStatementIds: true }), 'nwr["amenity"]->._1;._1 > ->._2;')
    assert.equal(f.toQuery(), null)
    assert.equal(f.toQuery({ set: 'b' }), '._1 > ->._2;')
    assert.equal(f.toQuery({ statement: 1 }), 'nwr["amenity"]->._1;')
    assert.deepEqual(f.recurse(), [])
    assert.deepEqual(f.recurse({ set: 'b' }), [
      { id: 1, type: '>' }
    ])
    assert.deepEqual(f.recurse({ statement: 1 }), [])
    assert.deepEqual(f.getScript(), [])
    assert.deepEqual(f.getScript({ set: 'a' }), [
      { id: 1, recurse: [] }
    ])
    assert.deepEqual(f.compileQuery(), {
      query: null
    })
    assert.deepEqual(f.compileQuery({ set: 'a' }), {
      query: 'nwr["amenity"]->.a;',
      loki: {
        "tags.amenity": { $exists: true }
      }
    })
    assert.deepEqual(f.compileQuery({ set: 'b' }), {
      query: '.a > ->.b;',
      loki: {},
      recurse: [{
        type: '>',
        inputSet: 'a',
        query: 'nwr["amenity"]->.a;',
        loki: {
          "tags.amenity": { $exists: true }
        }
      }]
    })
    assert.deepEqual(f.toLokijs(), {
      $not: true
    })
    assert.deepEqual(f.toLokijs({set: 'a'}), {
      "tags.amenity": { $exists: true }
    })
    assert.deepEqual(f.toLokijs({set: 'b'}), {})
    assert.deepEqual(f.derefSets(), [])
    assert.deepEqual(f.derefSets({ set: 'a' }), [
      { type: 'nwr', filters: [ { key: 'amenity', op: 'has_key' } ] }
    ])
    assert.deepEqual(f.derefSets({ set: 'b' }), [
      { type: 'nwr', filters: [], recurse:
        [
          { recurseType: '>', type: 'nwr', filters: [ { key: 'amenity', op: 'has_key' } ] }
        ]
      }
    ])
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
    assert.equal(f.toQl({ setsUseStatementIds: true }), 'nwr["amenity"]->._1;node(w._1)->._2;')
    assert.equal(f.toQuery(), 'node(w._1)->._2;')
    assert.equal(f.toQuery({ statement: 1 }), 'nwr["amenity"]->._1;')
    assert.deepEqual(f.recurse(), [
      { id: 1, type: 'w' }
    ])
    assert.deepEqual(f.recurse({ statement: 1 }), [])
    assert.deepEqual(f.getScript(), [
      { id: 1, recurse: [] },
      { id: 2, recurse: [
        { id: 1, type: 'w' }
      ]}
    ])

    assert.deepEqual(f.compileQuery(), {
      query: 'node(w);',
      loki: {
        "type": { $eq: 'node' }
      },
      recurse: [{
        type: 'w',
        inputSet: '_',
        query: 'nwr["amenity"];',
        loki: {
          "tags.amenity": { $exists: true }
        }
      }]
    })
    assert.deepEqual(f.toLokijs(), {
      type: { $eq: 'node' }
    })
    assert.deepEqual(f.derefSets(), [
      { type: 'node', filters: [], recurse:
        [
          { recurseType: 'w', type: 'nwr', filters: [ { key: 'amenity', op: 'has_key' } ] }
        ]
      }
    ])
    var r = f.cacheDescriptors()
    assert.deepEqual(r, [
      { id: 'node(properties:0)',
        recurse: [
          { id: 'nwr["amenity"](properties:5)', recurseType: 'w' }
        ]
      }
    ])
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
    assert.equal(f.toQl({ setsUseStatementIds: true }), 'way["highway"]->._1;node(w._1)->._2;node._2["highway"]->._3;')
    assert.equal(f.toQuery(), 'node(w._1)->._2;node._2["highway"]->._3;')
    assert.equal(f.toQuery({ statement: 1 }), 'way["highway"]->._1;')
    assert.deepEqual(f.recurse(), [
      { id: 1, type: 'w' }
    ])
    assert.deepEqual(f.recurse({ statement: 1 }), [])
    assert.deepEqual(f.getScript(), [
      { id: 1, recurse: [] },
      { id: 3, recurse: [
        { id: 1, type: 'w' }
      ]}
    ])
    assert.deepEqual(f.compileQuery(), {
      recurse: [{
        type: 'w',
        inputSet: '_',
        query: 'way["highway"];',
        loki: {
          "tags.highway": { $exists: true },
          "type": { $eq: 'way' }
        }
      }],
      query: 'node(w);node._["highway"];',
      loki: {
        $and: [{
          "type": { $eq: 'node' },
        }, {
          "tags.highway": { $exists: true },
          "type": { $eq: 'node' },
        }]
      }
    })
    assert.deepEqual(f.toLokijs(), {
      $and: [
        {type: { $eq: 'node' }},
        {
          "tags.highway": { $exists: true },
          "type": { $eq: 'node' },
        }
      ]
    })
    assert.deepEqual(f.derefSets(), [
      { type: 'node', filters: [ { key: 'highway', op: 'has_key' } ],
        recurse: [ { recurseType: 'w', type: 'way', filters: [ { key: 'highway', op: 'has_key' } ]
        }]
      }
    ])
    var r = f.cacheDescriptors()
    assert.deepEqual(r, [
      { id: 'node["highway"](properties:1)',
        recurse: [
          { id: 'way["highway"](properties:5)', recurseType: 'w' }
        ]
      }
    ])
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
    assert.equal(f.toQl({ setsUseStatementIds: true }), 'way["highway"]->._1;node(w._1)->._2;way["railway"]->._3;node._2(w._3)->._4;')
    assert.equal(f.toQuery(), 'node(w._1)->._2;node._2(w._3)->._4;')
    assert.equal(f.toQuery({ statement: 1 }), 'way["highway"]->._1;')
    assert.equal(f.toQuery({ statement: 3 }), 'way["railway"]->._3;')
    assert.deepEqual(f.recurse(), [
      { id: 3, type: 'w' },
      { id: 1, type: 'w' }
    ])
    assert.deepEqual(f.recurse({ statement: 1 }), [])
    assert.deepEqual(f.recurse({ statement: 3 }), [])
    assert.deepEqual(f.getScript(), [
      { id: 3, recurse: [] },
      { id: 1, recurse: [] },
      { id: 4, recurse: [
        { id: 3, type: 'w' },
        { id: 1, type: 'w' }
      ]}
    ])
    assert.deepEqual(f.getScript({ set: 'a' }), [
      { id: 1, recurse: [] },
      { id: 2, recurse: [
        { id: 1, type: 'w' }
      ]}
    ])
    assert.deepEqual(f.compileQuery(), {
      // TODO: assign input sets
      query: 'node(w)->.a;node.a(w);',
      loki: {
        $and: [{
          type: { $eq: 'node' }
        }, {
          type: { $eq: 'node' }
        }]
      },
      recurse: [
        {
          type: 'w',
          inputSet: '_',
          query: 'way["railway"];',
          loki: {
            type: { $eq: 'way' },
            "tags.railway": { $exists: true }
          }
        },
        {
          type: 'w',
          inputSet: '_',
          query: 'way["highway"];',
          loki: {
            type: { $eq: 'way' },
            "tags.highway": { $exists: true }
          }
        }
      ]
    })
    assert.deepEqual(f.toLokijs(), {
      $and: [
        {type: { $eq: 'node' }},
        {type: { $eq: 'node' }}
      ]
    })
    assert.deepEqual(f.derefSets(), [
      { "type": "node", "filters": [], "recurse": [
        { "recurseType": "w", "type": "way", "filters": [ { "key": "highway", "op": "has_key" } ] },
        { "recurseType": "w", "type": "way", "filters": [ { "key": "railway", "op": "has_key" } ] }
      ] }
    ])
    var r = f.cacheDescriptors()
    assert.deepEqual(r, [
      { id: 'node(properties:0)',
        recurse: [
          { id: 'way["highway"](properties:5)', recurseType: 'w' },
          { id: 'way["railway"](properties:5)', recurseType: 'w' }
        ]
      }
    ])
  })
  it ('way["highway"];node(w)->.a;way["railway"];node(w).a;', function () {
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
    assert.equal(f.toQl({ setsUseStatementIds: true }), 'way["highway"]->._1;node(w._1)->._2;way["railway"]->._3;node._2(w._3)->._4;')
    assert.equal(f.toQuery(), 'node(w._1)->._2;node._2(w._3)->._4;')
    assert.equal(f.toQuery({ statement: 1 }), 'way["highway"]->._1;')
    assert.equal(f.toQuery({ statement: 3 }), 'way["railway"]->._3;')
    assert.deepEqual(f.recurse(), [
      { id: 3, type: 'w' },
      { id: 1, type: 'w' }
    ])
    assert.deepEqual(f.recurse({ statement: 1 }), [])
    assert.deepEqual(f.recurse({ statement: 3 }), [])
    assert.deepEqual(f.getScript(), [
      { id: 3, recurse: [] },
      { id: 1, recurse: [] },
      { id: 4, recurse: [
        { id: 3, type: 'w' },
        { id: 1, type: 'w' }
      ]}
    ])
    assert.deepEqual(f.getScript({ set: 'a' }), [
      { id: 1, recurse: [] },
      { id: 2, recurse: [
        { id: 1, type: 'w' }
      ]}
    ])
    assert.deepEqual(f.compileQuery(), {
      // TODO: assign input sets
      query: 'node(w)->.a;node.a(w);',
      loki: {
        $and: [{
          type: { $eq: 'node' }
        }, {
          type: { $eq: 'node' }
        }]
      },
      recurse: [
        {
          type: 'w',
          inputSet: '_',
          query: 'way["railway"];',
          loki: {
            type: { $eq: 'way' },
            "tags.railway": { $exists: true }
          }
        },
        {
          type: 'w',
          inputSet: '_',
          query: 'way["highway"];',
          loki: {
            type: { $eq: 'way' },
            "tags.highway": { $exists: true }
          }
        }
      ]
    })
    assert.deepEqual(f.toLokijs(), {
      $and: [
        {type: { $eq: 'node' }},
        {type: { $eq: 'node' }}
      ]
    })
    assert.deepEqual(f.derefSets(), [
      { "type": "node", "filters": [], "recurse": [
        { "recurseType": "w", "type": "way", "filters": [ { "key": "highway", "op": "has_key" } ] },
        { "recurseType": "w", "type": "way", "filters": [ { "key": "railway", "op": "has_key" } ] }
      ] }
    ])
    var r = f.cacheDescriptors()
    assert.deepEqual(r, [
      { id: 'node(properties:0)',
        recurse: [
          { id: 'way["highway"](properties:5)', recurseType: 'w' },
          { id: 'way["railway"](properties:5)', recurseType: 'w' }
        ]
      }
    ])
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
    assert.equal(f.toQl({ setsUseStatementIds: true }), 'way["highway"]->._1;way["railway"]->._2;node(w._1)(w._2)->._3;')
    assert.equal(f.toQuery(), 'node(w._1)(w._2)->._3;')
    assert.equal(f.toQuery({ statement: 1 }), 'way["highway"]->._1;')
    assert.equal(f.toQuery({ statement: 2 }), 'way["railway"]->._2;')
    assert.deepEqual(f.recurse(), [
      { id: 1, type: 'w' },
      { id: 2, type: 'w' }
    ])
    assert.deepEqual(f.recurse({ statement: 1 }), [])
    assert.deepEqual(f.recurse({ statement: 2 }), [])
    assert.deepEqual(f.getScript(), [
      { id: 1, recurse: [] },
      { id: 2, recurse: [] },
      { id: 3, recurse: [
        { id: 1, type: 'w' },
        { id: 2, type: 'w' }
      ]}
    ])
    assert.deepEqual(f.getScript({ set: 'a' }), [
      { id: 1, recurse: [] }
    ])
    assert.deepEqual(f.compileQuery(), {
      query: 'node(w.a)(w.b);',
      loki: {
        type: { $eq: 'node' }
      },
      recurse: [
        {
          inputSet: 'a',
          query: 'way["highway"]->.a;',
          loki: {
            "tags.highway": { $exists: true },
            "type": { $eq: 'way' }
          },
          type: 'w'
        },
        {
          inputSet: 'b',
          query: 'way["railway"]->.b;',
          loki: {
            "tags.railway": { $exists: true },
            "type": { $eq: 'way' }
          },
          type: 'w'
        }
      ]
    })
    assert.deepEqual(f.toLokijs(), {
      type: { $eq: 'node' }
    })
    assert.deepEqual(f.derefSets(), [
      { "type": "node", "filters": [], "recurse": [
        { "recurseType": "w", "type": "way", "filters": [ { "key": "highway", "op": "has_key" } ] },
        { "recurseType": "w", "type": "way", "filters": [ { "key": "railway", "op": "has_key" } ] }
      ] }
    ])
    var r = f.cacheDescriptors()
    assert.deepEqual(r, [
      { id: 'node(properties:0)',
        recurse: [
          { id: 'way["highway"](properties:5)', recurseType: 'w' },
          { id: 'way["railway"](properties:5)', recurseType: 'w' }
        ]
      }
    ])
  })
  it ('(way[highway];way[railway];);node(w);', function () {
    var f = new Filter('(way[highway];way[railway];);node(w);')

    assert.deepEqual(f.def, [
      {
        or: [
          [ { type: 'way' }, { key: 'highway', op: 'has_key' } ],
          [ { type: 'way' }, { key: 'railway', op: 'has_key' } ]
        ]
      },
      [ { type: 'node' }, { inputSet: '_', recurse: 'w' } ]
    ])
    assert.equal(f.toString(), '(way["highway"];way["railway"];);node(w);')
    assert.equal(f.toQl(), '(way["highway"];way["railway"];);node(w);')
    assert.equal(f.toQl({ setsUseStatementIds: true }), '(way["highway"]->._2;way["railway"]->._3;)->._1;node(w._1)->._4;')
    assert.equal(f.toQuery(), 'node(w._1)->._4;')
    assert.equal(f.toQuery({ statement: 1 }), '(way["highway"]->._2;way["railway"]->._3;)->._1;')
    assert.equal(f.toQuery({ statement: 2 }), 'way["highway"]->._2;')
    assert.equal(f.toQuery({ statement: 3 }), 'way["railway"]->._3;')
    assert.equal(f.toQuery({ statement: 4 }), 'node(w._1)->._4;')
    assert.deepEqual(f.recurse(), [
      { id: 1, type: 'w' }
    ])
    assert.deepEqual(f.recurse({ statement: 1 }), [])
    assert.deepEqual(f.recurse({ statement: 2 }), [])
    assert.deepEqual(f.getScript(), [
      { id: 1, recurse: [] },
      { id: 4, recurse: [
        { id: 1, type: 'w' }
      ]}
    ])
    console.log(JSON.stringify(f.compileQuery().recurse[0].loki))
    assert.deepEqual(f.compileQuery(), {
      query: 'node(w);',
      recurse: [
        {
          query: '(way["highway"];way["railway"];);',
          loki: {"$or":[{"type":{"$eq":"way"},"tags.highway":{"$exists":true}},{"type":{"$eq":"way"},"tags.railway":{"$exists":true}}]},
          inputSet: '_',
          type: 'w'
        }
      ],
      loki: { type: { '$eq': 'node' } }
    })
    assert.deepEqual(f.toLokijs(), {
      type: { $eq: 'node' }
    })
    assert.deepEqual(f.derefSets(), [
      { "type": "node", "filters": [], "recurse": [
        { "recurseType": "w", "type": "way", "filters": [ { "key": "highway", "op": "has_key" } ] },
      ] },
      { "type": "node", "filters": [], "recurse": [
        { "recurseType": "w", "type": "way", "filters": [ { "key": "railway", "op": "has_key" } ] },
      ] }
    ])
    var r = f.cacheDescriptors()
    assert.deepEqual(r, [
      { id: 'node(properties:0)',
        recurse: [
          { id: 'way["highway"](properties:5)', recurseType: 'w' },
        ]
      },
      { id: 'node(properties:0)',
        recurse: [
          { id: 'way["railway"](properties:5)', recurseType: 'w' },
        ]
      }
    ])
  })
  it ('relation[route=tram];way(r);node(w);', function () {
    var f = new Filter('relation[route=tram];way(r);node(w);')

    assert.deepEqual(f.def, [
      [
        {"type":"relation"},
        {"key":"route","op":"=","value":"tram"}
      ],
      [
        {"type":"way"},
        {"recurse":"r","inputSet": "_"}
      ],
      [
        {"type": "node"},
        {"recurse":"w","inputSet":"_"},
      ]
    ])
    assert.equal(f.toString(), 'relation["route"="tram"];way(r);node(w);')
    assert.equal(f.toQl(), 'relation["route"="tram"];way(r);node(w);')
    assert.equal(f.toQl({ setsUseStatementIds: true }), 'relation["route"="tram"]->._1;way(r._1)->._2;node(w._2)->._3;')
    assert.equal(f.toQuery(), 'node(w._2)->._3;')
    assert.equal(f.toQuery({ statement: 2 }), 'way(r._1)->._2;')
    assert.equal(f.toQuery({ statement: 1 }), 'relation["route"="tram"]->._1;')
    assert.deepEqual(f.recurse(), [
      { id: 2, type: 'w' }
    ])
    assert.deepEqual(f.recurse({ statement: 2 }), [
      { id: 1, type: 'r' }
    ])
    assert.deepEqual(f.recurse({ statement: 1 }), [])
    assert.deepEqual(f.getScript(), [
      { id: 1, recurse: [] },
      { id: 2, recurse: [
        { id: 1, type: 'r' }
      ]},
      { id: 3, recurse: [
        { id: 2, type: 'w' }
      ]}
    ])
    assert.deepEqual(f.compileQuery(), {
      query: 'node(w);',
      loki: {
        type: { $eq: 'node' }
      },
      recurse: [
        {
          type: 'w',
          inputSet: '_',
          query: 'way(r);',
          loki: {
            type: { $eq: 'way' }
          },
          recurse: [{
            type: 'r',
            inputSet: '_',
            query: 'relation["route"="tram"];',
            loki: {
              type: { $eq: 'relation' },
              "tags.route": { $eq: 'tram' }
            }
          }]
        }
      ]
    })
    assert.deepEqual(f.toLokijs(), {
      type: { $eq: 'node' }
    })
    assert.deepEqual(f.derefSets(), [
      { "type": "node", "filters": [], "recurse": [
        { "recurseType": "w", "type": "way", "filters": [], "recurse": [
          { "recurseType": "r", "type": "relation", "filters": [ { "key": "route", "op": "=", "value": "tram" } ] }
        ] }
      ] }
    ])
    var r = f.cacheDescriptors()
    assert.deepEqual(r, [
      { id: 'node(properties:0)',
        recurse: [
          { id: 'way(properties:4)', recurseType: 'w',
            recurse: [
              { id: 'relation["route"="tram"](properties:5)', recurseType: 'r' }
            ]
          }
        ]
      }
    ])
  })
  it ('relation[building];way(r: "outer" );', function () {
    var f = new Filter('relation[building];way(r: "outer" )')

    assert.deepEqual(f.def, [
      [
        {"type":"relation"},
        {"key":"building","op":"has_key"}
      ],
      [
        {"type":"way"},
        {"recurse":"r","inputSet": "_","role":"outer"}
      ]
    ])
    assert.equal(f.toString(), 'relation["building"];way(r:"outer");')
    assert.equal(f.toQl(), 'relation["building"];way(r:"outer");')
    assert.equal(f.toQl({ setsUseStatementIds: true }), 'relation["building"]->._1;way(r._1:"outer")->._2;')
    assert.equal(f.toQuery(), 'way(r._1:"outer")->._2;')
    assert.equal(f.toQuery({ statement: 1 }), 'relation["building"]->._1;')
    assert.deepEqual(f.recurse(), [
      { id: 1, role: 'outer', type: 'r' }
    ])
    assert.deepEqual(f.recurse({ statement: 2 }), [
      { id: 1, role: 'outer', type: 'r' }
    ])
    assert.deepEqual(f.recurse({ statement: 1 }), [])
    assert.deepEqual(f.getScript(), [
      { id: 1, recurse: [] },
      { id: 2, recurse: [
        { id: 1, role: 'outer', type: 'r' }
      ]},
    ])
    assert.deepEqual(f.compileQuery(), {
      query: 'way(r:"outer");',
      loki: {
        type: { $eq: 'way' }
      },
      recurse: [
        {
          type: 'r',
          inputSet: '_',
          query: 'relation["building"];',
          loki: {
            type: { $eq: 'relation' },
            "tags.building": { $exists: true }
          }
        }
      ]
    })
    assert.deepEqual(f.toLokijs(), {
      type: { $eq: 'way' }
    })
    assert.deepEqual(f.derefSets(), [
      { type: "way", filters: [], recurse: [
        { recurseType: "r", type: "relation", role: "outer", filters: [{"key":"building","op":"has_key"}]}
      ] }
    ])
    var r = f.cacheDescriptors()
    assert.deepEqual(r, [
      { id: 'way(properties:0)',
        recurse: [
          { id: 'relation["building"](properties:5)', recurseType: 'r', role: 'outer' }
        ]
      }
    ])
  })
  it ('relation[building];way(r: outer );', function () {
    var f = new Filter('relation[building];way(r: outer )')

    assert.deepEqual(f.def, [
      [
        {"type":"relation"},
        {"key":"building","op":"has_key"}
      ],
      [
        {"type":"way"},
        {"recurse":"r","inputSet": "_","role":"outer"}
      ]
    ])
    assert.equal(f.toString(), 'relation["building"];way(r:"outer");')
    assert.equal(f.toQl(), 'relation["building"];way(r:"outer");')
    assert.equal(f.toQl({ setsUseStatementIds: true }), 'relation["building"]->._1;way(r._1:"outer")->._2;')
    assert.equal(f.toQuery(), 'way(r._1:"outer")->._2;')
    assert.equal(f.toQuery({ statement: 1 }), 'relation["building"]->._1;')
    assert.deepEqual(f.recurse(), [
      { id: 1, role: 'outer', type: 'r' }
    ])
    assert.deepEqual(f.recurse({ statement: 2 }), [
      { id: 1, role: 'outer', type: 'r' }
    ])
    assert.deepEqual(f.recurse({ statement: 1 }), [])
    assert.deepEqual(f.getScript(), [
      { id: 1, recurse: [] },
      { id: 2, recurse: [
        { id: 1, role: 'outer', type: 'r' }
      ]},
    ])
    assert.deepEqual(f.compileQuery(), {
      query: 'way(r:"outer");',
      loki: {
        type: { $eq: 'way' }
      },
      recurse: [
        {
          type: 'r',
          inputSet: '_',
          query: 'relation["building"];',
          loki: {
            type: { $eq: 'relation' },
            "tags.building": { $exists: true }
          }
        }
      ]
    })
    assert.deepEqual(f.toLokijs(), {
      type: { $eq: 'way' }
    })
    assert.deepEqual(f.derefSets(), [
      { type: "way", filters: [], recurse: [
        { recurseType: "r", role: "outer", type: "relation", filters: [ { "key": "building", "op": "has_key" } ] }
      ] }
    ])
    var r = f.cacheDescriptors()
    assert.deepEqual(r, [
      { id: 'way(properties:0)',
        recurse: [
          { id: 'relation["building"](properties:5)', recurseType: 'r', role: 'outer' }
        ]
      }
    ])
  })
  it ('way[highway];(node(w)[highway];);', function () {
    var f = new Filter('way[highway];(node(w)[highway];);')

    assert.deepEqual(f.def, [
      [
        { type: 'way' },
        { op: 'has_key', key: 'highway' }
      ],
      { or: [
        [
          { type: 'node' },
          { inputSet: '_', recurse: 'w' },
          { key: 'highway', op: 'has_key' }
        ]
      ]}
    ])
    assert.equal(f.toString(), 'way["highway"];(node(w)["highway"];);')
    assert.equal(f.toQl(), 'way["highway"];(node(w)["highway"];);')
    assert.equal(f.toQl({ setsUseStatementIds: true }), 'way["highway"]->._1;(node(w._1)["highway"]->._3;)->._2;')
    assert.deepEqual(f.recurse(), [
      { id: 3, type: 'or' }
    ])
    assert.deepEqual(f.recurse({ statement: 3 }), [
      { id: 1, type: 'w' }
    ])
    assert.deepEqual(f.recurse({ statement: 1 }), [])
    assert.deepEqual(f.getScript(), [
      { id: 1, recurse: [] },
      { id: 3, recurse: [
        { id: 1, type: 'w' }
      ]},
      { id: 2, recurse: [
        { id: 3, type: 'or' }
      ]}
    ])
    assert.equal(f.toQuery(), '(nwr._3;)->._2;')
    assert.deepEqual(f.toLokijs(), {})
    assert.deepEqual(f.toLokijs({ statement: 3 }), {
      'tags.highway': { $exists: true },
      'type': { $eq: 'node' }
    })
    assert.deepEqual(f.toLokijs({ statement: 1 }), {
      'tags.highway': { $exists: true },
      'type': { $eq: 'way' }
    })
    assert.deepEqual(f.derefSets(), [
      { "type": "node", "filters": [ { "key": "highway", "op": "has_key" } ], "recurse": [
        { "recurseType": "w", "type": "way", "filters": [ { "key": "highway", "op": "has_key" } ] }
      ] }
    ])
    var r = f.cacheDescriptors()
    assert.deepEqual(r, [
      { id: 'node["highway"](properties:1)',
        recurse: [
          { id: 'way["highway"](properties:5)', recurseType: 'w' }
        ]
      },
    ])
  })
  it ('(nwr[b];>;);', function () {
    var f = new Filter('(nwr[b];>;)')

    assert.deepEqual(f.def, [
      { or: [
        [ { key: 'b', op: 'has_key' } ],
        { recurse: '>' }
      ]}
    ])
    assert.equal(f.toString(), '(nwr["b"];>;);')
    assert.equal(f.toQl(), '(nwr["b"];>;);')
    assert.equal(f.toQl({ setsUseStatementIds: true }), '(nwr["b"]->._2;._2 > ->._3;)->._1;')
    assert.deepEqual(f.recurse(), [
      { id: 2, type: 'or' },
      { id: 3, type: 'or' }
    ])
    assert.deepEqual(f.recurse({ statement: 2 }), [])
    assert.deepEqual(f.recurse({ statement: 3 }), [
      { id: 2, type: '>' }
    ])
    assert.deepEqual(f.getScript(), [
      { id: 2, recurse: [] },
      { id: 3, recurse: [
        { id: 2, type: '>' }
      ]},
      { id: 1, recurse: [
        { id: 2, type: 'or' },
        { id: 3, type: 'or' }
      ]}
    ])
    assert.equal(f.toQuery(), '(nwr._2;nwr._3;)->._1;')
    assert.deepEqual(f.toLokijs(), {})
    assert.deepEqual(f.derefSets(), [
      { "type": "nwr", "filters": [ { "key": "b", "op": "has_key" } ] },
      { "type": "nwr", "filters": [], "recurse": [
        { "recurseType": ">", "type": "nwr", "filters": [ { "key": "b", "op": "has_key" } ] }
      ] }
    ])
    var r = f.cacheDescriptors()
    assert.deepEqual(r, [
      { id: 'nwr["b"](properties:1)' },
      { id: 'nwr(properties:0)',
        recurse: [
          { id: 'nwr["b"](properties:5)', recurseType: '>' }
        ]
      },
      { id: 'node(properties:0)',
        recurse: [
          { id: 'nwr(properties:4)',
            recurse: [
              { id: 'nwr["b"](properties:5)', recurseType: '>' }
            ],
            recurseType: 'w'
          }
        ]
      }
    ])
  })
  it ('nwr[amenity];.foo >', function () {
    var f = new Filter('nwr[amenity];.foo >')

    assert.deepEqual(f.def, [
      [
        {"op":"has_key","key":"amenity"}
      ],
      {"recurse":">", inputSet: 'foo'}
    ])
    assert.equal(f.toString(), 'nwr["amenity"];.foo >;')
    assert.equal(f.toQl(), 'nwr["amenity"];.foo >;')
    assert.equal(f.toQl({ setsUseStatementIds: true }), 'nwr["amenity"]->._1;._missing > ->._2;')
    assert.equal(f.toQuery(), '._missing > ->._2;')
    assert.equal(f.toQuery({ statement: 1 }), 'nwr["amenity"]->._1;')
    assert.deepEqual(f.recurse(), [
      { id: null, type: '>' }
    ])
    assert.deepEqual(f.recurse({ statement: 1 }), [])
    assert.deepEqual(f.getScript(), [
      { id: 2, recurse: [
        { id: null, type: '>' }
      ]}
    ])
    assert.deepEqual(f.getScript({ set: 'a' }), [])
    assert.deepEqual(f.compileQuery(), {
      query: '.foo >;',
      loki: {},
      recurse: [null]
    })
    assert.deepEqual(f.toLokijs(), {})
    assert.deepEqual(f.derefSets(), [])
    var r = f.cacheDescriptors()
    assert.deepEqual(r, [])
  })
  it ('nwr[amenity];node(w.foo);', function () {
    var f = new Filter('nwr[amenity];node(w.foo);')

    assert.deepEqual(f.def, [
      [
        {"op":"has_key","key":"amenity"}
      ],
      [
        {"type": "node"}, { inputSet: "foo", recurse: 'w' }
      ]
    ])
    assert.equal(f.toString(), 'nwr["amenity"];node(w.foo);')
    assert.equal(f.toQl(), 'nwr["amenity"];node(w.foo);')
    assert.equal(f.toQl({ setsUseStatementIds: true }), 'nwr["amenity"]->._1;node(w._missing)->._2;')
    assert.equal(f.toQuery(), 'node(w._missing)->._2;')
    assert.equal(f.toQuery({ statement: 1 }), 'nwr["amenity"]->._1;')
    assert.deepEqual(f.recurse(), [
      { id: null, type: 'w' }
    ])
    assert.deepEqual(f.recurse({ statement: 1 }), [])
    assert.deepEqual(f.getScript(), [
      { id: 2, recurse: [
        { id: null, type: 'w' }
      ]}
    ])
    assert.deepEqual(f.getScript({ set: 'a' }), [])
    assert.deepEqual(f.compileQuery(), {
      query: 'node(w.foo);',
      loki: {
        type: { $eq: 'node' }
      },
      recurse: [null]
    })
    assert.deepEqual(f.toLokijs(), {
      type: { $eq: 'node' }
    })
    assert.deepEqual(f.derefSets(), [])
    var r = f.cacheDescriptors()
    assert.deepEqual(r, [])
  })
  it ('nwr[amenity];(node(w.foo););', function () {
    var f = new Filter('nwr[amenity];(node(w.foo););')

    assert.deepEqual(f.def, [
      [
        {"op":"has_key","key":"amenity"}
      ],
      { or: [
        [ {"type": "node"}, { inputSet: "foo", recurse: 'w' } ]
      ]}
    ])
    assert.equal(f.toString(), 'nwr["amenity"];(node(w.foo););')
    assert.equal(f.toQl(), 'nwr["amenity"];(node(w.foo););')
    assert.equal(f.toQl({ setsUseStatementIds: true }), 'nwr["amenity"]->._1;(node(w._missing)->._3;)->._2;')
    assert.equal(f.toQuery(), '(nwr._3;)->._2;')
    assert.equal(f.toQuery({ statement: 1 }), 'nwr["amenity"]->._1;')
    assert.deepEqual(f.recurse(), [
      { id: 3, type: 'or' }
    ])
    assert.deepEqual(f.recurse({ statement: 1 }), [])
    assert.deepEqual(f.getScript(), [
      { id: 3, recurse: [
        { id: null, type: 'w' }
      ]},
      { id: 2, recurse: [
        { id: 3, type: 'or' }
      ]}
    ])
    assert.deepEqual(f.getScript({ set: 'a' }), [])
    assert.deepEqual(f.compileQuery(), {
      query: '(node(w.foo););',
      loki: {}
    })
    assert.deepEqual(f.toLokijs(), {})
    assert.deepEqual(f.derefSets(), [ ])
    var r = f.cacheDescriptors()
    assert.deepEqual(r, [])
  })
  it ('nwr[a]->.a;(nwr[b]; >;(.a >;););', function () {
    var f = new Filter('nwr[a]->.a;(nwr[b]; >;(.a >;););')

    assert.deepEqual(f.def, [
        [ {"op":"has_key","key":"a"}, {"outputSet":"a"} ],
        { or: [
          [ {"op":"has_key","key":"b"} ],
          { recurse: '>' },
          { or: [
            { recurse: '>', inputSet: "a" }
          ]}
        ]}
      ]
    )
    assert.equal(f.toString(), 'nwr["a"]->.a;(nwr["b"];>;(.a >;););')
    assert.equal(f.toQl(), 'nwr["a"]->.a;(nwr["b"];>;(.a >;););')
    assert.equal(f.toQl({ setsUseStatementIds: true }), 'nwr["a"]->._1;(nwr["b"]->._3;._3 > ->._4;(._1 > ->._6;)->._5;)->._2;')
    assert.equal(f.toQuery(), '(nwr._3;nwr._4;nwr._5;)->._2;')
    assert.equal(f.toQuery({ statement: 3 }), 'nwr["b"]->._3;')
    assert.equal(f.toQuery({ statement: 4 }), '._3 > ->._4;')
    assert.equal(f.toQuery({ statement: 5 }), '(nwr._6;)->._5;')
    assert.equal(f.toQuery({ statement: 6 }), '._1 > ->._6;')
    assert.equal(f.toQuery({ statement: 1 }), 'nwr["a"]->._1;')
    assert.deepEqual(f.recurse(), [
      { id: 3, type: 'or' },
      { id: 4, type: 'or' },
      { id: 5, type: 'or' }
    ])
    assert.deepEqual(f.recurse({ statement: 1 }), [])
    assert.deepEqual(f.recurse({ statement: 3 }), [])
    assert.deepEqual(f.recurse({ statement: 4 }), [
      { id: 3, type: '>' }
    ])
    assert.deepEqual(f.recurse({ statement: 5 }), [
      { id: 6, type: 'or' }
    ])
    assert.deepEqual(f.recurse({ statement: 6 }), [
      { id: 1, type: '>' }
    ])
    assert.deepEqual(f.recurse({ set: 'a' }), [])
    assert.deepEqual(f.getScript(), [
      { id: 3, recurse: [] },
      { id: 4, recurse: [
        { id: 3, type: '>' }
      ]},
      { id: 1, recurse: [] },
      { id: 6, recurse: [
        { id: 1, type: '>' }
      ]},
      { id: 5, recurse: [
        { id: 6, type: 'or' }
      ]},
      { id: 2, recurse: [
        { id: 3, type: 'or' },
        { id: 4, type: 'or' },
        { id: 5, type: 'or' }
      ]}
    ])
    assert.deepEqual(f.getScript({ set: 'a' }), [
      { id: 1, recurse: [] }
    ])
    assert.deepEqual(f.toLokijs(), {}) // TODO: wrong (should include nwr[b])
    assert.deepEqual(f.derefSets(), [
      { "type": "nwr", "filters": [ { "key": "b", "op": "has_key" } ] },
      { "type": "nwr", "filters": [], "recurse": [
        { "recurseType": ">", "type": "nwr", "filters": [ { "key": "b", "op": "has_key" } ] }
      ] },
      { "type": "nwr", "filters": [], "recurse": [
        { "recurseType": ">", "type": "nwr", "filters": [ { "key": "a", "op": "has_key" } ] }
      ] }
    ])
    var r = f.cacheDescriptors()
    assert.deepEqual(r, [
      { id: 'nwr["b"](properties:1)' },
      { id: 'nwr(properties:0)',
        recurse: [
          { id: 'nwr["b"](properties:5)', recurseType: '>' }
        ]
      },
      { id: 'node(properties:0)',
        recurse: [
          { id: 'nwr(properties:4)',
            recurse: [
              { id: 'nwr["b"](properties:5)', recurseType: '>' }
            ],
            recurseType: 'w'
          }
        ]
      },
      { id: 'nwr(properties:0)',
        recurse: [
          { id: 'nwr["a"](properties:5)', recurseType: '>' }
        ]
      },
      { id: 'node(properties:0)',
        recurse: [
          { id: 'nwr(properties:4)',
            recurse: [
              { id: 'nwr["a"](properties:5)', recurseType: '>' }
            ],
            recurseType: 'w'
          }
        ]
      },
    ])
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
    assert.equal(f.toQl({ setsUseStatementIds: true }), 'nwr(46,16,47,17)->._base;nwr._base["amenity"]->._1;')
    assert.equal(f.toQuery(), '(nwr(46,16,47,17)->._1;)->._base;nwr._base["amenity"]->._1;')
    assert.deepEqual(f.recurse(), [])
    assert.deepEqual(f.getScript(), [
      { id: 1, recurse: [] }
    ])
    assert.deepEqual(f.compileQuery(), {
      query: 'nwr(46,16,47,17)->._base;nwr._base["amenity"];',
      loki: {
        $and: [{
          "tags.amenity": { $exists: true }
        }],
        needMatch: true
      }
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
    assert.equal(f.toQl({ setsUseStatementIds: true }), 'nwr(46,16,47,17)->._base;(nwr._base["a"]->._2;nwr._base["b"]->._3;)->._1;._1 > ->._4;')
    assert.equal(f.toQuery(), '._1 > ->._4;')
    assert.equal(f.toQuery({ statement: 1 }), '(nwr._base["a"]->._2;nwr._base["b"]->._3;)->._1;') // TODO: wrong, ._base missing
    // assert.equal(f.toQuery(), '(nwr(46,16,47,17)->._1;)->._base;nwr._base["amenity"]->._1;')
    assert.deepEqual(f.recurse(), [
      { id: 1, type: '>' }
    ])
    assert.deepEqual(f.recurse({ statement: 1 }), [])
    assert.deepEqual(f.getScript(), [
      { id: 1, recurse: [] },
      { id: 4, recurse: [
        { id: 1, type: '>' }
      ]}
    ])
    assert.deepEqual(f.compileQuery(), {
      query: '>;',
      loki: {},
      recurse: [{
        type: '>',
        inputSet: '_',
        // TODO: query: 'nwr(46,16,47,17)->._base;(nwr._base["a"];nwr._base["b"];);',
        query: '(nwr._base["a"];nwr._base["b"];);',
        loki: {
          $or: [{
            $and: [{
              "tags.a": { $exists: true }
            }],
          }, {
            $and: [{
              "tags.b": { $exists: true }
            }]
          }],
          needMatch: true
        }
      }]
    })
    assert.deepEqual(f.toLokijs(), {})
    var r = f.cacheDescriptors()
    assert.deepEqual(r, [
      { id: 'nwr(properties:0)',
        recurse: [
          { id: 'nwr["a"](properties:21)', bounds: { type: 'Polygon', coordinates: [[[16,46],[17,46],[17,47],[16,47],[16,46]]] }, recurseType: '>' }
        ]
      },
      { id: 'nwr(properties:0)',
        recurse: [
          { id: 'nwr["b"](properties:21)', bounds: { type: 'Polygon', coordinates: [[[16,46],[17,46],[17,47],[16,47],[16,46]]] }, recurseType: '>' }
        ]
      },
      { id: 'node(properties:0)',
        recurse: [
          { id: 'nwr(properties:4)',
            recurse: [
              { id: 'nwr["a"](properties:21)', bounds: { type: 'Polygon', coordinates: [[[16,46],[17,46],[17,47],[16,47],[16,46]]] }, recurseType: '>' }
            ],
            recurseType: 'w'
          }
        ]
      },
      { id: 'node(properties:0)',
        recurse: [
          { id: 'nwr(properties:4)',
            recurse: [
              { id: 'nwr["b"](properties:21)', bounds: { type: 'Polygon', coordinates: [[[16,46],[17,46],[17,47],[16,47],[16,46]]] }, recurseType: '>' }
            ],
            recurseType: 'w'
          }
        ]
      }
    ])
  })
  it ('way;relation(bw:inner); - base filter: nwr(46,16,47,17)', function () {
    var f = new Filter('way;relation(bw:inner);')
    f.setBaseFilter('nwr(46,16,47,17)')

    assert.equal(f.toString(), 'nwr(46,16,47,17)->._base;way._base;relation(bw:"inner");')
    assert.equal(f.toQl(), 'nwr(46,16,47,17)->._base;way._base;relation(bw:"inner");')
    assert.equal(f.toQl({ setsUseStatementIds: true }), 'nwr(46,16,47,17)->._base;way._base->._1;relation(bw._1:"inner")->._2;')
    assert.equal(f.toQuery(), 'relation(bw._1:"inner")->._2;')
    assert.equal(f.toQuery({ statement: 1 }), '(nwr(46,16,47,17)->._1;)->._base;way._base->._1;')
    assert.deepEqual(f.recurse(), [
      { id: 1, role: 'inner', type: 'bw' }
    ])
    assert.deepEqual(f.recurse({ statement: 1 }), [])
    assert.deepEqual(f.getScript(), [
      { id: 1, recurse: [] },
      { id: 2, recurse: [
        { id: 1, role: 'inner', type: 'bw' }
      ]}
    ])
    assert.deepEqual(f.compileQuery(), {
      loki: { type: { '$eq': 'relation' } },
      query: 'relation(bw:"inner");',
      recurse: [
        {
          inputSet: '_',
          loki: { '$and': [ { type: { '$eq': 'way' } } ], needMatch: true },
          query: 'nwr(46,16,47,17)->._base;way._base;',
          type: 'bw'
        }
      ]
    })
    assert.deepEqual(f.toLokijs(), { type: { $eq: 'relation' } })
    var r = f.cacheDescriptors()
    assert.deepEqual(r, [
      {"id":"relation(properties:0)","recurse":[{"bounds":{"type":"Polygon","coordinates":[[[16,46],[17,46],[17,47],[16,47],[16,46]]]},"recurseType":"bw","role":"inner","id":"way(properties:16)"}]}
    ])
  })
})

;['via-file', 'via-server'].forEach(mode => {
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
        overpassFrontend.clearCache()
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
          expectedSubRequestCount: 1,
          expectedCacheDescriptors: [{
            "id": 'nwr(properties:0)',
            recurse: [{
              id: 'way["highway"="secondary"](properties:5)',
              recurseType: '>'
            }]
          }, {
            id: 'node(properties:0)',
            recurse: [{
              id: 'nwr(properties:4)',
              recurse: [{
                id: 'way["highway"="secondary"](properties:5)',
                recurseType: '>'
              }],
              recurseType: 'w'
            }]
          }]
        }, done)
      })
      it('nodes of way', function (done) {
        overpassFrontend.clearCache()
        test({
          mode,
          query: 'way["highway"];node(w);',
          bounds: {
            minlat: 48.19821,
            minlon: 16.33833,
            maxlat: 48.19830,
            maxlon: 16.33854
          },
          expected: [ "n2208875391", "n2213567988", "n2213567992", "n2213567995", "n2213567996", "n2213568000", "n2213568001", "n2213568003", "n270328331" , "n3037431653", "n3037431688", "n378459", "n378462", "n683894778" ],
          expectedSubRequestCount: 1,
          expectedCacheDescriptors: [{
            "id": 'node(properties:0)',
            recurse: [{
              id: 'way["highway"](properties:5)',
              recurseType: 'w'
            }]
          }]
        }, done)
      })
      it('nodes of way, chain query', function (done) {
        overpassFrontend.clearCache()
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
          expectedSubRequestCount: 1,
          expectedCacheDescriptors: [{
            "id": 'node["highway"](properties:1)',
            recurse: [{
              id: 'way["highway"](properties:5)',
              recurseType: 'w'
            }]
          }]
        }, done)
      })
      it('nodes of highway and railway ways', function (done) {
        overpassFrontend.clearCache()
        test({
          mode,
          query: 'way["highway"]->.a;way["railway"]->.b;node(w.a)(w.b);',
          bounds: {
            minlat: 48.19821,
            minlon: 16.33833,
            maxlat: 48.19830,
            maxlon: 16.33854
          },
          expected: [ 'n2208875391', 'n270328331' ],
          expectedSubRequestCount: 1,
          expectedCacheDescriptors: [{
            "id": 'node(properties:0)',
            recurse: [{
              id: 'way["highway"](properties:5)',
              recurseType: 'w'
            }, {
              id: 'way["railway"](properties:5)',
              recurseType: 'w'
            }]
          }]
        }, done)
      })
      it('nodes of highway and railway ways 2', function (done) {
        overpassFrontend.clearCache()
        test({
          mode,
          query: 'way["highway"];node(w)->.a;way["railway"];node.a(w);',
          bounds: {
            minlat: 48.19821,
            minlon: 16.33833,
            maxlat: 48.19830,
            maxlon: 16.33854
          },
          expected: [ 'n2208875391', 'n270328331' ],
          expectedSubRequestCount: 1,
          expectedCacheDescriptors: [{
            "id": 'node(properties:0)',
            recurse: [{
              id: 'way["highway"](properties:5)',
              recurseType: 'w'
            }, {
              id: 'way["railway"](properties:5)',
              recurseType: 'w'
            }]
          }]
        }, done)
      })
      it('recurse up', function (done) {
        overpassFrontend.clearCache()
        test({
          mode,
          query: 'node["highway"];<;',
          bounds: {
            minlat: 48.19839,
            minlon: 16.33901,
            maxlat: 48.19840,
            maxlon: 16.33902
          },
          expected: [ 'r1306478', 'r1530340', 'r1980077', 'r207109', 'r207110', 'r3636229', 'r3967946', 'r5275276', 'w146678747', 'w162373026', 'w170141442', 'w26738920', 'w366446524', 'w4583442' ],
          expectedSubRequestCount: 1,
          expectedCacheDescriptors: [{
            "id": 'nwr(properties:4)',
            recurse: [{
              id: 'node["highway"](properties:1)',
              recurseType: '<'
            }]
          }, {
            id: 'relation(properties:4)',
            recurse: [{
              id: 'nwr(properties:4)',
              recurse: [{
                id: 'node["highway"](properties:1)',
                recurseType: '<'
              }],
              recurseType: 'br'
            }]
          }]
        }, done)
      })
      it('recurse up, relation only', function (done) {
        overpassFrontend.clearCache()
        test({
          mode,
          query: 'node["highway"];<;relation._;',
          bounds: {
            minlat: 48.19839,
            minlon: 16.33901,
            maxlat: 48.19840,
            maxlon: 16.33902
          },
          expected: [ 'r1306478', 'r1530340', 'r1980077', 'r207109', 'r207110', 'r3636229', 'r3967946', 'r5275276' ],
          noRecurse: true, // TODO: to make caching for 'recurse up' work, we have to load intermediate ways too.
          expectedSubRequestCount: 1,
          expectedCacheDescriptors: [{
            "id": 'relation(properties:4)',
            recurse: [{
              id: 'node["highway"](properties:1)',
              recurseType: '<'
            }]
          }, {
            id: 'relation(properties:4)',
            recurse: [{
              id: 'nwr(properties:4)',
              recurse: [{
                id: 'node["highway"](properties:1)',
                recurseType: '<'
              }],
              recurseType: 'br'
            }]
          }]
        }, done)
      })
/*    TODO: cache descriptors creates bug
      it('or1', function (done) {
        test({
          mode,
          query: '(way["highway"="secondary"];node(w););',
          bounds: {
            minlat: 48.19821,
            minlon: 16.33835,
            maxlat: 48.19827,
            maxlon: 16.33841
          },
          expected: [ 'w4583442', 'n378459', 'n378462', 'n270328331', 'n2208875391', 'n2213568001', 'n3037431653', 'n3037431688' ],
          expectedSubRequestCount: 0,
          expectedCacheDescriptors: [{
            "id": 'way["highway"="secondary"](properties:1)',
          }, {
            "id": '-["highway"="secondary"](properties:1)', // TODO: WRONG!
          }]
        }, done)
      }) */
    })
  })
})

function test (options, callback) {
  if (options.mode === 'via-server') {
    console.log(options.rek ? '2nd run' : '1st run')
  }

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

      if (!options.noRecurse && !options.rek) {
        options.rek = true
        options.expectedSubRequestCount = 0
        return test(options, callback)
      }

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
