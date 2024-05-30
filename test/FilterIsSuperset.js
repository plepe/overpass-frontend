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

  it("node(uid:1,2,3) - node(uid:2)", function () {
    const f1 = new Filter("node(uid:1,2,3)")
    const f2 = new Filter("node(uid:2)")

    assert.equal(f1.isSupersetOf(f2), true, f1.toString() + " should be a super set of " + f2.toString())
    assert.equal(f2.isSupersetOf(f1), false, f2.toString() + " should not be a super set of " + f1.toString())
  })

  it("node(user:skunk) - node(user:'skunk')", function () {
    const f1 = new Filter("node(user:skunk)")
    const f2 = new Filter("node(user:'skunk')")

    assert.equal(f1.isSupersetOf(f2), true, f1.toString() + " should be a super set of " + f2.toString())
    assert.equal(f2.isSupersetOf(f1), true, f2.toString() + " should be a super set of " + f1.toString())
  })

  it("node(user:skunk,abc) - node(user:'skunk')", function () {
    const f1 = new Filter("node(user:skunk,abc)")
    const f2 = new Filter("node(user:'skunk')")

    assert.equal(f1.isSupersetOf(f2), true, f1.toString() + " should be a super set of " + f2.toString())
    assert.equal(f2.isSupersetOf(f1), false, f2.toString() + " should not be a super set of " + f1.toString())
  })

  it("node(around:100,48,16) - node(around:50,48,16)", function () {
    const f1 = new Filter("node(around:100,48,16)")
    const f2 = new Filter("node(around:50,48,16)")

    assert.equal(f1.isSupersetOf(f2), true, f1.toString() + " should be a super set of " + f2.toString())
    assert.equal(f2.isSupersetOf(f1), false, f2.toString() + " should not be a super set of " + f1.toString())
  })

  it("node(around:100,48,16) - node(around:50,48.0002,16.0002)", function () {
    const f1 = new Filter("node(around:100,48,16)")
    const f2 = new Filter("node(around:50,48.0002,16.0002)")

    assert.equal(f1.isSupersetOf(f2), true, f1.toString() + " should be a super set of " + f2.toString())
    assert.equal(f2.isSupersetOf(f1), false, f2.toString() + " should not be a super set of " + f1.toString())
  })

  it("node(around:100,48,16,49,17) - node(around:50,48.5,16.5)", function () {
    const f1 = new Filter("node(around:100,48,16,49,17)")
    const f2 = new Filter("node(around:50,48.5,16.5)")

    assert.equal(f1.isSupersetOf(f2), true, f1.toString() + " should be a super set of " + f2.toString())
    assert.equal(f2.isSupersetOf(f1), false, f2.toString() + " should not be a super set of " + f1.toString())
  })

  it("node(around:1000,48,16) - node(bbox:47.995,15.995,48.005,16.005)", function () {
    const f1 = new Filter("node(around:1000,48,16)")
    const f2 = new Filter("node(bbox:47.995,15.995,48.005,16.005)")

    assert.equal(f1.isSupersetOf(f2), true, f1.toString() + " should be a super set of " + f2.toString())
    assert.equal(f2.isSupersetOf(f1), false, f2.toString() + " should not be a super set of " + f1.toString())
  })

  it("node(around:1000,48,16,49,17) - node(bbox:47.995,15.995,48.005,16.005)", function () {
    const f1 = new Filter("node(around:1000,48,16,49,17)")
    const f2 = new Filter("node(bbox:48.495,16.495,48.505,16.505)")

    assert.equal(f1.isSupersetOf(f2), true, f1.toString() + " should be a super set of " + f2.toString())
    assert.equal(f2.isSupersetOf(f1), false, f2.toString() + " should not be a super set of " + f1.toString())
  })

  it("node(around:1000,48,16) - node(poly:\"47.995 15.995 48.005 15.995 48 16.005\")", function () {
    const f1 = new Filter("node(around:1000,48,16)")
    const f2 = new Filter("node(poly:\"47.995 15.995 48.005 15.995 48 16.005\")")

    assert.equal(f1.isSupersetOf(f2), true, f1.toString() + " should be a super set of " + f2.toString())
    assert.equal(f2.isSupersetOf(f1), false, f2.toString() + " should not be a super set of " + f1.toString())
  })

  it("node(around:10,48,16) - node(poly:\"47.995 15.995 48.005 15.995 48 16.005\")", function () {
    const f1 = new Filter("node(around:10,48,16)")
    const f2 = new Filter("node(poly:\"47.995 15.995 48.005 15.995 48 16.005\")")

    assert.equal(f1.isSupersetOf(f2), false, f1.toString() + " should not be a super set of " + f2.toString())
    assert.equal(f2.isSupersetOf(f1), true, f2.toString() + " should be a super set of " + f1.toString())
  })

  it("node(bbox:47.5,15.5,48.5,16.5) - node(bbox:47.95,15.95,48.05,16.05)", function () {
    const f1 = new Filter("node(47.5,15.5,48.5,16.5)")
    const f2 = new Filter("node(bbox:47.95,15.95,48.05,16.05)")

    assert.equal(f1.isSupersetOf(f2), true, f1.toString() + " should be a super set of " + f2.toString())
    assert.equal(f2.isSupersetOf(f1), false, f2.toString() + " should not be a super set of " + f1.toString())
  })

  it("(node;way;) - node", function () {
    const f1 = new Filter("(node;way;)")
    const f2 = new Filter("node")

    assert.equal(f1.isSupersetOf(f2), true, f1.toString() + " should be a super set of " + f2.toString())
    assert.equal(f2.isSupersetOf(f1), false, f2.toString() + " should not be a super set of " + f1.toString())
  })

  it("(node;way;) - way", function () {
    const f1 = new Filter("(node;way;)")
    const f2 = new Filter("way")

    assert.equal(f1.isSupersetOf(f2), true, f1.toString() + " should be a super set of " + f2.toString())
    assert.equal(f2.isSupersetOf(f1), false, f2.toString() + " should not be a super set of " + f1.toString())
  })

  it("(node;way;) - relation", function () {
    const f1 = new Filter("(node;way;)")
    const f2 = new Filter("relation")

    assert.equal(f1.isSupersetOf(f2), false, f1.toString() + " should not be a super set of " + f2.toString())
    assert.equal(f2.isSupersetOf(f1), false, f2.toString() + " should not be a super set of " + f1.toString())
  })

//  it("node[amenity] - node[amenity]&node[cuisine]", function () {
//    const f1 = new Filter("node[amenity]")
//    const f2 = new Filter({ and: [ new Filter('node[amenity]'), new Filter('node[cuisine]') ]})
//
//    assert.equal(f1.isSupersetOf(f2), true, f1.toString() + " should be a super set of " + f2.toString())
//    assert.equal(f2.isSupersetOf(f1), false, f2.toString() + " should not be a super set of " + f1.toString())
//  })
//
//  it("node[tourism] - node[amenity]&node[cuisine]", function () {
//    const f1 = new Filter("node[tourism]")
//    const f2 = new Filter({ and: [ new Filter('node[amenity]'), new Filter('node[cuisine]') ]})
//
//    assert.equal(f1.isSupersetOf(f2), false, f1.toString() + " should not be a super set of " + f2.toString())
//    assert.equal(f2.isSupersetOf(f1), false, f2.toString() + " should not be a super set of " + f1.toString())
//  })

  it("node(if:t['amenity'] && t['tourism']) - node(if:t['amenity'])", function () {
    const f1 = new Filter("node(if:t['amenity'] && t['tourism'])")
    const f2 = new Filter("node(if:t['amenity'])")

    assert.equal(f1.isSupersetOf(f2), false, f1.toString() + " should be a super set of " + f2.toString())
    assert.equal(f2.isSupersetOf(f1), true, f2.toString() + " should not be a super set of " + f1.toString())
  })

  it("node(if:t['amenity']) - node(if:t['amenity'] && t['tourism'])", function () {
    const f1 = new Filter("node(if:t['amenity'])")
    const f2 = new Filter("node(if:t['amenity'] && t['tourism'])")

    assert.equal(f1.isSupersetOf(f2), true, f1.toString() + " should be a super set of " + f2.toString())
    assert.equal(f2.isSupersetOf(f1), false, f2.toString() + " should not be a super set of " + f1.toString())
  })

  it("node(if:id() < 1000) - node(if:id() < 100)", function () {
    const f1 = new Filter("node(if:id() < 1000)")
    const f2 = new Filter("node(if:id() < 100)")

    assert.equal(f1.isSupersetOf(f2), true, f1.toString() + " should be a super set of " + f2.toString())
    assert.equal(f2.isSupersetOf(f1), false, f2.toString() + " should not be a super set of " + f1.toString())
  })

  it("node(if:1000 > id()) - node(if:100 > id())", function () {
    const f1 = new Filter("node(if:1000 > id())")
    const f2 = new Filter("node(if:100 > id())")

    assert.equal(f1.isSupersetOf(f2), true, f1.toString() + " should be a super set of " + f2.toString())
    assert.equal(f2.isSupersetOf(f1), false, f2.toString() + " should not be a super set of " + f1.toString())
  })

  it("node(if:id() <= 100) - node(if:id() < 100)", function () {
    const f1 = new Filter("node(if:id() <= 100)")
    const f2 = new Filter("node(if:id() < 100)")

    assert.equal(f1.isSupersetOf(f2), true, f1.toString() + " should be a super set of " + f2.toString())
    assert.equal(f2.isSupersetOf(f1), false, f2.toString() + " should not be a super set of " + f1.toString())
  })

  it("node(if:id() <= 99) - node(if:id() < 100)", function () {
    const f1 = new Filter("node(if:id() <= 99)")
    const f2 = new Filter("node(if:id() < 100)")

    assert.equal(f1.isSupersetOf(f2), false, f1.toString() + " should be a super set of " + f2.toString())
    assert.equal(f2.isSupersetOf(f1), true, f2.toString() + " should not be a super set of " + f1.toString())
  })

  it("node(if:id() <= 100) - node(if:id() == 100)", function () {
    const f1 = new Filter("node(if:id() <= 100)")
    const f2 = new Filter("node(if:id() == 100)")

    assert.equal(f1.isSupersetOf(f2), true, f1.toString() + " should be a super set of " + f2.toString())
    assert.equal(f2.isSupersetOf(f1), false, f2.toString() + " should not be a super set of " + f1.toString())
  })

  it("node(if:id() <= 100) - node(if:id() == 50)", function () {
    const f1 = new Filter("node(if:id() <= 100)")
    const f2 = new Filter("node(if:id() == 50)")

    assert.equal(f1.isSupersetOf(f2), true, f1.toString() + " should be a super set of " + f2.toString())
    assert.equal(f2.isSupersetOf(f1), false, f2.toString() + " should not be a super set of " + f1.toString())
  })

  it("node(if:id() <= 100) - node(if:id() == 150)", function () {
    const f1 = new Filter("node(if:id() <= 100)")
    const f2 = new Filter("node(if:id() == 150)")

    assert.equal(f1.isSupersetOf(f2), false, f1.toString() + " should not be a super set of " + f2.toString())
    assert.equal(f2.isSupersetOf(f1), false, f2.toString() + " should not be a super set of " + f1.toString())
  })

  it("node(if:id() <= 100) - node(if:id() != 150)", function () {
    const f1 = new Filter("node(if:id() <= 100)")
    const f2 = new Filter("node(if:id() != 150)")

    assert.equal(f1.isSupersetOf(f2), false, f1.toString() + " should not be a super set of " + f2.toString())
    assert.equal(f2.isSupersetOf(f1), false, f2.toString() + " should not be a super set of " + f1.toString())
  })

  it("node(if:id() <= 100) - node(if:id() > 5 && id() < 50)", function () {
    const f1 = new Filter("node(if:id() <= 100)")
    const f2 = new Filter("node(if:id() > 5 && id() < 50)")

    assert.equal(f1.isSupersetOf(f2), true, f1.toString() + " should be a super set of " + f2.toString())
    assert.equal(f2.isSupersetOf(f1), false, f2.toString() + " should not be a super set of " + f1.toString())
  })

  it("node(if:id() <= 100) - node(if:id() > 5 && id() < 150)", function () {
    const f1 = new Filter("node(if:id() <= 100)")
    const f2 = new Filter("node(if:id() > 5 && id() < 150)")

    assert.equal(f1.isSupersetOf(f2), false, f1.toString() + " should not be a super set of " + f2.toString())
    assert.equal(f2.isSupersetOf(f1), false, f2.toString() + " should not be a super set of " + f1.toString())
  })

  it("node(if:id() >= 5 && id() <= 100) - node(if:id() > 5 && id() < 50)", function () {
    const f1 = new Filter("node(if:id() >= 5 && id() <= 100)")
    const f2 = new Filter("node(if:id() > 5 && id() < 50)")

    assert.equal(f1.isSupersetOf(f2), true, f1.toString() + " should be a super set of " + f2.toString())
    assert.equal(f2.isSupersetOf(f1), false, f2.toString() + " should not be a super set of " + f1.toString())
  })

  it("node(if:id() >= 5 && id() <= (2 * 100)) - node(if:id() > 5 && id() < 50)", function () {
    const f1 = new Filter("node(if:id() >= 5 && id() <= (2 * 100))")
    const f2 = new Filter("node(if:id() > 5 && id() < 50)")

    assert.equal(f1.isSupersetOf(f2), true, f1.toString() + " should be a super set of " + f2.toString())
    assert.equal(f2.isSupersetOf(f1), false, f2.toString() + " should not be a super set of " + f1.toString())
  })

  it("node(newer:'2020-01-01T00:00:00Z') - node(newer:'2022-01-01T00:00:00Z')", function () {
    const f1 = new Filter("node(newer:'2020-01-01T00:00:00Z')")
    const f2 = new Filter("node(newer:'2022-01-01T00:00:00Z')")

    assert.equal(f1.isSupersetOf(f2), true, f1.toString() + " should be a super set of " + f2.toString())
    assert.equal(f2.isSupersetOf(f1), false, f2.toString() + " should not be a super set of " + f1.toString())
  })

  it("node(properties: 15) - node(properties: 4)", function () {
    const f1 = new Filter("node(properties: 15)")
    const f2 = new Filter("node(properties: 4)")

    assert.equal(f1.isSupersetOf(f2), true, f1.toString() + " should be a super set of " + f2.toString())
    assert.equal(f2.isSupersetOf(f1), false, f2.toString() + " should not be a super set of " + f1.toString())
  })

  it("node(properties: 15) - node(properties: 16)", function () {
    const f1 = new Filter("node(properties: 15)")
    const f2 = new Filter("node(properties: 16)")

    assert.equal(f1.isSupersetOf(f2), false, f1.toString() + " should not be a super set of " + f2.toString())
    assert.equal(f2.isSupersetOf(f1), false, f2.toString() + " should not be a super set of " + f1.toString())
  })

  it("node(properties: 15) - node(properties: 4)(properties:11)", function () {
    const f1 = new Filter("node(properties: 15)")
    const f2 = new Filter("node(properties:4)(properties: 11)")

    assert.equal(f1.isSupersetOf(f2), true, f1.toString() + " should be a super set of " + f2.toString())
    assert.equal(f2.isSupersetOf(f1), false, f2.toString() + " should not be a super set of " + f1.toString())
  })
  it("node;nwr._[cuisine]; - nwr[cuisine];node._;", function () {
    const f1 = new Filter("node;nwr._[cuisine];")
    const f2 = new Filter("nwr[cuisine];node._;")

    assert.equal(f1.isSupersetOf(f2), true, f1.toString() + " should be a super set of " + f2.toString())
    assert.equal(f2.isSupersetOf(f1), true, f2.toString() + " should be a super set of " + f1.toString())
  })
  it("relation[a];node(r); - node;", function () {
    const f1 = new Filter("relation[a];node(r);")
    const f2 = new Filter("node;")

    assert.equal(f1.isSupersetOf(f2), false, f1.toString() + " should not be a super set of " + f2.toString())
    assert.equal(f2.isSupersetOf(f1), true, f2.toString() + " should be a super set of " + f1.toString())
  })
  it("relation;node(r); - relation[a];node(r);", function () {
    const f1 = new Filter("relation;node(r);")
    const f2 = new Filter("relation[a];node(r);")

    assert.equal(f1.isSupersetOf(f2), true, f1.toString() + " should be a super set of " + f2.toString())
    assert.equal(f2.isSupersetOf(f1), false, f2.toString() + " should not be a super set of " + f1.toString())
  })
  it("(relation[a];relation[b];);node(r); - relation[a];node(r);", function () {
    const f1 = new Filter("(relation[a];relation[b];);node(r);")
    const f2 = new Filter("relation[a];node(r);")

    assert.equal(f1.isSupersetOf(f2), true, f1.toString() + " should be a super set of " + f2.toString())
    assert.equal(f2.isSupersetOf(f1), false, f2.toString() + " should not be a super set of " + f1.toString())
  })
  it("(relation[a];relation[b];)->._;node(r); - node;", function () {
    const f1 = new Filter("(relation[a];relation[b];)->._;node(r);")
    const f2 = new Filter("node;")

    assert.equal(f1.isSupersetOf(f2), false, f1.toString() + " should not be a super set of " + f2.toString())
    assert.equal(f2.isSupersetOf(f1), true, f2.toString() + " should be a super set of " + f1.toString())
  })
  it("node;nwr._[cuisine]; - nwr[cuisine];node._[cuisine];", function () {
    const f1 = new Filter("node;nwr._[cuisine];")
    const f2 = new Filter("nwr[cuisine];node._[cuisine];")

    assert.equal(f1.isSupersetOf(f2), true, f1.toString() + " should be a super set of " + f2.toString())
    assert.equal(f2.isSupersetOf(f1), true, f2.toString() + " should be a super set of " + f1.toString())
  })
  it("node;nwr._[cuisine]; - nwr[cuisine];node._[cuisine];", function () {
    const f1 = new Filter("node;nwr._[cuisine];")
    const f2 = new Filter("nwr[cuisine];node._[cuisine];")

    assert.equal(f1.isSupersetOf(f2), true, f1.toString() + " should be a super set of " + f2.toString())
    assert.equal(f2.isSupersetOf(f1), true, f2.toString() + " should be a super set of " + f1.toString())
  })
  it("(node;way;)->._;nwr._[cuisine]; - node[cuisine];", function () {
    const f1 = new Filter("(node;way;)->._;nwr._[cuisine];")
    const f2 = new Filter("node[cuisine];")

    console.log(1)
    assert.equal(f1.isSupersetOf(f2), true, f1.toString() + " should be a super set of " + f2.toString())
    console.log(2)
    assert.equal(f2.isSupersetOf(f1), false, f2.toString() + " should not be a super set of " + f1.toString())
  })
  it("way;node; - node;", function () {
    const f1 = new Filter("way;node;")
    const f2 = new Filter("node;")

    assert.equal(f1.isSupersetOf(f2), true, f1.toString() + " should be a super set of " + f2.toString())
    assert.equal(f2.isSupersetOf(f1), true, f2.toString() + " should be a super set of " + f1.toString())
  })
  it("way;node._; - node;", function () {
    const f1 = new Filter("way;node._;")
    const f2 = new Filter("node;")

    assert.equal(f1.isSupersetOf(f2), false, f1.toString() + " should not be a super set of " + f2.toString())
    assert.equal(f2.isSupersetOf(f1), true, f2.toString() + " should be a super set of " + f1.toString())
  })
  it("relation;node(r); - node;", function () {
    const f1 = new Filter("relation;node(r);")
    const f2 = new Filter("node;")

    assert.equal(f1.isSupersetOf(f2), false, f1.toString() + " should not be a super set of " + f2.toString())
    assert.equal(f2.isSupersetOf(f1), true, f2.toString() + " should be a super set of " + f1.toString())
  })

  /** TODO
  it("node - nwr(if:type()=='node')", function () {
    const f1 = new Filter("node")
    const f2 = new Filter("nwr(if:type()=='node')")

    assert.equal(f1.isSupersetOf(f2), true, f1.toString() + " should be a super set of " + f2.toString())
    assert.equal(f2.isSupersetOf(f1), true, f2.toString() + " should be a super set of " + f1.toString())
  })

  it("node[amenity] - node(if:t['amenity'])", function () {
    const f1 = new Filter("node[amenity]")
    const f2 = new Filter("node(if:t['amenity'])")

    assert.equal(f1.isSupersetOf(f2), true, f1.toString() + " should be a super set of " + f2.toString())
    assert.equal(f2.isSupersetOf(f1), true, f2.toString() + " should be a super set of " + f1.toString())
  })
  */
})
