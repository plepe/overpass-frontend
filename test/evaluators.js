const assert = require('assert').strict

const Evaluator = require('../src/Evaluator')

describe('evaluators', function () {
  it ('t["name"] == "foo"', function () {
    const eval = new Evaluator()
    const str = eval.parse('t["name"] == "foo"')
    const expected = {
      op: '==',
      left: { fun: 'tag', parameters: [ 'name' ] },
      right: 'foo'
    }
    const expectedResult = true

    assert.deepEqual(eval.data, expected)
    assert.equal(str, '')

    const result = eval.exec({ name: 'foo' })
    assert.equal(result, expectedResult)
  })

  it ('t["name"] == t["operator"]', function () {
    const eval = new Evaluator()
    const str = eval.parse('t["name"] == t["operator"]')
    const expected = {
      op: '==',
      left: { fun: 'tag', parameters: [ 'name' ] },
      right: { fun: 'tag', parameters: [ 'operator' ] },
    }
    const expectedResult = false

    assert.deepEqual(eval.data, expected)
    assert.equal(str, '')

    const result = eval.exec({ name: 'foo' })
    assert.equal(result, expectedResult)
  })

  it ('"test" + 2', function () {
    const eval = new Evaluator()
    const str = eval.parse('"test" + 2')
    const expected = {
      op: '+',
      left: 'test',
      right: 2
    }
    const expectedResult = 'test2'

    assert.deepEqual(eval.data, expected)
    assert.equal(str, '')

    const result = eval.exec({ name: 'foo' })
    assert.equal(result, expectedResult)
  })

  it ('2.5 + 3 * 4', function () {
    const eval = new Evaluator()
    const str = eval.parse('2.5 + 3 * 4')
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

    assert.deepEqual(eval.data, expected)
    assert.equal(str, '')

    const result = eval.exec({ name: 'foo' })
    assert.equal(result, expectedResult)
  })

  it ('(2.5 + 3) * 4', function () {
    const eval = new Evaluator()
    const str = eval.parse('(2.5 + 3) * 4')
    const expected = {
      left: {
        fun: '',
        parameters: [
          {
            left: 2.5,
            op: '+',
            right: 3
          }
        ]
      },
      op: '*',
      right: 4
    }
    const expectedResult = 22

    assert.deepEqual(eval.data, expected)
    assert.equal(str, '')

    const result = eval.exec({ name: 'foo' })
    assert.equal(result, expectedResult)
  })

  it ('1 + 2.5 + 3 * 4', function () {
    const eval = new Evaluator()
    const str = eval.parse('1 + 2.5 + 3 * 4')
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

    assert.deepEqual(eval.data, expected)
    assert.equal(str, '')

    const result = eval.exec({ name: 'foo' })
    assert.equal(result, expectedResult)
  })

  it ('2.5 * 3 + 4', function () {
    const eval = new Evaluator()
    const str = eval.parse('2.5 * 3 + 4')
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

    assert.deepEqual(eval.data, expected)
    assert.equal(str, '')

    const result = eval.exec({ name: 'foo' })
    assert.equal(result, expectedResult)
  })

  it ('2.5 - 3 + 4', function () {
    const eval = new Evaluator()
    const str = eval.parse('2.5 - 3 + 4')
    const expected = {
      op: '+',
      left: { op: '-',
        left: 2.5,
        right: 3
      },
      right: 4
    }
    const expectedResult = 3.5

    assert.deepEqual(eval.data, expected)
    assert.equal(str, '')

    const result = eval.exec({ name: 'foo' })
    assert.equal(result, expectedResult)
  })

  it ('2.5 * 3 + 4 * 5', function () {
    const eval = new Evaluator()
    const str = eval.parse('2.5 * 3 + 4 * 5')
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

    assert.deepEqual(eval.data, expected)
    assert.equal(str, '')

    const result = eval.exec({ name: 'foo' })
    assert.equal(result, expectedResult)
  })

  it ('-1 * -3', function () {
    const eval = new Evaluator()
    const str = eval.parse('-1 * -3')
    const expected = {
      left: -1,
      op: '*',
      right: -3
    }
    const expectedResult = 3

    assert.deepEqual(eval.data, expected)
    assert.equal(str, '')

    const result = eval.exec({ name: 'foo' })
    assert.equal(result, expectedResult)
  })

  it ('!1', function () {
    const eval = new Evaluator()
    const str = eval.parse('!1')
    const expected = {
      left: null,
      op: '!',
      right: 1,
    }
    const expectedResult = 0

    assert.deepEqual(eval.data, expected)
    assert.equal(str, '')

    const result = eval.exec({ name: 'foo' })
    assert.equal(result, expectedResult)
  })

  it ('!1 + !0', function () {
    const eval = new Evaluator()
    const str = eval.parse('!1 + !0')
    const expected = {
      left: {
        left: null,
        op: '!',
        right: 1,
      },
      op: '+',
      right: {
        left: null,
        op: '!',
        right: 0
      }
    }
    const expectedResult = 1

    assert.deepEqual(eval.data, expected)
    assert.equal(str, '')

    const result = eval.exec({ name: 'foo' })
    assert.equal(result, expectedResult)
  })

  it ('tag("name" + 3) + "bar"', function () {
    const eval = new Evaluator()
    const str = eval.parse('tag("name" + 3) + "bar"')
    const expected = {
      left: {
        fun: 'tag',
        parameters: [
          {
            left: 'name',
            op: '+',
            right: 3
          }
        ]
      },
      op: '+',
      right: 'bar'
    }
    const expectedResult = "foobar"

    assert.deepEqual(eval.data, expected)
    assert.equal(str, '')

    const result = eval.exec({ name3: 'foo' })
    assert.equal(result, expectedResult)
  })

  it ('"name")', function () {
    const eval = new Evaluator()
    const str = eval.parse('"name")')
    const expected = 'name'
    const expectedResult = "name"

    assert.deepEqual(eval.data, expected)
    assert.equal(str, ')')

    const result = eval.exec({ name3: 'foo' })
    assert.equal(result, expectedResult)
  })
})
