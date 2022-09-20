const assert = require('assert')
const loki = require('lokijs')

const Filter = require('../src/Filter')

describe("Filters - test isSupersetOf", function () {
  it("nwr - node", function () {
    const f1 = new Filter("nwr")
    const f2 = new Filter("node")

    assert.equal(f1.isSupersetOf(f2), true, f1.toString() + " should be a super set of " + f2.toString())
    assert.equal(f2.isSupersetOf(f1), false, f2.toString() + " should not be a super set of " + f1.toString())
  })

  it("way - node", function () {
    const f1 = new Filter("way")
    const f2 = new Filter("node")

    assert.equal(f1.isSupersetOf(f2), false, f1.toString() + " should not be a super set of " + f2.toString())
    assert.equal(f2.isSupersetOf(f1), false, f2.toString() + " should not be a super set of " + f1.toString())
  })

  it("nwr[amenity] - node[amenity]", function () {
    const f1 = new Filter("nwr[amenity]")
    const f2 = new Filter("node[amenity]")

    assert.equal(f1.isSupersetOf(f2), true, f1.toString() + " should be a super set of " + f2.toString())
    assert.equal(f2.isSupersetOf(f1), false, f2.toString() + " should not be a super set of " + f1.toString())
  })

  it("way[amenity] - node[amenity]", function () {
    const f1 = new Filter("way[amenity]")
    const f2 = new Filter("node[amenity]")

    assert.equal(f1.isSupersetOf(f2), false, f1.toString() + " should not be a super set of " + f2.toString())
    assert.equal(f2.isSupersetOf(f1), false, f2.toString() + " should not be a super set of " + f1.toString())
  })

  it("node[amenity] - node[tourism]", function () {
    const f1 = new Filter("node[amenity]")
    const f2 = new Filter("node[tourism]")

    assert.equal(f1.isSupersetOf(f2), false, f1.toString() + " should not be a super set of " + f2.toString())
    assert.equal(f2.isSupersetOf(f1), false, f2.toString() + " should not be a super set of " + f1.toString())
  })

  it("node[amenity] - node[amenity][cuisine]", function () {
    const f1 = new Filter("node[amenity]")
    const f2 = new Filter("node[amenity][cuisine]")

    assert.equal(f1.isSupersetOf(f2), true, f1.toString() + " should be a super set of " + f2.toString())
    assert.equal(f2.isSupersetOf(f1), false, f2.toString() + " should not be a super set of " + f1.toString())
  })

  it("node[amenity] - node[amenity][amenity=restaurant]", function () {
    const f1 = new Filter("node[amenity]")
    const f2 = new Filter("node[amenity][amenity=restaurant]")

    assert.equal(f1.isSupersetOf(f2), true, f1.toString() + " should be a super set of " + f2.toString())
    assert.equal(f2.isSupersetOf(f1), false, f2.toString() + " should not be a super set of " + f1.toString())
  })

  it("node[amenity][amenity=cafe] - node[amenity][amenity=restaurant]", function () {
    const f1 = new Filter("node[amenity][amenity=cafe]")
    const f2 = new Filter("node[amenity][amenity=restaurant]")

    assert.equal(f1.isSupersetOf(f2), false, f1.toString() + " should not be a super set of " + f2.toString())
    assert.equal(f2.isSupersetOf(f1), false, f2.toString() + " should not be a super set of " + f1.toString())
  })

  it("node[amenity] - node[amenity=restaurant]", function () {
    const f1 = new Filter("node[amenity]")
    const f2 = new Filter("node[amenity=restaurant]")

    assert.equal(f1.isSupersetOf(f2), true, f1.toString() + " should be a super set of " + f2.toString())
    assert.equal(f2.isSupersetOf(f1), false, f2.toString() + " should not be a super set of " + f1.toString())
  })

  it("node[amenity] - node[amenity!=restaurant]", function () {
    const f1 = new Filter("node[amenity]")
    const f2 = new Filter("node[amenity!=restaurant]")

    assert.equal(f1.isSupersetOf(f2), false, f1.toString() + " should not be a super set of " + f2.toString())
    assert.equal(f2.isSupersetOf(f1), false, f2.toString() + " should not be a super set of " + f1.toString())
  })

  it("node[amenity] - node[!amenity]", function () {
    const f1 = new Filter("node[amenity]")
    const f2 = new Filter("node[!amenity]")

    assert.equal(f1.isSupersetOf(f2), false, f1.toString() + " should not be a super set of " + f2.toString())
    assert.equal(f2.isSupersetOf(f1), false, f2.toString() + " should not be a super set of " + f1.toString())
  })

  it("node[amenity] - node[!tourism]", function () {
    const f1 = new Filter("node[amenity]")
    const f2 = new Filter("node[!tourism]")

    assert.equal(f1.isSupersetOf(f2), false, f1.toString() + " should not be a super set of " + f2.toString())
    assert.equal(f2.isSupersetOf(f1), false, f2.toString() + " should not be a super set of " + f1.toString())
  })

  it("node[amenity!=restaurant] - node[tourism]", function () {
    const f1 = new Filter("node[amenity!=restaurant]")
    const f2 = new Filter("node[tourism]")

    assert.equal(f1.isSupersetOf(f2), false, f1.toString() + " should be a super set of " + f2.toString())
    assert.equal(f2.isSupersetOf(f1), false, f2.toString() + " should not be a super set of " + f1.toString())
  })

  it("node[amenity][amenity!=restaurant] - node[tourism]", function () {
    const f1 = new Filter("node[amenity][amenity!=restaurant]")
    const f2 = new Filter("node[tourism]")

    assert.equal(f1.isSupersetOf(f2), false, f1.toString() + " should not be a super set of " + f2.toString())
    assert.equal(f2.isSupersetOf(f1), false, f2.toString() + " should not be a super set of " + f1.toString())
  })

  it("node[amenity!=restaurant] - node[amenity]", function () {
    const f1 = new Filter("node[amenity!=restaurant]")
    const f2 = new Filter("node[amenity]")

    assert.equal(f1.isSupersetOf(f2), false, f1.toString() + " should not be a super set of " + f2.toString())
    assert.equal(f2.isSupersetOf(f1), false, f2.toString() + " should not be a super set of " + f1.toString())
  })

  it("node[amenity] - node(1)", function () {
    const f1 = new Filter("node[amenity]")
    const f2 = new Filter("node(1)")

    assert.equal(f1.isSupersetOf(f2), false, f1.toString() + " should not be a super set of " + f2.toString())
    assert.equal(f2.isSupersetOf(f1), false, f2.toString() + " should not be a super set of " + f1.toString())
  })

  it("node(id:1,2,3) - node(1)", function () {
    const f1 = new Filter("node(id:1,2,3)")
    const f2 = new Filter("node(1)")

    assert.equal(f1.isSupersetOf(f2), true, f1.toString() + " should be a super set of " + f2.toString())
    assert.equal(f2.isSupersetOf(f1), false, f2.toString() + " should not be a super set of " + f1.toString())
  })

  it("node(id:1,2,3) - node(4)", function () {
    const f1 = new Filter("node(id:1,2,3)")
    const f2 = new Filter("node(4)")

    assert.equal(f1.isSupersetOf(f2), false, f1.toString() + " should be a super set of " + f2.toString())
    assert.equal(f2.isSupersetOf(f1), false, f2.toString() + " should not be a super set of " + f1.toString())
  })

  it("node(id:1,2,3)(id:4) - node(4)", function () {
    const f1 = new Filter("node(id:1,2,3)(id:4)")
    const f2 = new Filter("node(4)")

    assert.equal(f1.isSupersetOf(f2), false, f1.toString() + " should not be a super set of " + f2.toString())
    assert.equal(f2.isSupersetOf(f1), true, f2.toString() + " should be a super set of " + f1.toString())
  })
})
