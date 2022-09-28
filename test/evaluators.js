const assert = require('assert').strict

const parseEvaluators = require('../src/parseEvaluators')
const execEvaluators = require('../src/execEvaluators')

describe('parseEvaluators()', function () {
  it ('t["name"] == "foo"', function () {
    const actual = parseEvaluators('t["name"] == "foo"')
    const expected = {
      op: '==',
      left: { fun: 'tag', parameters: [ 'name' ] },
      right: 'foo'
    }
    const expectedResult = true

    assert.deepEqual(actual, expected)

    const result = execEvaluators(actual, { name: 'foo' })
    assert.equal(result, expectedResult)
  })

  it ('t["name"] == t["operator"]', function () {
    const actual = parseEvaluators('t["name"] == t["operator"]')
    const expected = {
      op: '==',
      left: { fun: 'tag', parameters: [ 'name' ] },
      right: { fun: 'tag', parameters: [ 'operator' ] },
    }
    const expectedResult = false

    assert.deepEqual(actual, expected)

    const result = execEvaluators(actual, { name: 'foo' })
    assert.equal(result, expectedResult)
  })

  it ('2.5 + 3 * 4', function () {
    const actual = parseEvaluators('2.5 + 3 * 4')
    const expected = {
      op: '+',
      left: 2.5,
      right: {
        left: 3,
        op: '*',
        right: 4
      },
    }
    const expectedResult = 14.5

    assert.deepEqual(actual, expected)

    const result = execEvaluators(actual, { name: 'foo' })
    assert.equal(result, expectedResult)
  })

  it ('1 + 2.5 + 3 * 4', function () {
    const actual = parseEvaluators('1 + 2.5 + 3 * 4')
    const expected = {
      op: '+',
      left: {
        left: 1,
        op: '+',
        right: 2.5
      },
      right: {
        left: 3,
        op: '*',
        right: 4
      }
    }
    const expectedResult = 15.5

    assert.deepEqual(actual, expected)

    const result = execEvaluators(actual, { name: 'foo' })
    assert.equal(result, expectedResult)
  })

  it ('2.5 * 3 + 4', function () {
    const actual = parseEvaluators('2.5 * 3 + 4')
    const expected = {
      op: '+',
      left: {
        op: '*',
        left: 2.5,
        right: 3
      },
      right: 4,
    }
    const expectedResult = 11.5

    assert.deepEqual(actual, expected)

    const result = execEvaluators(actual, { name: 'foo' })
    assert.equal(result, expectedResult)
  })

  it ('2.5 - 3 + 4', function () {
    const actual = parseEvaluators('2.5 - 3 + 4')
    const expected = {
      op: '+',
      left: { op: '-',
        left: 2.5,
        right: 3
      },
      right: 4
    }
    const expectedResult = 3.5

    assert.deepEqual(actual, expected)

    const result = execEvaluators(actual, { name: 'foo' })
    assert.equal(result, expectedResult)
  })

  it ('2.5 * 3 + 4 * 5', function () {
    const actual = parseEvaluators('2.5 * 3 + 4 * 5')
    const expected = {
      left: {
        left: 2.5,
        op: '*',
        right: 3
      },
      op: '+',
      right: {
        left: 4,
        op: '*',
        right: 5
      }
    }
    const expectedResult = 27.5

    assert.deepEqual(actual, expected)

    const result = execEvaluators(actual, { name: 'foo' })
    assert.equal(result, expectedResult)
  })
})
