const assert = require('assert').strict

const parseEvaluators = require('../src/parseEvaluators')

describe('parseEvaluators()', function () {
  it ('t["name"] == "foo"', function () {
    const actual = parseEvaluators('t["name"] == "foo"')
    const expected = {
      op: '==',
      left: { fun: 'tag', parameters: [ 'name' ] },
      right: 'foo'
    }

    assert.deepEqual(actual, expected)
  })

  it ('t["name"] == t["operator"]', function () {
    const actual = parseEvaluators('t["name"] == t["operator"]')
    const expected = {
      op: '==',
      left: { fun: 'tag', parameters: [ 'name' ] },
      right: { fun: 'tag', parameters: [ 'operator' ] },
    }

    assert.deepEqual(actual, expected)
  })
})
