const OverpassObject = require('./OverpassObject')

const types = {
  node: require('./OverpassNode'),
  way: require('./OverpassWay'),
  relation: require('./OverpassRelation')
}

class OverpassAtticObject {
  constructor (id, overpass) {
    this.id = id
    this.overpass = overpass
    this.versions = {}
    this.timestamps = null
  }

  get (options) {
    if (!this.timestamps) {
      this.timestamps = Object.keys(this.versions).sort()
    }

    if (options.date) {
      const matching = this.timestamps.filter(d => d <= options.date)
      if (matching.length) {
        const ob = this.versions[matching[matching.length - 1]]
        return ob.visible ? ob : undefined
      }
    } else {
      const last = this.timestamps[this.timestamps.length - 1]
      const ob = this.versions[last]
      return ob.visible ? ob : undefined
    }
  }

  updateData (el, options) {
    let ob
    if (el.timestamp in this.versions) {
      ob = this.versions[el.timestamp]
      // no new information -> return
      if (~ob.properties & options.properties === 0) {
        return ob
      }
    } else if (el.type in types) {
      ob = new types[el.type](this.id)
    } else {
      ob = new OverpassObject(this.id)
    }

    ob.overpass = this.overpass
    ob.updateData(el, options)

    this.versions[el.timestamp] = ob

    return ob
  }

  leafletFeature (options) {
    return this.getVersion(options).leafletFeature(options)
  }

  dbInsert (db) {
    Object.values(this.versions).forEach(ob => ob.dbInsert(db))
  }

  emitUpdate () {
    Object.values(this.versions).forEach(ob => ob.emit('update', ob))
  }

  notifyMemberUpdate (memberObs) {
    Object.values(this.versions).forEach(ob => ob.notifyMemberUpdate(memberObs))
  }
}

module.exports = OverpassAtticObject
