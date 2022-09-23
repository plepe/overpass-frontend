const BoundingBox = require('boundingbox')
const turf = require('./turf')

const Filter = require('./Filter')

const list = {}

class BBoxQueryCache {
  constructor (overpass, id) {
    this.overpass = overpass
    this.id = id
    this.filter = new Filter(id)
    this.area = null
  }

  /**
   * make another part of the map known
   */
  add (bbox, cacheInfo = null) {
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
  check (bbox, cacheInfo = null) {
    bbox = new BoundingBox(bbox).toGeoJSON()

    if (this.area) {
      const remaining = turf.difference(bbox, this.area)

      if (!remaining) {
        return true
      }
    }

    // check if a superset matches
    return Object.values(list).some(cache => {
      if (cache.id === this.id) { return false }

      if (cache.filter.isSupersetOf(this.filter)) {
        if (cache.area) {
          return !turf.difference(bbox, cache.area)
        }
      }

      return false
    })
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

BBoxQueryCache.get = (overpass, id) => {
  if (!(id in list)) {
    list[id] = new BBoxQueryCache(overpass, id)
  }

  return list[id]
}

BBoxQueryCache.clear = () => {
  for (const k in list) {
    delete list[k]
  }
}

BBoxQueryCache.list = list

module.exports = BBoxQueryCache
