const assert = require('assert')

const loadTestData = require('./src/loadTestData')

const OverpassQL = require('../src/OverpassQL')
const OverpassFrontend = require('../src/OverpassFrontend')

let overpassFrontend

describe('OverpassQL parser', function () {
  it('load local file', function (done) {
    this.timeout(20000)
    loadTestData((err, result) => {
      overpassFrontend = result
      done(err)
    })
  })

  it('load local file', function (done) {
    this.timeout(20000)
    overpassFrontend = new OverpassFrontend('test/data.osm.bz2')
    overpassFrontend.once('load', () => done())
  })

  it('script 1', function () {
    const query = new OverpassQL('node[historic];out;way[amenity=restaurant];out;', overpassFrontend)
    let result = query.script
    const expected = [
      {
        type: 'query',
        output: '_',
        query: [
          { type: 'node' },
          { key: 'historic', op: 'has_key' }
        ]
      },
      {
        type: 'out',
        input: '_',
        parameters: {}
      },
      {
        type: 'query',
        output: '_',
        query: [
          { type: 'way' },
          { key: 'amenity', op: '=', value: 'restaurant' }
        ]
      },
      {
        type: 'out',
        input: '_',
        parameters: {}
      }
    ]

    assert.deepEqual(result, expected)

    result = query.execCache()
    // expected =

    console.log(JSON.stringify(expected, null, '  '))
  })

  it('script 2', function () {
    const query = new OverpassQL('(node[name=foo];way[foo=bar];);out ids;out 5 meta;')
    const result = query.script
    const expected = [
      {
        type: 'union',
        output: '_',
        statements: [
          {
            type: 'query',
            output: '_',
            query: [
              { type: 'node' },
              { key: 'name', op: '=', value: 'foo' }
            ]
          },
          {
            type: 'query',
            output: '_',
            query: [
              { type: 'way' },
              { key: 'foo', op: '=', value: 'bar' }
            ]
          }
        ]
      },
      {
        type: 'out',
        input: '_',
        parameters: { ids: true }
      },
      {
        type: 'out',
        input: '_',
        count: 5,
        parameters: { meta: true }
      }
    ]

    assert.deepEqual(result, expected)
  })

  it('script 3', function () {
    const query = new OverpassQL('node.a[name=foo]->.a;way.a.bcd[foo=bar]->.b;.a out;')
    const result = query.script
    const expected = [
      {
        type: 'query',
        output: 'a',
        query: [
          { type: 'node', input: ['a'] },
          { key: 'name', op: '=', value: 'foo' }
        ]
      },
      {
        type: 'query',
        output: 'b',
        query: [
          { type: 'way', input: ['a', 'bcd'] },
          { key: 'foo', op: '=', value: 'bar' }
        ]
      },
      {
        type: 'out',
        input: 'a',
        parameters: {}
      }
    ]

    assert.deepEqual(result, expected)
  })
})
