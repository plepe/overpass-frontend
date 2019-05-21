var BoundingBox = require('boundingbox')

module.exports = function isBoundingBox (bbox) {
  return bbox instanceof BoundingBox
}
