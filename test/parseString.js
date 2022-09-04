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

  it("\'testafter", function () {
    try {
      parseString("\'testafter")
    }
    catch (e) {
      return assert.equal(e.message, "Can't parse string, no string end detected!")
    }

    assert.fail("expecting an exception")
  })

  it("\'test\\\'after", function () {
    try {
      parseString("\'test\\\'after")
    }
    catch (e) {
      return assert.equal(e.message, "Can't parse string, no string end detected!")
    }

    assert.fail("expecting an exception")
  })
})
