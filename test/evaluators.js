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
    const expectedCompiled = 't["name"]=="foo"'
    const expectedLokiQuery = [
      'tags.name',
      { $eq: 'foo' }
    ]

    assert.deepEqual(eval.data, expected)
    assert.equal(str, '')

    const result = eval.exec({ tags: { name: 'foo' } })
    assert.equal(result, expectedResult)

    assert.equal(eval.toString(), expectedCompiled)
    assert.deepEqual(eval.compileLokiJS(), expectedLokiQuery)
  })

  it ('t["width"] < 10.5', function () {
    const eval = new Evaluator()
    const str = eval.parse('t["width"] < 10.5')
    const expected = {
      op: '<',
      left: { fun: 'tag', parameters: [ 'width' ] },
      right: 10.5
    }
    const expectedResult = true
    const expectedCompiled = 't["width"]<10.5'
    const expectedLokiQuery = [
      'tags.width',
      { $lt: 10.5 }
    ]

    assert.deepEqual(eval.data, expected)
    assert.equal(str, '')

    const result = eval.exec({ tags: { width: '5' } })
    assert.equal(result, expectedResult)

    assert.equal(eval.toString(), expectedCompiled)
    assert.deepEqual(eval.compileLokiJS(), expectedLokiQuery)
  })

  it ('"10.5" >= t["width"]', function () {
    const eval = new Evaluator()
    const str = eval.parse('"10.5">=t["width"]')
    const expected = {
      op: '>=',
      right: { fun: 'tag', parameters: [ 'width' ] },
      left: "10.5"
    }
    const expectedResult = true
    const expectedCompiled = '"10.5">=t["width"]'
    const expectedLokiQuery = [
      'tags.width',
      { $lte: "10.5" }
    ]

    assert.deepEqual(eval.data, expected)
    assert.equal(str, '')

    const result = eval.exec({ tags: { width: '5' } })
    assert.equal(result, expectedResult)

    assert.equal(eval.toString(), expectedCompiled)
    assert.deepEqual(eval.compileLokiJS(), expectedLokiQuery)
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
    const expectedCompiled = 't["name"]==t["operator"]'
    const expectedLokiQuery = [null, null, true]

    assert.deepEqual(eval.data, expected)
    assert.equal(str, '')

    const result = eval.exec({ tags: { name: 'foo' } })
    assert.equal(result, expectedResult)

    assert.equal(eval.toString(), expectedCompiled)
    assert.deepEqual(eval.compileLokiJS(), expectedLokiQuery)
  })

  it ('1 < 2', function () {
    const eval = new Evaluator()
    const str = eval.parse('1 < 2')
    const expected = {
      op: '<',
      left: 1,
      right: 2
    }
    const expectedResult = true
    const expectedCompiled = '1<2'

    assert.deepEqual(eval.data, expected)
    assert.equal(str, '')

    const result = eval.exec({ tags: { name: 'foo' } })
    assert.equal(result, expectedResult)

    assert.equal(eval.toString(), expectedCompiled)
  })

  it ('2 <= 2', function () {
    const eval = new Evaluator()
    const str = eval.parse('2 <= 2')
    const expected = {
      op: '<=',
      left: 2,
      right: 2
    }
    const expectedResult = true
    const expectedCompiled = '2<=2'

    assert.deepEqual(eval.data, expected)
    assert.equal(str, '')

    const result = eval.exec({ tags: { name: 'foo' } })
    assert.equal(result, expectedResult)

    assert.equal(eval.toString(), expectedCompiled)
  })

  it ('1 || !1', function () {
    const eval = new Evaluator()
    const str = eval.parse('1 || !1')
    const expected = {
      op: '||',
      left: 1,
      right: {
        left: null,
        op: '!',
        right: 1
      }
    }
    const expectedResult = 1
    const expectedCompiled = '1||!1'

    assert.deepEqual(eval.data, expected)
    assert.equal(str, '')

    const result = eval.exec({ tags: { name: 'foo' } })
    assert.equal(result, expectedResult)

    assert.equal(eval.toString(), expectedCompiled)
  })

  it ('t["name"] == "foo" || t["name"] == "bar"', function () {
    const eval = new Evaluator()
    const str = eval.parse('t["name"] == "foo" || t["name"] == "bar"')
    const expected = {
      op: '||',
      left: {
        left: {
          fun: 'tag',
          parameters: ['name']
        },
        op: '==',
        right: 'foo'
      },
      right: {
        left: {
          fun: 'tag',
          parameters: ['name']
        },
        op: '==',
        right: 'bar'
      },
    }
    const expectedResult = true
    const expectedCompiled = 't["name"]=="foo"||t["name"]=="bar"'
    const expectedLokiQuery = [
      '$or', [
        { 'tags.name': { $eq: 'foo' } },
        { 'tags.name': { $eq: 'bar' } }
      ],
      false 
    ]

    assert.deepEqual(eval.data, expected)
    assert.equal(str, '')

    const result = eval.exec({ tags: { name: 'foo' } })
    assert.equal(result, expectedResult)

    assert.equal(eval.toString(), expectedCompiled)
    assert.deepEqual(eval.compileLokiJS(), expectedLokiQuery)
  })

  it ('t["name"] == "foo" && t["name"] == "bar"', function () {
    const eval = new Evaluator()
    const str = eval.parse('t["name"] == "foo" && t["name"] == "bar"')
    const expected = {
      op: '&&',
      left: {
        left: {
          fun: 'tag',
          parameters: ['name']
        },
        op: '==',
        right: 'foo'
      },
      right: {
        left: {
          fun: 'tag',
          parameters: ['name']
        },
        op: '==',
        right: 'bar'
      },
    }
    const expectedResult = false
    const expectedCompiled = 't["name"]=="foo"&&t["name"]=="bar"'
    const expectedLokiQuery = [
      '$and', [
        { 'tags.name': { $eq: 'foo' } },
        { 'tags.name': { $eq: 'bar' } }
      ],
      false
    ]

    assert.deepEqual(eval.data, expected)
    assert.equal(str, '')

    const result = eval.exec({ tags: { name: 'foo' } })
    assert.equal(result, expectedResult)

    assert.equal(eval.toString(), expectedCompiled)
    assert.deepEqual(eval.compileLokiJS(), expectedLokiQuery)
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
    const expectedCompiled = '"test"+2'

    assert.deepEqual(eval.data, expected)
    assert.equal(str, '')

    const result = eval.exec({ tags: { name: 'foo' } })
    assert.equal(result, expectedResult)

    assert.equal(eval.toString(), expectedCompiled)
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
    const expectedCompiled = '2.5+3*4'

    assert.deepEqual(eval.data, expected)
    assert.equal(str, '')

    const result = eval.exec({ tags: { name: 'foo' } })
    assert.equal(result, expectedResult)

    assert.equal(eval.toString(), expectedCompiled)
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
    const expectedCompiled = '(2.5+3)*4'

    assert.deepEqual(eval.data, expected)
    assert.equal(str, '')

    const result = eval.exec({ tags: { name: 'foo' } })
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
    const expectedCompiled = '1+2.5+3*4'

    assert.deepEqual(eval.data, expected)
    assert.equal(str, '')

    const result = eval.exec({ tags: { name: 'foo' } })
    assert.equal(result, expectedResult)

    assert.equal(eval.toString(), expectedCompiled)
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
    const expectedCompiled = '2.5*3+4'

    assert.deepEqual(eval.data, expected)
    assert.equal(str, '')

    const result = eval.exec({ tags: { name: 'foo' } })
    assert.equal(result, expectedResult)

    assert.equal(eval.toString(), expectedCompiled)
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
    const expectedCompiled = '2.5-3+4'

    assert.deepEqual(eval.data, expected)
    assert.equal(str, '')

    const result = eval.exec({ tags: { name: 'foo' } })
    assert.equal(result, expectedResult)

    assert.equal(eval.toString(), expectedCompiled)
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
    const expectedCompiled = '2.5*3+4*5'

    assert.deepEqual(eval.data, expected)
    assert.equal(str, '')

    const result = eval.exec({ tags: { name: 'foo' } })
    assert.equal(result, expectedResult)

    assert.equal(eval.toString(), expectedCompiled)
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
    const expectedCompiled = '-1*-3'

    assert.deepEqual(eval.data, expected)
    assert.equal(str, '')

    const result = eval.exec({ tags: { name: 'foo' } })
    assert.equal(result, expectedResult)

    assert.equal(eval.toString(), expectedCompiled)
  })

  it ('-(1 * 3)', function () {
    const eval = new Evaluator()
    const str = eval.parse('-(1 * 3)')
    const expected = {
      left: null,
      op: '—',
      right: {
        fun: '',
        parameters: [
          {
            left: 1,
            op: '*',
            right: 3
          }
        ]
      }
    }
    const expectedResult = -3
    const expectedCompiled = '-(1*3)'

    assert.deepEqual(eval.data, expected)
    assert.equal(str, '')

    const result = eval.exec({ tags: { name: 'foo' } })
    assert.equal(result, expectedResult)

    assert.equal(eval.toString(), expectedCompiled)
  })

  it ('2 + -(1 * 3)', function () {
    const eval = new Evaluator()
    const str = eval.parse('2 + -(1 * 3)')
    const expected = {
      left: 2,
      op: '+',
      right: {
        left: null,
        op: '—',
        right: {
          fun: '',
          parameters: [
            {
              left: 1,
              op: '*',
              right: 3
            }
          ]
        }
      }
    }
    const expectedResult = -1
    const expectedCompiled = '2+-(1*3)'

    assert.deepEqual(eval.data, expected)
    assert.equal(str, '')

    const result = eval.exec({ tags: { name: 'foo' } })
    assert.equal(result, expectedResult)

    assert.equal(eval.toString(), expectedCompiled)
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
    const expectedCompiled = '!1'

    assert.deepEqual(eval.data, expected)
    assert.equal(str, '')

    const result = eval.exec({ tags: { name: 'foo' } })
    assert.equal(result, expectedResult)

    assert.equal(eval.toString(), expectedCompiled)
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
    const expectedCompiled = '!1+!0'

    assert.deepEqual(eval.data, expected)
    assert.equal(str, '')

    const result = eval.exec({ tags: { name: 'foo' } })
    assert.equal(result, expectedResult)

    assert.equal(eval.toString(), expectedCompiled)
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
    const expectedCompiled = 't["name"+3]+"bar"'

    assert.deepEqual(eval.data, expected)
    assert.equal(str, '')

    const result = eval.exec({ tags: { name3: 'foo' } })
    assert.equal(result, expectedResult)

    assert.equal(eval.toString(), expectedCompiled)
  })

  it ('"name")', function () {
    const eval = new Evaluator()
    const str = eval.parse('"name")')
    const expected = 'name'
    const expectedResult = "name"
    const expectedCompiled = '"name"'

    assert.deepEqual(eval.data, expected)
    assert.equal(str, ')')

    const result = eval.exec({ tags: { name3: 'foo' } })
    assert.equal(result, expectedResult)

    assert.equal(eval.toString(), expectedCompiled)
  })

  it ('count_tags()', function () {
    const eval = new Evaluator()
    const str = eval.parse('count_tags()')
    const expected = {
      fun: 'count_tags',
      parameters: []
    }
    const expectedResult = 1
    const expectedCompiled = 'count_tags()'

    assert.deepEqual(eval.data, expected)
    assert.equal(str, '')

    // object with one tag
    let result = eval.exec({ tags: { name3: 'foo' } })
    assert.equal(result, expectedResult)
    // object with no tags
    result = eval.exec({ tags: {} })
    assert.equal(result, 0)
    // without loaded tags
    result = eval.exec({})
    assert.equal(result, null)

    assert.equal(eval.toString(), expectedCompiled)
  })

  it ('id()', function () {
    const eval = new Evaluator()
    const str = eval.parse('id() == 377992')
    const expected = {
      left: {
        fun: 'id',
        parameters: []
      },
      op: '==',
      right: 377992
    }
    const expectedResult = true
    const expectedCompiled = 'id()==377992'
    const expectedLokiQuery = [
      'osm_id',
      { $eq: 377992 }
    ]

    assert.deepEqual(eval.data, expected)
    assert.equal(str, '')

    let result = eval.exec({ id: 'n377992', osm_id: 377992, type: 'node' })
    assert.equal(result, expectedResult)
    result = eval.exec({ id: 'n377998', osm_id: 377998, type: 'node' })
    assert.equal(result, false)

    assert.equal(eval.toString(), expectedCompiled)
    assert.deepEqual(eval.compileLokiJS(), expectedLokiQuery)
  })

  it ('id() && type', function () {
    const eval = new Evaluator()
    const str = eval.parse('id() == 377992 && type() == "node"')
    const expected = {
      left: {
        left: {
          fun: 'id',
          parameters: []
        },
        op: '==',
        right: 377992
      },
      op: '&&',
      right: {
        left: {
          fun: 'type',
          parameters: []
        },
        op: '==',
        right: 'node'
      }
    }
    const expectedResult = true
    const expectedCompiled = 'id()==377992&&type()=="node"'
    const expectedLokiQuery = [
      '$and', [
        { 'osm_id': { $eq: 377992 } },
        { 'type': { $eq: 'node' } },
      ], false
    ]

    assert.deepEqual(eval.data, expected)
    assert.equal(str, '')

    let result = eval.exec({ id: 'n377992', osm_id: 377992, type: 'node' })
    assert.equal(result, expectedResult)
    result = eval.exec({ id: 'n377998', osm_id: 377998, type: 'node' })
    assert.equal(result, false)

    assert.equal(eval.toString(), expectedCompiled)
    assert.deepEqual(eval.compileLokiJS(), expectedLokiQuery)
  })
})
