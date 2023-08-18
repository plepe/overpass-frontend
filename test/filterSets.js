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

    assert.deepEqual(f.def, [
      {"op":"has_key","key":"amenity"},
    ])
    assert.equal(f.toString(), 'nwr["amenity"];')
    assert.equal(f.toQl(), 'nwr["amenity"];')
    assert.deepEqual(f.toLokijs(), {
      "tags.amenity": { $exists: true }
    })
    var r = f.cacheDescriptors()
    assert.deepEqual(r, [ { id: 'nwr["amenity"](properties:1)' }])
  })
  it ('nwr[amenity]->.a;', function () {
    var f = new Filter('nwr[amenity]->.a;')

    assert.deepEqual(f.def,
      [
        {"op":"has_key","key":"amenity"},
        {"outputSet":"a"}
      ]
    )
    assert.equal(f.toString(), 'nwr["amenity"]->.a;')
    assert.equal(f.toQl(), 'nwr["amenity"]->.a;')
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

    assert.deepEqual(f.def, {
      or: [
        [ {"op":"has_key","key":"amenity"} ],
        {"outputSet":"a"}
      ]
    })
    assert.equal(f.toString(), '((nwr["amenity"];);)->.a;')
    assert.equal(f.toQl(), '((nwr["amenity"];);)->.a;')
    assert.deepEqual(f.toLokijs(), {
      "tags.amenity": { $exists: true }
    })
    var r = f.cacheDescriptors()
    assert.deepEqual(r, [ { id: 'nwr["amenity"](properties:1)' } ])
  })
  it ('(nwr[amenity]->.a;);', function () {
    var f = new Filter('(nwr[amenity]->.a;);')

    assert.deepEqual(f.def, {
      or: [
        [ {"op":"has_key","key":"amenity"},
          {"outputSet":"a"}
        ]
      ]
    })
    assert.equal(f.toString(), '(nwr["amenity"]->.a;);')
    assert.equal(f.toQl(), '(nwr["amenity"]->.a;);')
    assert.deepEqual(f.toLokijs(), {
      $or: [{
        "tags.amenity": { $exists: true }
      }]
    })
    var r = f.cacheDescriptors()
    assert.deepEqual(r, [ { id: 'nwr["amenity"](properties:1)' } ])
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

    assert.deepEqual(f.def, {
      or: [
        [ {"op":"has_key","key":"a"}, {"outputSet":"a"} ],
        { or: [
          [ {"op":"has_key","key":"b"}, {"outputSet":"b"} ],
          [ { inputSet: "a" }, {"op":"has_key","key":"b"} ],
        ]}
      ]
    })
    assert.equal(f.toString(), '(nwr["a"]->.a;(nwr["b"]->.b;nwr.a["b"];););')
    assert.equal(f.toQl(), '(nwr["a"]->.a;(nwr["b"]->.b;nwr.a["b"];););')
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

    assert.deepEqual(f.def, {
      or: [
        [ {"op":"has_key","key":"a"}, {"outputSet":"a"} ],
        { or: [
          [ {"op":"has_key","key":"b"}, {"outputSet":"b"} ],
          [ { inputSet: "a" }, {"op":"has_key","key":"b"} ],
        ]},
        {"outputSet":"a"}
      ]
    })
    assert.equal(f.toString(), '((nwr["a"]->.a;(nwr["b"]->.b;nwr.a["b"];););)->.a;')
    assert.equal(f.toQl(), '((nwr["a"]->.a;(nwr["b"]->.b;nwr.a["b"];););)->.a;')
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

    assert.deepEqual(f.def,
      [
        {"inputSet":"a"},
        {"op":"has_key","key":"amenity"}
      ]
    )
    assert.equal(f.toString(), 'nwr.a["amenity"];')
    assert.equal(f.toQl(), 'nwr.a["amenity"];')
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

    assert.deepEqual(f.def,
      [
        {"inputSet":"a"},
        {"inputSet":"b"},
        {"op":"has_key","key":"amenity"}
      ]
    )
    assert.equal(f.toString(), 'nwr.a.b["amenity"];')
    assert.equal(f.toQl(), 'nwr.a.b["amenity"];')
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
    assert.deepEqual(f.toLokijs(), {
      recurse: '>',
      query: {
        "tags.amenity": { $exists: true }
      }
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
    assert.deepEqual(f.toLokijs(), {
      recurse: '>',
      query: {
        "tags.amenity": { $exists: true }
      }
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
    assert.deepEqual(f.toLokijs(), {
      $not: true
    })
    assert.deepEqual(f.toLokijs({set: 'a'}), {
      "tags.amenity": { $exists: true }
    })
    assert.deepEqual(f.toLokijs({set: 'b'}), {
      recurse: '>',
      query: {
        "tags.amenity": { $exists: true }
      }
    })
    var r = f.cacheDescriptors()
    assert.deepEqual(r, [ ])
  })
})

;['via-server', 'via-file'].forEach(mode => {
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
    null,
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

      assert.equal(request.filterQuery.toString(), options.expectedQuery || options.query + ';')
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
