const assert = require('assert')

const isFileURL = require('../src/isFileURL')

const list = {
  'invalid': true,
  'foo://bar': false,
  'http://domaindoesnotexist.foo': false,
  'http://domaindoesnotexist.foo/file.osm': true,
  'file.osm': true
}

describe('isFileURL', function () {
  Object.entries(list).forEach(([ url, expected ]) => {
    it(url, function () {
      const result = isFileURL(url)
      assert.equal(result, expected)
    })
  })
})
