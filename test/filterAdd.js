const assert = require('assert')
const loki = require('lokijs')

const Filter = require('../src/Filter')

const addTests = [
  {
    input: "nwr;",
    add: "node[amenity]",
  },
  {
    input: "nwr;",
    add: "node._[amenity]",
  }
]

describe("Filters - add", function () {
  addTests.forEach(def => {
    it(def.input + ' + ' + def.add, function () {
      const filter = new Filter(def.input)
      filter.add(def.add)

      if (!def.expected) {
        const expected = new Filter(def.input + def.add)
        def.expected = expected.toQl()
        def.expectedSetIds = expected.toQl({ setsUseStatementIds: true })
      }

      assert.equal(filter.toQl(), def.expected)
      assert.equal(filter.toQl({ setsUseStatementIds: true }), def.expectedSetIds)
    })
  })
})
