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

describe("Filters - clone+add", function () {
  addTests.forEach(def => {
    it(def.input + ' + ' + def.add, function () {
      const filter = new Filter(def.input)
      const clone = new Filter(filter)
      clone.add(def.add)

      if (!def.expected) {
        const expected = new Filter(def.input + def.add)
        def.expected = expected.toQl()
        def.expectedSetIds = expected.toQl({ setsUseStatementIds: true })
      }

      assert.equal(clone.toQl(), def.expected)
      assert.equal(clone.toQl({ setsUseStatementIds: true }), def.expectedSetIds)
    })
  })
})

describe("Filters - toQl({from: ...})", function () {
  addTests.forEach(def => {
    it(def.input + ' + ' + def.add, function () {
      const filter = new Filter(def.input)
      const clone = new Filter(filter)
      clone.add(def.add)

      const expected = def.expected.substr(filter.toQl().length)
      const expectedSetIds = def.expectedSetIds.substr(filter.toQl({ setsUseStatementIds: true }).length)

      assert.equal(clone.toQl({ from: filter }), expected)
      assert.equal(clone.toQl({ from: filter, setsUseStatementIds: true }), expectedSetIds)
    })
  })
})
