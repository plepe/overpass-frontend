const assert = require('assert')

const parseString = require('../src/parseString')

describe('parseString()', function () {
  it("\"test\"after", function () {
    assert.deepEqual(parseString("\"test\"after"), ["test", "after"])
  })

  it("\'test\'after", function () {
    assert.deepEqual(parseString("\'test\'after"), ["test", "after"])
  })

  it("\"te'st\"after", function () {
    assert.deepEqual(parseString("\"te'st\"after"), ["te'st", "after"])
  })

  it("\'te\"st\'after", function () {
    assert.deepEqual(parseString("\'te\"st\'after"), ["te\"st", "after"])
  })

  it("\"te\\\"st\"after", function () {
    assert.deepEqual(parseString("\"te\\\"st\"after"), ["te\"st", "after"])
  })

  it("\'te\\\'st\'after", function () {
    assert.deepEqual(parseString("\'te\\\'st\'after"), ["te\'st", "after"])
  })

  it("\"te\"st\"after", function () {
    assert.deepEqual(parseString("\"te\"st\"after"), ["te", "st\"after"])
  })

  it("\'te\'st\'after", function () {
    assert.deepEqual(parseString("\'te\'st\'after"), ["te", "st\'after"])
  })
})
