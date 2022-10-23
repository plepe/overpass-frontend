const assert = require('assert').strict

const OverpassFrontend = require('../src/defines')
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
    const expectedLokiQuery = {
      'tags.name': { $eq: 'foo' }
    }
    const expectedCacheDescriptors = [
      { filters: '(if:t["name"]=="foo")', properties: OverpassFrontend.TAGS }
    ]

    assert.deepEqual(eval.toJSON(), expected)
    assert.equal(str, '')

    const result = eval.exec({ tags: { name: 'foo' } })
    assert.equal(result, expectedResult)

    assert.equal(eval.toString(), expectedCompiled)
    assert.deepEqual(eval.toValue(), null)
    assert.deepEqual(eval.compileLokiJS(), expectedLokiQuery)

    const descriptors = [{filters: ''}]
    eval.cacheDescriptors(descriptors)
    assert.deepEqual(descriptors, expectedCacheDescriptors)
  })

  it ('t["name"]', function () {
    const eval = new Evaluator()
    const str = eval.parse('t["name"]')
    const expected = { fun: 'tag', parameters: [ 'name' ] }
    const expectedResult = 'foo'
    const expectedCompiled = 't["name"]'
    const expectedLokiQuery = {
      'tags.name': { $exists: true }
    }
    const expectedCacheDescriptors = [
      { filters: '(if:t["name"])', properties: OverpassFrontend.TAGS }
    ]

    assert.deepEqual(eval.toJSON(), expected)
    assert.equal(str, '')

    const result = eval.exec({ tags: { name: 'foo' } })
    assert.equal(result, expectedResult)

    assert.equal(eval.toString(), expectedCompiled)
    assert.deepEqual(eval.toValue(), null)
    assert.deepEqual(eval.compileLokiJS(), expectedLokiQuery)

    const descriptors = [{filters: ''}]
    eval.cacheDescriptors(descriptors)
    assert.deepEqual(descriptors, expectedCacheDescriptors)
  })

  it ('t["name"] || t["operator"]', function () {
    const eval = new Evaluator()
    const str = eval.parse('t["name"] || t["operator"]')
    const expected = {
      op: '||',
      left: { fun: 'tag', parameters: [ 'name' ] },
      right: { fun: 'tag', parameters: [ 'operator' ] }
    }
    const expectedResult = 'foo'
    const expectedCompiled = 't["name"]||t["operator"]'
    const expectedLokiQuery = {
      $or: [
        { 'tags.name': { $exists: true } },
        { 'tags.operator': { $exists: true } }
      ],
      needMatch: false
    }
    const expectedCacheDescriptors = [
      { filters: '(if:t["name"])', properties: OverpassFrontend.TAGS },
      { filters: '(if:t["operator"])', properties: OverpassFrontend.TAGS }
    ]

    assert.deepEqual(eval.toJSON(), expected)
    assert.equal(str, '')

    const result = eval.exec({ tags: { name: 'foo' } })
    assert.equal(result, expectedResult)

    assert.equal(eval.toString(), expectedCompiled)
    assert.deepEqual(eval.toValue(), null)
    assert.deepEqual(eval.compileLokiJS(), expectedLokiQuery)

    const descriptors = [{filters: ''}]
    eval.cacheDescriptors(descriptors)
    assert.deepEqual(descriptors, expectedCacheDescriptors)
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
    const expectedLokiQuery = {
      'tags.width': { $lt: 10.5 }
    }
    const expectedCacheDescriptors = [
      { filters: '(if:t["width"]<10.5)', properties: OverpassFrontend.TAGS }
    ]

    assert.deepEqual(eval.toJSON(), expected)
    assert.equal(str, '')

    const result = eval.exec({ tags: { width: '5' } })
    assert.equal(result, expectedResult)

    assert.equal(eval.toString(), expectedCompiled)
    assert.deepEqual(eval.toValue(), null)
    assert.deepEqual(eval.compileLokiJS(), expectedLokiQuery)

    const descriptors = [{filters: ''}]
    eval.cacheDescriptors(descriptors)
    assert.deepEqual(descriptors, expectedCacheDescriptors)
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
    const expectedLokiQuery = {
      'tags.width': { $lte: "10.5" }
    }
    const expectedCacheDescriptors = [
      { filters: '(if:"10.5">=t["width"])', properties: OverpassFrontend.TAGS }
    ]

    assert.deepEqual(eval.toJSON(), expected)
    assert.equal(str, '')

    const result = eval.exec({ tags: { width: '5' } })
    assert.equal(result, expectedResult)

    assert.equal(eval.toString(), expectedCompiled)
    assert.deepEqual(eval.toValue(), null)
    assert.deepEqual(eval.compileLokiJS(), expectedLokiQuery)

    const descriptors = [{filters: ''}]
    eval.cacheDescriptors(descriptors)
    assert.deepEqual(descriptors, expectedCacheDescriptors)
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
    const expectedLokiQuery = { needMatch: true }
    const expectedCacheDescriptors = [
      { filters: '(if:t["name"]==t["operator"])', properties: OverpassFrontend.TAGS }
    ]

    assert.deepEqual(eval.toJSON(), expected)
    assert.equal(str, '')

    const result = eval.exec({ tags: { name: 'foo' } })
    assert.equal(result, expectedResult)

    assert.equal(eval.toString(), expectedCompiled)
    assert.deepEqual(eval.toValue(), null)
    assert.deepEqual(eval.compileLokiJS(), expectedLokiQuery)

    const descriptors = [{filters: ''}]
    eval.cacheDescriptors(descriptors)
    assert.deepEqual(descriptors, expectedCacheDescriptors)
  })

  it ('t["name"] == "foo" ? "match" : "no match"', function () {
    const eval = new Evaluator()
    const str = eval.parse('t["name"] == "foo" ? "match" : "no match"')
    console.log('HERE', JSON.stringify(eval, null, '  '))
    const expected = {
      op: '?',
      condition: {
        op: '==',
        left: {
          fun: 'tag',
          parameters: ['name']
        },
        right: 'foo'
      },
      left: 'match',
      right: 'no match'
    }
    const expectedResult = 'match'
    const expectedCompiled = 't["name"]=="foo"?"match":"no match"'
    const expectedLokiQuery = { needMatch: true }
    const expectedCacheDescriptors = [
      { filters: '(if:t["name"]=="foo")', properties: OverpassFrontend.TAGS },
      { filters: '(if:"match")', properties: OverpassFrontend.ID_ONLY },
      { filters: '(if:"no match")', properties: OverpassFrontend.ID_ONLY }
    ]

    console.log(JSON.stringify(eval.toJSON(), null, '  '))
    assert.deepEqual(eval.toJSON(), expected)
    assert.equal(str, '')

    const result = eval.exec({ tags: { name: 'foo' } })
    assert.equal(result, expectedResult)

    assert.equal(eval.toString(), expectedCompiled)
    assert.deepEqual(eval.toValue(), null)
    assert.deepEqual(eval.compileLokiJS(), expectedLokiQuery)

    const descriptors = [{filters: ''}]
    eval.cacheDescriptors(descriptors)
    assert.deepEqual(descriptors, expectedCacheDescriptors)
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
    const expectedLokiQuery = { value: true }
    const expectedCacheDescriptors = [
      { filters: '', properties: 0 }
    ]

    assert.deepEqual(eval.toJSON(), expected)
    assert.equal(str, '')

    const result = eval.exec({ tags: { name: 'foo' } })
    assert.equal(result, expectedResult)

    assert.equal(eval.toString(), expectedCompiled)
    assert.deepEqual(eval.toValue(), true)
    assert.deepEqual(eval.compileLokiJS(), expectedLokiQuery)

    const descriptors = [{filters: '', properties: 0}]
    eval.cacheDescriptors(descriptors)
    assert.deepEqual(descriptors, expectedCacheDescriptors)
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
    const expectedLokiQuery = { value: true }
    const expectedCacheDescriptors = [
      { filters: '', properties: 0 }
    ]

    assert.deepEqual(eval.toJSON(), expected)
    assert.equal(str, '')

    const result = eval.exec({ tags: { name: 'foo' } })
    assert.equal(result, expectedResult)

    assert.equal(eval.toString(), expectedCompiled)
    assert.deepEqual(eval.toValue(), true)
    assert.deepEqual(eval.compileLokiJS(), expectedLokiQuery)

    const descriptors = [{filters: '', properties: 0}]
    eval.cacheDescriptors(descriptors)
    assert.deepEqual(descriptors, expectedCacheDescriptors)
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
    const expectedLokiQuery = { value: true }
    const expectedCacheDescriptors = [
      { filters: '', properties: 0 }
    ]

    assert.deepEqual(eval.toJSON(), expected)
    assert.equal(str, '')

    const result = eval.exec({ tags: { name: 'foo' } })
    assert.equal(result, expectedResult)

    assert.equal(eval.toString(), expectedCompiled)
    assert.deepEqual(eval.toValue(), 1)
    assert.deepEqual(eval.compileLokiJS(), expectedLokiQuery)

    const descriptors = [{filters: '', properties: 0}]
    eval.cacheDescriptors(descriptors)
    assert.deepEqual(descriptors, expectedCacheDescriptors)
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
    const expectedLokiQuery = {
      '$or': [
        { 'tags.name': { $eq: 'foo' } },
        { 'tags.name': { $eq: 'bar' } }
      ],
      needMatch: false
    }
    const expectedCacheDescriptors = [
      { filters: '(if:t["name"]=="foo")', properties: OverpassFrontend.TAGS },
      { filters: '(if:t["name"]=="bar")', properties: OverpassFrontend.TAGS }
    ]

    assert.deepEqual(eval.toJSON(), expected)
    assert.equal(str, '')

    const result = eval.exec({ tags: { name: 'foo' } })
    assert.equal(result, expectedResult)

    assert.equal(eval.toString(), expectedCompiled)
    assert.deepEqual(eval.toValue(), null)
    assert.deepEqual(eval.compileLokiJS(), expectedLokiQuery)

    const descriptors = [{filters: ''}]
    eval.cacheDescriptors(descriptors)
    assert.deepEqual(descriptors, expectedCacheDescriptors)
  })

  it ('t["name"] == "foo" || t["name"] == "bar" || t["alice"] == "bob"', function () {
    const eval = new Evaluator()
    const str = eval.parse('t["name"] == "foo" || t["name"] == "bar" || t["alice"] == "bob"')
    const expected = {
      op: '||',
      left: {
        left: {
          left: {
            fun: 'tag',
            parameters: ['name']
          },
          op: '==',
          right: 'foo'
        },
        op: '||',
        right: {
          left: {
            fun: 'tag',
            parameters: ['name']
          },
          op: '==',
          right: 'bar'
        }
      },
      right: {
        left: {
          fun: 'tag',
          parameters: ['alice']
        },
        op: '==',
        right: 'bob'
      }
    }
    const expectedResult = true
    const expectedCompiled = 't["name"]=="foo"||t["name"]=="bar"||t["alice"]=="bob"'
    const expectedLokiQuery = {
      '$or': [
        { '$or': [
          { 'tags.name': { $eq: 'foo' } },
          { 'tags.name': { $eq: 'bar' } }
        ] },
        { 'tags.alice': { $eq: 'bob' } }
      ],
      needMatch: false
    }
    const expectedCacheDescriptors = [
      { filters: '(if:t["name"]=="foo")', properties: OverpassFrontend.TAGS },
      { filters: '(if:t["name"]=="bar")', properties: OverpassFrontend.TAGS },
      { filters: '(if:t["alice"]=="bob")', properties: OverpassFrontend.TAGS }
    ]

    assert.deepEqual(eval.toJSON(), expected)
    assert.equal(str, '')

    const result = eval.exec({ tags: { name: 'foo' } })
    assert.equal(result, expectedResult)

    assert.equal(eval.toString(), expectedCompiled)
    assert.deepEqual(eval.toValue(), null)
    assert.deepEqual(eval.compileLokiJS(), expectedLokiQuery)

    const descriptors = [{filters: ''}]
    eval.cacheDescriptors(descriptors)
    assert.deepEqual(descriptors, expectedCacheDescriptors)
  })

  it ('t["name"] == "foo" && t["name"] == "bar" && t["alice"] == "bob"', function () {
    const eval = new Evaluator()
    const str = eval.parse('t["name"] == "foo" && t["name"] == "bar" && t["alice"] == "bob"')
    const expected = {
      op: '&&',
      left: {
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
        }
      },
      right: {
        left: {
          fun: 'tag',
          parameters: ['alice']
        },
        op: '==',
        right: 'bob'
      }
    }
    const expectedResult = false
    const expectedCompiled = 't["name"]=="foo"&&t["name"]=="bar"&&t["alice"]=="bob"'
    const expectedLokiQuery = {
      '$and': [{
        $and: [
          { 'tags.name': { $eq: 'foo' } },
          { 'tags.name': { $eq: 'bar' } }
        ]},
        { 'tags.alice': { $eq: 'bob' } }
      ],
      needMatch: false
    }
    const expectedCacheDescriptors = [
      { filters: '(if:t["name"]=="foo"&&t["name"]=="bar"&&t["alice"]=="bob")', properties: OverpassFrontend.TAGS }
    ]

    assert.deepEqual(eval.toJSON(), expected)
    assert.equal(str, '')

    const result = eval.exec({ tags: { name: 'foo' } })
    assert.equal(result, expectedResult)

    assert.equal(eval.toString(), expectedCompiled)
    assert.deepEqual(eval.toValue(), null)
    assert.deepEqual(eval.compileLokiJS(), expectedLokiQuery)

    const descriptors = [{filters: ''}]
    eval.cacheDescriptors(descriptors)
    assert.deepEqual(descriptors, expectedCacheDescriptors)
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
    const expectedLokiQuery = { value: 'test2' }
    const expectedCacheDescriptors = [
      { filters: '', properties: 0 }
    ]

    assert.deepEqual(eval.toJSON(), expected)
    assert.equal(str, '')

    const result = eval.exec({ tags: { name: 'foo' } })
    assert.equal(result, expectedResult)

    assert.equal(eval.toString(), expectedCompiled)
    assert.deepEqual(eval.toValue(), 'test2')
    assert.deepEqual(eval.compileLokiJS(), expectedLokiQuery)

    const descriptors = [{filters: '', properties: 0}]
    eval.cacheDescriptors(descriptors)
    assert.deepEqual(descriptors, expectedCacheDescriptors)
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
    const expectedLokiQuery = { value: 14.5 }
    const expectedCacheDescriptors = [
      { filters: '', properties: 0 }
    ]

    assert.deepEqual(eval.toJSON(), expected)
    assert.equal(str, '')

    const result = eval.exec({ tags: { name: 'foo' } })
    assert.equal(result, expectedResult)

    assert.equal(eval.toString(), expectedCompiled)
    assert.deepEqual(eval.toValue(), 14.5)
    assert.deepEqual(eval.compileLokiJS(), expectedLokiQuery)

    const descriptors = [{filters: '', properties: 0}]
    eval.cacheDescriptors(descriptors)
    assert.deepEqual(descriptors, expectedCacheDescriptors)
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
    const expectedLokiQuery = { value: 22 }
    const expectedCacheDescriptors = [
      { filters: '', properties: 0 }
    ]

    assert.deepEqual(eval.toJSON(), expected)
    assert.equal(str, '')

    const result = eval.exec({ tags: { name: 'foo' } })
    assert.equal(result, expectedResult)

    assert.equal(eval.toString(), expectedCompiled)
    assert.deepEqual(eval.toValue(), 22)
    assert.deepEqual(eval.compileLokiJS(), expectedLokiQuery)

    const descriptors = [{filters: '', properties: 0}]
    eval.cacheDescriptors(descriptors)
    assert.deepEqual(descriptors, expectedCacheDescriptors)
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
    const expectedLokiQuery = { value: 15.5 }
    const expectedCacheDescriptors = [
      { filters: '', properties: 0 }
    ]

    assert.deepEqual(eval.toJSON(), expected)
    assert.equal(str, '')

    const result = eval.exec({ tags: { name: 'foo' } })
    assert.equal(result, expectedResult)

    assert.equal(eval.toString(), expectedCompiled)
    assert.deepEqual(eval.toValue(), 15.5)
    assert.deepEqual(eval.compileLokiJS(), expectedLokiQuery)

    const descriptors = [{filters: '', properties: 0}]
    eval.cacheDescriptors(descriptors)
    assert.deepEqual(descriptors, expectedCacheDescriptors)
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
    const expectedLokiQuery = { value: 11.5 }
    const expectedCacheDescriptors = [
      { filters: '', properties: 0 }
    ]

    assert.deepEqual(eval.toJSON(), expected)
    assert.equal(str, '')

    const result = eval.exec({ tags: { name: 'foo' } })
    assert.equal(result, expectedResult)

    assert.equal(eval.toString(), expectedCompiled)
    assert.deepEqual(eval.toValue(), 11.5)
    assert.deepEqual(eval.compileLokiJS(), expectedLokiQuery)

    const descriptors = [{filters: '', properties: 0}]
    eval.cacheDescriptors(descriptors)
    assert.deepEqual(descriptors, expectedCacheDescriptors)
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
    const expectedLokiQuery = { value: 3.5 }
    const expectedCacheDescriptors = [
      { filters: '', properties: 0 }
    ]

    assert.deepEqual(eval.toJSON(), expected)
    assert.equal(str, '')

    const result = eval.exec({ tags: { name: 'foo' } })
    assert.equal(result, expectedResult)

    assert.equal(eval.toString(), expectedCompiled)
    assert.deepEqual(eval.toValue(), 3.5)
    assert.deepEqual(eval.compileLokiJS(), expectedLokiQuery)

    const descriptors = [{filters: '', properties: 0}]
    eval.cacheDescriptors(descriptors)
    assert.deepEqual(descriptors, expectedCacheDescriptors)
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
    const expectedLokiQuery = { value: 27.5 }
    const expectedCacheDescriptors = [
      { filters: '', properties: 0 }
    ]

    assert.deepEqual(eval.toJSON(), expected)
    assert.equal(str, '')

    const result = eval.exec({ tags: { name: 'foo' } })
    assert.equal(result, expectedResult)

    assert.equal(eval.toString(), expectedCompiled)
    assert.deepEqual(eval.toValue(), 27.5)
    assert.deepEqual(eval.compileLokiJS(), expectedLokiQuery)

    const descriptors = [{filters: '', properties: 0}]
    eval.cacheDescriptors(descriptors)
    assert.deepEqual(descriptors, expectedCacheDescriptors)
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
    const expectedLokiQuery = { value: 3 }
    const expectedCacheDescriptors = [
      { filters: '', properties: 0 }
    ]

    assert.deepEqual(eval.toJSON(), expected)
    assert.equal(str, '')

    const result = eval.exec({ tags: { name: 'foo' } })
    assert.equal(result, expectedResult)

    assert.equal(eval.toString(), expectedCompiled)
    assert.deepEqual(eval.toValue(), 3)
    assert.deepEqual(eval.compileLokiJS(), expectedLokiQuery)

    const descriptors = [{filters: '', properties: 0}]
    eval.cacheDescriptors(descriptors)
    assert.deepEqual(descriptors, expectedCacheDescriptors)
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
    const expectedLokiQuery = { value: -3 }
    const expectedCacheDescriptors = [
      { filters: '', properties: 0 }
    ]

    assert.deepEqual(eval.toJSON(), expected)
    assert.equal(str, '')

    const result = eval.exec({ tags: { name: 'foo' } })
    assert.equal(result, expectedResult)

    assert.equal(eval.toString(), expectedCompiled)
    assert.deepEqual(eval.toValue(), -3)
    assert.deepEqual(eval.compileLokiJS(), expectedLokiQuery)

    const descriptors = [{filters: '', properties: 0}]
    eval.cacheDescriptors(descriptors)
    assert.deepEqual(descriptors, expectedCacheDescriptors)
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
    const expectedLokiQuery = { value: -1 }
    const expectedCacheDescriptors = [
      { filters: '', properties: 0 }
    ]

    assert.deepEqual(eval.toJSON(), expected)
    assert.equal(str, '')

    const result = eval.exec({ tags: { name: 'foo' } })
    assert.equal(result, expectedResult)

    assert.equal(eval.toString(), expectedCompiled)
    assert.deepEqual(eval.toValue(), -1)
    assert.deepEqual(eval.compileLokiJS(), expectedLokiQuery)

    const descriptors = [{filters: '', properties: 0}]
    eval.cacheDescriptors(descriptors)
    assert.deepEqual(descriptors, expectedCacheDescriptors)
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
    const expectedLokiQuery = { value: false }
    const expectedCacheDescriptors = [
      { filters: '', invalid: true, properties: 0 }
    ]

    assert.deepEqual(eval.toJSON(), expected)
    assert.equal(str, '')

    const result = eval.exec({ tags: { name: 'foo' } })
    assert.equal(result, expectedResult)

    assert.equal(eval.toString(), expectedCompiled)
    assert.deepEqual(eval.toValue(), 0)
    assert.deepEqual(eval.compileLokiJS(), expectedLokiQuery)

    const descriptors = [{filters: '', properties: 0}]
    eval.cacheDescriptors(descriptors)
    assert.deepEqual(descriptors, expectedCacheDescriptors)
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
    const expectedLokiQuery = { value: 1 }
    const expectedCacheDescriptors = [
      { filters: '', properties: 0 }
    ]

    assert.deepEqual(eval.toJSON(), expected)
    assert.equal(str, '')

    const result = eval.exec({ tags: { name: 'foo' } })
    assert.equal(result, expectedResult)

    assert.equal(eval.toString(), expectedCompiled)
    assert.deepEqual(eval.toValue(), 1)
    assert.deepEqual(eval.compileLokiJS(), expectedLokiQuery)

    const descriptors = [{filters: '', properties: 0}]
    eval.cacheDescriptors(descriptors)
    assert.deepEqual(descriptors, expectedCacheDescriptors)
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
    const expectedLokiQuery = { needMatch: true }
    const expectedCacheDescriptors = [
      { filters: '(if:t["name3"]+"bar")', properties: OverpassFrontend.TAGS }
    ]

    assert.deepEqual(eval.toJSON(), expected)
    assert.equal(str, '')

    const result = eval.exec({ tags: { name3: 'foo' } })
    assert.equal(result, expectedResult)

    assert.equal(eval.toString(), expectedCompiled)
    assert.deepEqual(eval.toValue(), null)
    assert.deepEqual(eval.compileLokiJS(), expectedLokiQuery)

    const descriptors = [{filters: ''}]
    eval.cacheDescriptors(descriptors)
    assert.deepEqual(descriptors, expectedCacheDescriptors)
  })

  it ('tag("name" + 3) == "bar"', function () {
    const eval = new Evaluator()
    const str = eval.parse('tag("name" + 3) == "bar"')
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
      op: '==',
      right: 'bar'
    }
    const expectedResult = false
    const expectedCompiled = 't["name"+3]=="bar"'
    const expectedLokiQuery = {
      'tags.name3': { $eq: 'bar' }
    }
    const expectedCacheDescriptors = [
      { filters: '(if:t["name3"]=="bar")', properties: OverpassFrontend.TAGS }
    ]

    assert.deepEqual(eval.toJSON(), expected)
    assert.equal(str, '')

    const result = eval.exec({ tags: { name3: 'foo' } })
    assert.equal(result, expectedResult)

    assert.equal(eval.toString(), expectedCompiled)
    assert.deepEqual(eval.toValue(), null)
    assert.deepEqual(eval.compileLokiJS(), expectedLokiQuery)

    const descriptors = [{filters: ''}]
    eval.cacheDescriptors(descriptors)
    assert.deepEqual(descriptors, expectedCacheDescriptors)
  })

  it ('t["ref"] - 5', function () {
    const eval = new Evaluator()
    const str = eval.parse('t["ref"] - 5')
    const expected = {
      left: {
        fun: 'tag',
        parameters: ['ref']
      },
      op: '-',
      right: 5
    }
    const expectedResult = 0
    const expectedCompiled = 't["ref"]-5'
    const expectedLokiQuery = { needMatch: true }
    const expectedCacheDescriptors = [
      { filters: '(if:t["ref"]-5)', properties: OverpassFrontend.TAGS }
    ]

    assert.deepEqual(eval.toJSON(), expected)
    assert.equal(str, '')

    const result = eval.exec({ tags: { name3: 'foo', ref: '5' } })
    assert.equal(result, expectedResult)

    assert.equal(eval.toString(), expectedCompiled)
    assert.deepEqual(eval.toValue(), null)
    assert.deepEqual(eval.compileLokiJS(), expectedLokiQuery)

    const descriptors = [{filters: ''}]
    eval.cacheDescriptors(descriptors)
    assert.deepEqual(descriptors, expectedCacheDescriptors)
  })

  it ('"name")', function () {
    const eval = new Evaluator()
    const str = eval.parse('"name")')
    const expected = 'name'
    const expectedResult = "name"
    const expectedCompiled = '"name"'
    const expectedLokiQuery = { value: 'name' }
    const expectedCacheDescriptors = [
      { filters: '', properties: 0 }
    ]

    assert.deepEqual(eval.toJSON(), expected)
    assert.equal(str, ')')

    const result = eval.exec({ tags: { name3: 'foo' } })
    assert.equal(result, expectedResult)

    assert.equal(eval.toString(), expectedCompiled)
    assert.deepEqual(eval.toValue(), 'name')
    assert.deepEqual(eval.compileLokiJS(), expectedLokiQuery)

    const descriptors = [{filters: '', properties: 0}]
    eval.cacheDescriptors(descriptors)
    assert.deepEqual(descriptors, expectedCacheDescriptors)
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
    const expectedLokiQuery = { needMatch: true }
    const expectedCacheDescriptors = [
      { filters: '(if:count_tags())', properties: OverpassFrontend.TAGS }
    ]

    assert.deepEqual(eval.toJSON(), expected)
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
    assert.deepEqual(eval.toValue(), null)
    assert.deepEqual(eval.compileLokiJS(), expectedLokiQuery)

    const descriptors = [{filters: ''}]
    eval.cacheDescriptors(descriptors)
    assert.deepEqual(descriptors, expectedCacheDescriptors)
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
    const expectedLokiQuery = {
      'osm_id': { $eq: 377992 }
    }
    const expectedCacheDescriptors = [
      { filters: '(if:id()==377992)', properties: OverpassFrontend.ID_ONLY }
    ]

    assert.deepEqual(eval.toJSON(), expected)
    assert.equal(str, '')

    let result = eval.exec({ id: 'n377992', osm_id: 377992, type: 'node' })
    assert.equal(result, expectedResult)
    result = eval.exec({ id: 'n377998', osm_id: 377998, type: 'node' })
    assert.equal(result, false)

    assert.equal(eval.toString(), expectedCompiled)
    assert.deepEqual(eval.toValue(), null)
    assert.deepEqual(eval.compileLokiJS(), expectedLokiQuery)

    const descriptors = [{filters: ''}]
    eval.cacheDescriptors(descriptors)
    assert.deepEqual(descriptors, expectedCacheDescriptors)
  })

  it ('is_closed()', function () {
    const eval = new Evaluator()
    const str = eval.parse('is_closed()')
    const expected = {
      fun: 'is_closed',
      parameters: []
    }
    const expectedResult = 1
    const expectedCompiled = 'is_closed()'
    const expectedLokiQuery = {
      needMatch: true
    }
    const expectedCacheDescriptors = [
      { filters: '(if:is_closed())', properties: OverpassFrontend.MEMBERS }
    ]

    assert.deepEqual(eval.toJSON(), expected)
    assert.equal(str, '')

    let result = eval.exec({ id: 'w377992', osm_id: 377992, type: 'way', members: [ {id: 'n1'}, {id: 'n2'}, {id: 'n1' }]})
    assert.equal(result, expectedResult)

    assert.equal(eval.toString(), expectedCompiled)
    assert.deepEqual(eval.toValue(), null)
    assert.deepEqual(eval.compileLokiJS(), expectedLokiQuery)

    const descriptors = [{filters: ''}]
    eval.cacheDescriptors(descriptors)
    assert.deepEqual(descriptors, expectedCacheDescriptors)
  })

  it ('is_tag("name")', function () {
    const eval = new Evaluator()
    const str = eval.parse('is_tag("name")')
    const expected = {
      fun: 'is_tag',
      parameters: ['name']
    }
    const expectedResult = 1
    const expectedCompiled = 'is_tag("name")'
    const expectedLokiQuery = {
      'tags.name': { $exists: true }
    }
    const expectedCacheDescriptors = [
      { filters: '(if:is_tag("name"))', properties: OverpassFrontend.TAGS }
    ]

    assert.deepEqual(eval.toJSON(), expected)
    assert.equal(str, '')

    let result = eval.exec({ id: 'n377992', osm_id: 377992, type: 'node', tags: { name: "foobar" } })
    assert.equal(result, expectedResult)
    result = eval.exec({ id: 'n377998', osm_id: 377998, type: 'node', tags: { operator: "bla" } })
    assert.equal(result, 0)

    assert.equal(eval.toString(), expectedCompiled)
    assert.deepEqual(eval.toValue(), null)
    assert.deepEqual(eval.compileLokiJS(), expectedLokiQuery)

    const descriptors = [{filters: ''}]
    eval.cacheDescriptors(descriptors)
    assert.deepEqual(descriptors, expectedCacheDescriptors)
  })

  it ('debug("name")', function () {
    const eval = new Evaluator()
    const str = eval.parse('debug("name")')
    const expected = {
      fun: 'debug',
      parameters: ['name']
    }
    const expectedResult = 'name'
    const expectedCompiled = 'debug("name")'
    const expectedQl = '"name"'
    const expectedLokiQuery = {
      'value': 'name'
    }
    const expectedCacheDescriptors = [
      { filters: '' }
    ]

    assert.deepEqual(eval.toJSON(), expected)
    assert.equal(str, '')

    let result = eval.exec({ id: 'n377992', osm_id: 377992, type: 'node', tags: { name: "foobar" } })
    assert.equal(result, expectedResult)

    assert.equal(eval.toString(), expectedCompiled)
    assert.equal(eval.toQl(), expectedQl)
    assert.deepEqual(eval.toValue(), 'name')
    assert.deepEqual(eval.compileLokiJS(), expectedLokiQuery)

    const descriptors = [{filters: ''}]
    eval.cacheDescriptors(descriptors)
    assert.deepEqual(descriptors, expectedCacheDescriptors)
  })

/* TODO
  it('is_tag("name") == 1', function () {
    const eval = new Evaluator()
    const str = eval.parse('is_tag("name") == 1')
    const expected = {
      left: {
        fun: 'is_tag',
        parameters: ['name']
      },
      op: '==',
      right: 1
    }
    const expectedResult = 1
    const expectedCompiled = 'is_tag("name")==1'
    const expectedLokiQuery = {
      'tags.name': { $exists: true }
    }
    const expectedCacheDescriptors = [
      { filters: '(if:is_tag("name")==1)', properties: OverpassFrontend.TAGS }
    ]

    assert.deepEqual(eval.toJSON(), expected)
    assert.equal(str, '')

    let result = eval.exec({ id: 'n377992', osm_id: 377992, type: 'node', tags: { name: "foobar" } })
    assert.equal(result, expectedResult)
    result = eval.exec({ id: 'n377998', osm_id: 377998, type: 'node', tags: { operator: "bla" } })
    assert.equal(result, 0)

    assert.equal(eval.toString(), expectedCompiled)
    assert.deepEqual(eval.toValue(), null)
    assert.deepEqual(eval.compileLokiJS(), expectedLokiQuery)

    const descriptors = [{filters: ''}]
    eval.cacheDescriptors(descriptors)
    assert.deepEqual(descriptors, expectedCacheDescriptors)
  })

  it('is_tag("name") == 0', function () {
    const eval = new Evaluator()
    const str = eval.parse('is_tag("name") == 0')
    const expected = {
      left: {
        fun: 'is_tag',
        parameters: ['name']
      },
      op: '==',
      right: 0
    }
    const expectedResult = 0
    const expectedCompiled = 'is_tag("name")==0'
    const expectedLokiQuery = {
      'tags.name': { $exists: true }
    }
    const expectedCacheDescriptors = [
      { filters: '(if:is_tag("name")==0)', properties: OverpassFrontend.TAGS }
    ]

    assert.deepEqual(eval.toJSON(), expected)
    assert.equal(str, '')

    let result = eval.exec({ id: 'n377992', osm_id: 377992, type: 'node', tags: { name: "foobar" } })
    assert.equal(result, expectedResult)
    result = eval.exec({ id: 'n377998', osm_id: 377998, type: 'node', tags: { operator: "bla" } })
    assert.equal(result, 1)

    assert.equal(eval.toString(), expectedCompiled)
    assert.deepEqual(eval.toValue(), null)
    assert.deepEqual(eval.compileLokiJS(), expectedLokiQuery)

    const descriptors = [{filters: ''}]
    eval.cacheDescriptors(descriptors)
    assert.deepEqual(descriptors, expectedCacheDescriptors)
  })
*/

  it('!is_tag("name")', function () {
    const eval = new Evaluator()
    const str = eval.parse('!is_tag("name")')
    const expected = {
      left: null,
      right: {
        fun: 'is_tag',
        parameters: ['name']
      },
      op: '!'
    }
    const expectedResult = 0
    const expectedCompiled = '!is_tag("name")'
    const expectedLokiQuery = {
      'tags.name': { $exists: false }
    }
    const expectedCacheDescriptors = [
      { filters: '(if:!is_tag("name"))', properties: OverpassFrontend.TAGS }
    ]

    assert.deepEqual(eval.toJSON(), expected)
    assert.equal(str, '')

    let result = eval.exec({ id: 'n377992', osm_id: 377992, type: 'node', tags: { name: "foobar" } })
    assert.equal(result, expectedResult)
    result = eval.exec({ id: 'n377998', osm_id: 377998, type: 'node', tags: { operator: "bla" } })
    assert.equal(result, 1)

    assert.equal(eval.toString(), expectedCompiled)
    assert.deepEqual(eval.toValue(), null)
    assert.deepEqual(eval.compileLokiJS(), expectedLokiQuery)

    const descriptors = [{filters: ''}]
    eval.cacheDescriptors(descriptors)
    assert.deepEqual(descriptors, expectedCacheDescriptors)
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
    const expectedLokiQuery = {
      '$and': [
        { 'osm_id': { $eq: 377992 } },
        { 'type': { $eq: 'node' } },
      ],
      needMatch: false
    }
    const expectedCacheDescriptors = [
      { filters: '(if:id()==377992&&type()=="node")', properties: OverpassFrontend.ID_ONLY }
    ]

    assert.deepEqual(eval.toJSON(), expected)
    assert.equal(str, '')

    let result = eval.exec({ id: 'n377992', osm_id: 377992, type: 'node' })
    assert.equal(result, expectedResult)
    result = eval.exec({ id: 'n377998', osm_id: 377998, type: 'node' })
    assert.equal(result, false)

    assert.equal(eval.toString(), expectedCompiled)
    assert.deepEqual(eval.toValue(), null)
    assert.deepEqual(eval.compileLokiJS(), expectedLokiQuery)

    const descriptors = [{filters: ''}]
    eval.cacheDescriptors(descriptors)
    assert.deepEqual(descriptors, expectedCacheDescriptors)
  })

  it ('timestamp()', function () {
    const eval = new Evaluator()
    const str = eval.parse('timestamp() < "2012-12-01T12:00:00Z"')
    const expected = {
      left: {
        fun: 'timestamp',
        parameters: []
      },
      op: '<',
      right: '2012-12-01T12:00:00Z'
    }
    const expectedResult = true
    const expectedCompiled = 'timestamp()<"2012-12-01T12:00:00Z"'
    const expectedLokiQuery = {
      'osmMeta.timestamp': { $lt: '2012-12-01T12:00:00Z' }
    }
    const expectedCacheDescriptors = [
      { filters: '(if:timestamp()<"2012-12-01T12:00:00Z")', properties: OverpassFrontend.META }
    ]

    assert.deepEqual(eval.toJSON(), expected)
    assert.equal(str, '')

    let result = eval.exec({ id: 'n377992', osm_id: 377992, type: 'node', meta: { timestamp: '2011-12-10T02:06:54Z' } })
    assert.equal(result, expectedResult)

    assert.equal(eval.toString(), expectedCompiled)
    assert.deepEqual(eval.toValue(), null)
    assert.deepEqual(eval.compileLokiJS(), expectedLokiQuery)

    const descriptors = [{filters: ''}]
    eval.cacheDescriptors(descriptors)
    assert.deepEqual(descriptors, expectedCacheDescriptors)
  })

  it ('debug(timestamp()) < "2012-12-01T12:00:00Z"', function () {
    const eval = new Evaluator()
    const str = eval.parse('debug(timestamp()) < "2012-12-01T12:00:00Z"')
    const expected = {
      left: {
        fun: 'debug',
        parameters: [{
          fun: 'timestamp',
          parameters: []
        }]
      },
      op: '<',
      right: '2012-12-01T12:00:00Z'
    }
    const expectedResult = true
    const expectedCompiled = 'debug(timestamp())<"2012-12-01T12:00:00Z"'
    const expectedQl = 'timestamp()<"2012-12-01T12:00:00Z"'
    const expectedLokiQuery = {
      'osmMeta.timestamp': { $lt: '2012-12-01T12:00:00Z' }
    }
    const expectedCacheDescriptors = [
      { filters: '(if:timestamp()<"2012-12-01T12:00:00Z")', properties: OverpassFrontend.META }
    ]

    assert.deepEqual(eval.toJSON(), expected)
    assert.equal(str, '')

    let result = eval.exec({ id: 'n377992', osm_id: 377992, type: 'node', meta: { timestamp: '2011-12-10T02:06:54Z' } })
    assert.equal(result, expectedResult)

    assert.equal(eval.toString(), expectedCompiled)
    assert.equal(eval.toQl(), expectedQl)
    assert.deepEqual(eval.toValue(), null)
    assert.deepEqual(eval.compileLokiJS(), expectedLokiQuery)

    const descriptors = [{filters: ''}]
    eval.cacheDescriptors(descriptors)
    assert.deepEqual(descriptors, expectedCacheDescriptors)
  })

  it ('count_members()', function () {
    const eval = new Evaluator()
    const str = eval.parse('count_members() < 3')
    const expected = {
      left: {
        fun: 'count_members',
        parameters: []
      },
      op: '<',
      right: 3
    }
    const expectedResult = false
    const expectedCompiled = 'count_members()<3'
    const expectedLokiQuery = {
      needMatch: true
    }
    const expectedCacheDescriptors = [
      { filters: '(if:count_members()<3)', properties: OverpassFrontend.MEMBERS }
    ]

    assert.deepEqual(eval.toJSON(), expected)
    assert.equal(str, '')

    let result = eval.exec({ id: 'n377992', osm_id: 377992, type: 'node', meta: { timestamp: '2011-12-10T02:06:54Z' }, members: [{id: 'n1', role: 'foo'}, {id: 'n2', role: 'bar'}, {id: 'n1'}, {id: 'n3', role: 'foo' }]})
    assert.equal(result, expectedResult)

    assert.equal(eval.toString(), expectedCompiled)
    assert.deepEqual(eval.toValue(), null)
    assert.deepEqual(eval.compileLokiJS(), expectedLokiQuery)

    const descriptors = [{filters: ''}]
    eval.cacheDescriptors(descriptors)
    assert.deepEqual(descriptors, expectedCacheDescriptors)
  })

  it ('count_distinct_members()', function () {
    const eval = new Evaluator()
    const str = eval.parse('count_distinct_members() == 3')
    const expected = {
      left: {
        fun: 'count_distinct_members',
        parameters: []
      },
      op: '==',
      right: 3
    }
    const expectedResult = true
    const expectedCompiled = 'count_distinct_members()==3'
    const expectedLokiQuery = {
      needMatch: true
    }
    const expectedCacheDescriptors = [
      { filters: '(if:count_distinct_members()==3)', properties: OverpassFrontend.MEMBERS }
    ]

    assert.deepEqual(eval.toJSON(), expected)
    assert.equal(str, '')

    let result = eval.exec({ id: 'n377992', osm_id: 377992, type: 'node', meta: { timestamp: '2011-12-10T02:06:54Z' }, members: [{id: 'n1', role: 'foo'}, {id: 'n2', role: 'bar'}, {id: 'n1'}, {id: 'n3', role: 'foo' }]})
    assert.equal(result, expectedResult)

    assert.equal(eval.toString(), expectedCompiled)
    assert.deepEqual(eval.toValue(), null)
    assert.deepEqual(eval.compileLokiJS(), expectedLokiQuery)

    const descriptors = [{filters: ''}]
    eval.cacheDescriptors(descriptors)
    assert.deepEqual(descriptors, expectedCacheDescriptors)
  })

  it ('count_by_role("foo")', function () {
    const eval = new Evaluator()
    const str = eval.parse('count_by_role("foo") == 3')
    const expected = {
      left: {
        fun: 'count_by_role',
        parameters: ['foo']
      },
      op: '==',
      right: 3
    }
    const expectedResult = true
    const expectedCompiled = 'count_by_role("foo")==3'
    const expectedLokiQuery = {
      needMatch: true
    }
    const expectedCacheDescriptors = [
      { filters: '(if:count_by_role("foo")==3)', properties: OverpassFrontend.MEMBERS }
    ]

    assert.deepEqual(eval.toJSON(), expected)
    assert.equal(str, '')

    let result = eval.exec({ id: 'n377992', osm_id: 377992, type: 'node', meta: { timestamp: '2011-12-10T02:06:54Z' }, members: [{id: 'n1', role: 'foo'}, {id: 'n2', role: 'bar'}, {id: 'n1'}, {id: 'n3', role: 'foo' }, {id: 'n3', role: 'foo' }]})
    assert.equal(result, expectedResult)

    assert.equal(eval.toString(), expectedCompiled)
    assert.deepEqual(eval.toValue(), null)
    assert.deepEqual(eval.compileLokiJS(), expectedLokiQuery)

    const descriptors = [{filters: ''}]
    eval.cacheDescriptors(descriptors)
    assert.deepEqual(descriptors, expectedCacheDescriptors)
  })

  it ('count_distinct_by_role("foo")', function () {
    const eval = new Evaluator()
    const str = eval.parse('count_distinct_by_role("foo") == 2')
    const expected = {
      left: {
        fun: 'count_distinct_by_role',
        parameters: ['foo']
      },
      op: '==',
      right: 2
    }
    const expectedResult = true
    const expectedCompiled = 'count_distinct_by_role("foo")==2'
    const expectedLokiQuery = {
      needMatch: true
    }
    const expectedCacheDescriptors = [
      { filters: '(if:count_distinct_by_role("foo")==2)', properties: OverpassFrontend.MEMBERS }
    ]

    assert.deepEqual(eval.toJSON(), expected)
    assert.equal(str, '')

    let result = eval.exec({ id: 'n377992', osm_id: 377992, type: 'node', meta: { timestamp: '2011-12-10T02:06:54Z' }, members: [{id: 'n1', role: 'foo'}, {id: 'n2', role: 'bar'}, {id: 'n1'}, {id: 'n3', role: 'foo' }, {id: 'n3', role: 'foo' }]})
    assert.equal(result, expectedResult)

    assert.equal(eval.toString(), expectedCompiled)
    assert.deepEqual(eval.toValue(), null)
    assert.deepEqual(eval.compileLokiJS(), expectedLokiQuery)

    const descriptors = [{filters: ''}]
    eval.cacheDescriptors(descriptors)
    assert.deepEqual(descriptors, expectedCacheDescriptors)
  })
})
