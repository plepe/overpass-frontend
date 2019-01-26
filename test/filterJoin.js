const assert = require('assert')

const filterJoin = require('../src/filterJoin')

describe('filterJoin', function () {
  it('1', function () {
    let r = filterJoin([ '[name=a]', '[foo=bar]' ])
    assert.deepEqual(r, [ '[name=a][foo=bar]' ])
  })

  it('2', function () {
    let r = filterJoin({ or: [ '[name=a]', '[name=b]' ] })
    assert.deepEqual(r, [ '[name=a]', '[name=b]' ])
  })

  it('3', function () {
    let r = filterJoin([ { or: [ '[name=a]', '[name=b]' ] } ])
    assert.deepEqual(r, [ '[name=a]', '[name=b]' ])
  })

  it('4', function () {
    let r = filterJoin([ '[foo=bar]', { or: [ '[name=a]', '[name=b]' ] } ])
    assert.deepEqual(r, [ '[foo=bar][name=a]', '[foo=bar][name=b]' ])
  })

  it('5', function () {
    let r = filterJoin([ { or: [ '[name=a]', '[name=b]' ] }, '[foo=bar]' ])
    assert.deepEqual(r, [ '[name=a][foo=bar]', '[name=b][foo=bar]' ])
  })
})
