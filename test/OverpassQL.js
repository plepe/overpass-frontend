const assert = require('assert')

const OverpassQL = require('../src/OverpassQL')
describe('OverpassQL parser', function () {
  it('script 1', function () {
    const result = OverpassQL.parse('node[name=foo];way[foo=bar];out;')
    const expected = [
      {
        type: 'query',
        query: [
          { type: 'node' },
          { key: 'name', op: '=', value: 'foo' }
        ]
      },
      {
        type: 'query',
        query: [
          { type: 'way' },
          { key: 'foo', op: '=', value: 'bar' }
        ]
      },
      {
        type: 'out',
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
        statements: [
          {
            type: 'query',
            query: [
              { type: 'node' },
              { key: 'name', op: '=', value: 'foo' }
            ]
          },
          {
            type: 'query',
            query: [
              { type: 'way' },
              { key: 'foo', op: '=', value: 'bar' }
            ]
          }
        ]
      },
      {
        type: 'out',
        parameters: ''
      }
    ]

    assert.deepEqual(result, expected)
  })
})
