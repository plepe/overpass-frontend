const BoundingBox = require('boundingbox')
const turf = require('./turf')

let list = {}

class BBoxQueryCache {
  constructor (id) {
    this.id = id
    this.area = null
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

    const remaining = turf.difference(bbox, this.area)
    // console.log(JSON.stringify(this.area), JSON.stringify(bbox), !remaining)

    return !remaining
  }

  /**
   * clear this cache
   */
  clear () {
    this.area = null
    delete list[this.id]
  }

  /**
   * return area as (multi)polygon
   */
  toGeoJSON () {
    return this.area
  }
}

BBoxQueryCache.get = (cacheInfo) => {
  if (!(cacheInfo.id in list)) {
    list[cacheInfo.id] = new BBoxQueryCache(cacheInfo.id)
  }

  return list[cacheInfo.id]
}

BBoxQueryCache.clear = () => {
  list = {}
}

module.exports = BBoxQueryCache
