const BoundingBox = require('boundingbox')
const turf = require('./turf')

const Filter = require('./Filter')

class BBoxQueryCache {
  constructor (overpass) {
    this.overpass = overpass
    this.list = {}
  }

  get (descriptor) {
    const id = descriptor.id
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
  add (cacheDescriptor) {
    // ignore requests for IDs
    if (cacheDescriptor.ids) {
      return
    }

    const bbox = cacheDescriptor.bounds ?? new BoundingBox().toGeoJSON()

    if (this.area === null) {
      this.area = bbox
    } else {
      this.area = turf.union(bbox, this.area)
    }

    if (cacheDescriptor.recurse) {
      if (!this.recurse) {
        this.recurse = new BBoxQueryCache(this.main.overpass)
      }

      cacheDescriptor.recurse.forEach(cd => {
        const cache = this.recurse.get(cd)
        cache.add(cd)
      })
    }
  }

  /**
   * is the whole area known?
   */
  check (cacheDescriptor, _norek = false) {
    if (cacheDescriptor.invalid) {
      return true
    }

    if (cacheDescriptor && cacheDescriptor.ids) {
      const type = this.filter.getStatement().type
      const types = type === 'nwr' ? ['node', 'way', 'relation'] : [type]

      const result = types.every(type =>
        cacheDescriptor.ids.every(id =>
          (type.substr(0, 1) + id) in this.main.overpass.cacheElements
        )
      )

      if (!result) {
        return false
      }

      if (this.checkRecurses(cacheDescriptor)) {
        return true
      }
    }

    const bbox = cacheDescriptor.bounds ?? new BoundingBox().toGeoJSON()

    if (this.area) {
      const remaining = turf.difference(bbox, this.area)

      if (!remaining && this.checkRecurses(cacheDescriptor)) {
        return true
      }
    }

    if (_norek) {
      return false
    }

    // check if a superset matches
    return Object.values(this.main.list).some(cache => {
      if (cache.filter.isSupersetOf(this.filter)) {
        if (cache.check(cacheDescriptor, true)) {
          return true
        }
      }

      return false
    })
  }

  checkRecurses (cacheDescriptor) {
    if (cacheDescriptor.recurse) {
      if (!this.recurse) {
        return true
      }

      return cacheDescriptor.recurse.every(cd => {
        const cache = this.recurse.get(cd)
        return cache.check(cd)
      })
    }

    return true
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
