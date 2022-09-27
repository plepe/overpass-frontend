const assert = require('assert')

const parseParentheses = require('../src/parseParentheses')

describe('parseParentheses()', function () {
  it("(test)after", function () {
    assert.deepEqual(parseParentheses("(test)after"), ["test", "after"])
  })

  it("(test))after", function () {
    assert.deepEqual(parseParentheses("(test))after"), ["test", ")after"])
  })

  it("((test))after", function () {
    assert.deepEqual(parseParentheses("((test))after"), ["(test)", "after"])
  })

  it("(\"(test)\")after", function () {
    assert.deepEqual(parseParentheses("(\"(test)\")after"), ["\"(test)\"", "after"])
  })

  it("(\"test)\")after", function () {
    assert.deepEqual(parseParentheses("(\"test)\")after"), ["\"test)\"", "after"])
  })

  it("((a=b)&(c=d))after", function () {
    assert.deepEqual(parseParentheses("((a=b)&(c=d))after"), ["(a=b)&(c=d)", "after"])
  })

  it("[(a=b)&(c=d)]after", function () {
    assert.deepEqual(parseParentheses("[(a=b)&(c=d)]after"), ["(a=b)&(c=d)", "after"])
  })

  it("[(a=b)&[c=d]]after", function () {
    assert.deepEqual(parseParentheses("[(a=b)&[c=d]]after"), ["(a=b)&[c=d]", "after"])
  })

  it("((a=b)&(c=d)after", function () {
    try {
      parseParentheses("((a=b)&(c=d)after")
    }
    catch (e) {
      return assert.equal(e.message, "Can't parse string from query: after")
    }

    assert.fail("expecting an exception")
  })
})
