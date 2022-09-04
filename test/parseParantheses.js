const assert = require('assert')

const parseParantheses = require('../src/parseParantheses')

describe('parseParantheses()', function () {
  it("(test)after", function () {
    assert.deepEqual(parseParantheses("(test)after"), ["test", "after"])
  })

  it("(test))after", function () {
    assert.deepEqual(parseParantheses("(test))after"), ["test", ")after"])
  })

  it("((test))after", function () {
    assert.deepEqual(parseParantheses("((test))after"), ["(test)", "after"])
  })

  it("(\"(test)\")after", function () {
    assert.deepEqual(parseParantheses("(\"(test)\")after"), ["\"(test)\"", "after"])
  })

  it("(\"test)\")after", function () {
    assert.deepEqual(parseParantheses("(\"test)\")after"), ["\"test)\"", "after"])
  })

  it("((a=b)&(c=d))after", function () {
    assert.deepEqual(parseParantheses("((a=b)&(c=d))after"), ["(a=b)&(c=d)", "after"])
  })

  it("[(a=b)&(c=d)]after", function () {
    assert.deepEqual(parseParantheses("[(a=b)&(c=d)]after"), ["(a=b)&(c=d)", "after"])
  })

  it("[(a=b)&[c=d]]after", function () {
    assert.deepEqual(parseParantheses("[(a=b)&[c=d]]after"), ["(a=b)&[c=d]", "after"])
  })

  it("((a=b)&(c=d)after", function () {
    try {
      parseParantheses("((a=b)&(c=d)after")
    }
    catch (e) {
      return assert.equal(e.message, "Can't parse string from query: after")
    }

    assert.fail("expecting an exception")
  })
})
