var Quadtree = require('quadtree-lookup')

function toQuadtreeLookupBox (boundingbox) {
  return new Quadtree.Box(
    new Quadtree.Point(boundingbox.minlat, boundingbox.minlon),
    new Quadtree.Point(boundingbox.maxlat, boundingbox.maxlon)
  )
}

module.exports = toQuadtreeLookupBox
