const assert = require('assert').strict

module.exports = function ({ ob, boundingboxes, expected }) {
  Object.keys(boundingboxes).forEach(k => {
    if (!(k in expected)) {
      assert.fail('no expected result for test "' + k + '"')
    }

    const result = ob.intersects(boundingboxes[k])
    assert.equal(result, expected[k], 'intersects test "' + k + '"')
  })

  Object.keys(expected).forEach(k => {
    if (!(k in boundingboxes)) {
      assert.fail('no bounding box for test "' + k + '"')
    }
  })
}
