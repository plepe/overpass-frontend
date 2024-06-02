const BoundingBox = require('boundingbox')
const turf = require('./turf')

const Filter = require('./Filter')

class BBoxQueryCache {
  constructor (overpass) {
    this.overpass = overpass
    this.list = {}
  }

  get (id) {
    if (!(id in this.list)) {
      this.list[id] = new BBoxQueryCacheItem(this, id)
    }

    return this.list[id]
  }

  clear () {
    for (const k in this.list) {
      delete this.list[k]
    }
  }
}

class BBoxQueryCacheItem {
  constructor (main, id) {
    this.main = main
    this.id = id
    this.filter = new Filter(id)
    this.area = null
  }

  /**
   * make another part of the map known
   */
  add (bbox, cacheDescriptors = null) {
    // ignore requests for IDs
    if (cacheDescriptors && cacheDescriptors.ids) {
      return
    }

    bbox = new BoundingBox(bbox).toGeoJSON()

    if (cacheDescriptors && cacheDescriptors.bounds) {
      bbox = turf.intersect(bbox, cacheDescriptors.bounds)
    }

    if (this.area === null) {
      this.area = bbox
    } else {
      this.area = turf.union(bbox, this.area)
    }
  }

  /**
   * is the whole area known?
   */
  check (bbox, cacheDescriptors = null) {
    if (cacheDescriptors && cacheDescriptors.invalid) {
      return true
    }

    if (cacheDescriptors && cacheDescriptors.ids) {
      let types = [cacheDescriptors.id.match(/^(node|way|relation|nwr)/)[1]]
      if (types[0] === 'nwr') {
        types = ['node', 'way', 'relation']
      }

      return types.every(type =>
        cacheDescriptors.ids.every(id =>
          (type.substr(0, 1) + id) in this.main.overpass.cacheElements
        )
      )
    }

    bbox = new BoundingBox(bbox).toGeoJSON()

    if (cacheDescriptors && cacheDescriptors.bounds) {
      bbox = turf.intersect(bbox, cacheDescriptors.bounds)
    }

    if (this.area) {
      const remaining = turf.difference(bbox, this.area)

      if (!remaining) {
        return true
      }
    }

    // check if a superset matches
    return Object.values(this.main.list).some(cache => {
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
    delete this.main.list[this.id]
  }

  /**
   * return area as (multi)polygon
   */
  toGeoJSON () {
    return this.area
  }
}

module.exports = BBoxQueryCache
