const BoundingBox = require('boundingbox')
const turf = require('./turf')

/**
 * When loading area after area of a map, it will be more and more complete.
 * This class manages which area is already known and which not.
 */
class KnownArea {
  constructor (area = null) {
    this.area = area
  }

  /**
   * make another part of the map known
   */
  add (bbox) {
    bbox = new BoundingBox(bbox).toGeoJSON()

    if (this.area === null) {
      this.area = bbox
    } else {
      this.area = turf.union(bbox, this.area)
    }
  }

  /**
   * is the whole area known?
   */
  check (bbox) {
    if (this.area === null) {
      return false
    }

    bbox = new BoundingBox(bbox).toGeoJSON()

    let remaining = turf.difference(bbox, this.area)
    // console.log(JSON.stringify(this.area), JSON.stringify(bbox), !remaining)

    return !remaining
  }

  /**
   * return area as (multi)polygon
   */
  toGeoJSON () {
    return this.area
  }
}

module.exports = KnownArea
