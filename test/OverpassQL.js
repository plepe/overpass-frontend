const assert = require('assert')

const OverpassQL = require('../src/OverpassQL')
describe('OverpassQL parser', function () {
  it('script 1', function () {
    const result = OverpassQL.parse('node[name=foo];way[foo=bar];out;')
    const expected = [
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
      },
      {
        type: 'out',
        input: '_',
        parameters: ''
      }
    ]

    assert.deepEqual(result, expected)
  })

  it('script 2', function () {
    const result = OverpassQL.parse('(node[name=foo];way[foo=bar];);out;')
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
        parameters: ''
      }
    ]

    assert.deepEqual(result, expected)
  })

  it('script 3', function () {
    const result = OverpassQL.parse('node.a[name=foo]->.a;way.a.bcd[foo=bar]->.b;.a out;')
    console.log(JSON.stringify(result, null, '  '))
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
        parameters: ''
      }
    ]

    assert.deepEqual(result, expected)
  })
})
