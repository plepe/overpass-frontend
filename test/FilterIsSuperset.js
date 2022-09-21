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

  it("node[amenity~'^(restaurant|cafe)$'] - node[amenity=restaurant]", function () {
    const f1 = new Filter("node[amenity~'^(restaurant|cafe)$']")
    const f2 = new Filter("node[amenity=restaurant]")

    assert.equal(f1.isSupersetOf(f2), true, f1.toString() + " should be a super set of " + f2.toString())
    assert.equal(f2.isSupersetOf(f1), false, f2.toString() + " should not be a super set of " + f1.toString())
  })

  it("node[amenity~'^(restaurant|cafe)$'] - node[amenity=Restaurant]", function () {
    const f1 = new Filter("node[amenity~'^(restaurant|cafe)$']")
    const f2 = new Filter("node[amenity=Restaurant]")

    assert.equal(f1.isSupersetOf(f2), false, f1.toString() + " should not be a super set of " + f2.toString())
    assert.equal(f2.isSupersetOf(f1), false, f2.toString() + " should not be a super set of " + f1.toString())
  })

  it("node[amenity~'^(restaurant|cafe)$',i] - node[amenity=Restaurant]", function () {
    const f1 = new Filter("node[amenity~'^(restaurant|cafe)$',i]")
    const f2 = new Filter("node[amenity=Restaurant]")

    assert.equal(f1.isSupersetOf(f2), true, f1.toString() + " should be a super set of " + f2.toString())
    assert.equal(f2.isSupersetOf(f1), false, f2.toString() + " should not be a super set of " + f1.toString())
  })

  it("node[amenity~'^(restaurant|cafe)$'] - node[amenity=bar]", function () {
    const f1 = new Filter("node[amenity~'^(restaurant|cafe)$']")
    const f2 = new Filter("node[amenity=bar]")

    assert.equal(f1.isSupersetOf(f2), false, f1.toString() + " should not be a super set of " + f2.toString())
    assert.equal(f2.isSupersetOf(f1), false, f2.toString() + " should not be a super set of " + f1.toString())
  })

  it("node[~'^(amenity|tourism)$'~'^(restaurant|cafe)$'] - node[amenity=bar]", function () {
    const f1 = new Filter("node[~'^(amenity|tourism)$'~'^(restaurant|cafe)$']")
    const f2 = new Filter("node[amenity=restaurant]")

    assert.equal(f1.isSupersetOf(f2), true, f1.toString() + " should be a super set of " + f2.toString())
    assert.equal(f2.isSupersetOf(f1), false, f2.toString() + " should not be a super set of " + f1.toString())
  })

  it("node[~'^(amenity|tourism)$'~'^(restaurant|cafe)$'] - node[amenity=bar]", function () {
    const f1 = new Filter("node[~'^(amenity|tourism)$'~'^(restaurant|cafe)$']")
    const f2 = new Filter("node[amenity=bar]")

    assert.equal(f1.isSupersetOf(f2), false, f1.toString() + " should not be a super set of " + f2.toString())
    assert.equal(f2.isSupersetOf(f1), false, f2.toString() + " should not be a super set of " + f1.toString())
  })

  it("node[~'^(amenity|tourism)$'~'^(restaurant|cafe)$'] - node[historic=restaurant]", function () {
    const f1 = new Filter("node[~'^(amenity|tourism)$'~'^(restaurant|cafe)$']")
    const f2 = new Filter("node[historic=restaurant]")

    assert.equal(f1.isSupersetOf(f2), false, f1.toString() + " should not be a super set of " + f2.toString())
    assert.equal(f2.isSupersetOf(f1), false, f2.toString() + " should not be a super set of " + f1.toString())
  })

  it("node[~'^(amenity|tourism)$'~'^(restaurant|cafe)$'] - node[Amenity=restaurant]", function () {
    const f1 = new Filter("node[~'^(amenity|tourism)$'~'^(restaurant|cafe)$']")
    const f2 = new Filter("node[Amenity=restaurant]")

    assert.equal(f1.isSupersetOf(f2), false, f1.toString() + " should not be a super set of " + f2.toString())
    assert.equal(f2.isSupersetOf(f1), false, f2.toString() + " should not be a super set of " + f1.toString())
  })

  it("node[~'^(amenity|tourism)$'~'^(restaurant|cafe)$',i] - node[Amenity=restaurant]", function () {
    const f1 = new Filter("node[~'^(amenity|tourism)$'~'^(restaurant|cafe)$',i]")
    const f2 = new Filter("node[Amenity=restaurant]")

    assert.equal(f1.isSupersetOf(f2), true, f1.toString() + " should be a super set of " + f2.toString())
    assert.equal(f2.isSupersetOf(f1), false, f2.toString() + " should not be a super set of " + f1.toString())
  })

  it("node[~'^(amenity|tourism)$'~'^(restaurant|cafe)$',i] - node[Amenity=Restaurant]", function () {
    const f1 = new Filter("node[~'^(amenity|tourism)$'~'^(restaurant|cafe)$',i]")
    const f2 = new Filter("node[Amenity=Restaurant]")

    assert.equal(f1.isSupersetOf(f2), true, f1.toString() + " should be a super set of " + f2.toString())
    assert.equal(f2.isSupersetOf(f1), false, f2.toString() + " should not be a super set of " + f1.toString())
  })

  it("node[~'^(amenity|tourism)$'~'.'] - node[amenity=restaurant]", function () {
    const f1 = new Filter("node[~'^(amenity|tourism)$'~'.']")
    const f2 = new Filter("node[amenity=restaurant]")

    assert.equal(f1.isSupersetOf(f2), true, f1.toString() + " should be a super set of " + f2.toString())
    assert.equal(f2.isSupersetOf(f1), false, f2.toString() + " should not be a super set of " + f1.toString())
  })

  it("node[~'^(amenity|tourism)$'~'.'] - node[Amenity=restaurant]", function () {
    const f1 = new Filter("node[~'^(amenity|tourism)$'~'.']")
    const f2 = new Filter("node[Amenity=restaurant]")

    assert.equal(f1.isSupersetOf(f2), false, f1.toString() + " should not be a super set of " + f2.toString())
    assert.equal(f2.isSupersetOf(f1), false, f2.toString() + " should not be a super set of " + f1.toString())
  })

  it("node[~'^(amenity|tourism)$'~'.',i] - node[Amenity=restaurant]", function () {
    const f1 = new Filter("node[~'^(amenity|tourism)$'~'.',i]")
    const f2 = new Filter("node[Amenity=restaurant]")

    assert.equal(f1.isSupersetOf(f2), true, f1.toString() + " should be a super set of " + f2.toString())
    assert.equal(f2.isSupersetOf(f1), false, f2.toString() + " should not be a super set of " + f1.toString())
  })

  it("node[~'^(amenity|tourism)$'~'.'] - node[amenity!=restaurant]", function () {
    const f1 = new Filter("node[~'^(amenity|tourism)$'~'.']")
    const f2 = new Filter("node[amenity!=restaurant]")

    assert.equal(f1.isSupersetOf(f2), false, f1.toString() + " should not be a super set of " + f2.toString())
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

  it("(node;way;) - node", function () {
    const f1 = new Filter("(node;way;)")
    const f2 = new Filter("node")

    assert.equal(f1.isSupersetOf(f2), true, f1.toString() + " should be a super set of " + f2.toString())
    assert.equal(f2.isSupersetOf(f1), false, f2.toString() + " should not be a super set of " + f1.toString())
  })

  it("(node;way;) - relation", function () {
    const f1 = new Filter("(node;way;)")
    const f2 = new Filter("relation")

    assert.equal(f1.isSupersetOf(f2), false, f1.toString() + " should not be a super set of " + f2.toString())
    assert.equal(f2.isSupersetOf(f1), false, f2.toString() + " should not be a super set of " + f1.toString())
  })

  it("node[amenity] - node[amenity]&node[cuisine]", function () {
    const f1 = new Filter("node[amenity]")
    const f2 = new Filter({ and: [ new Filter('node[amenity]'), new Filter('node[cuisine]') ]})

    assert.equal(f1.isSupersetOf(f2), true, f1.toString() + " should be a super set of " + f2.toString())
    assert.equal(f2.isSupersetOf(f1), false, f2.toString() + " should not be a super set of " + f1.toString())
  })

  it("node[tourism] - node[amenity]&node[cuisine]", function () {
    const f1 = new Filter("node[tourism]")
    const f2 = new Filter({ and: [ new Filter('node[amenity]'), new Filter('node[cuisine]') ]})

    assert.equal(f1.isSupersetOf(f2), false, f1.toString() + " should not be a super set of " + f2.toString())
    assert.equal(f2.isSupersetOf(f1), false, f2.toString() + " should not be a super set of " + f1.toString())
  })
})
