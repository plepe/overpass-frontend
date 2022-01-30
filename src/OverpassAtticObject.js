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

    this.tmpDate = null
  }

  createTmpObject (date, ob, options) {
    console.log(ob.id)
    const el = JSON.parse(JSON.stringify(ob.data))
    el.timestamp = date

    this.tmpDate = options.date
    this.tmpOb = new types[el.type](this.id)
    this.tmpOb.overpass = this.overpass
    this.tmpOb.updateData(el, options)

    return this.tmpOb
  }

  get (options) {
    if (options.date) {
      if (this.tmpDate === options.date) {
        return this.tmpOb
      }

      const matching = this.timestamps.filter(d => d <= options.date)
      if (matching.length) {
        const ob = this.versions[matching[matching.length - 1]]
        if (!ob.visible) {
          return undefined
        }

        // check for the highest timestamp of any of the member objects
        // console.log(ob.meta.timestamp, ob.memberObjects(options).map(o => o.meta.timestamp))
        const maxMemberTimestamp = ob.memberObjects(options).map(o => o.meta.timestamp).sort().reverse()[0]
        if (maxMemberTimestamp > ob.meta.timestamp) {
          // create temporary object
          return this.createTmpObject(options.date, ob, options)
        }

        return ob
      }
    } else {
      const last = this.timestamps[this.timestamps.length - 1]
      const ob = this.versions[last]
      return ob.visible ? ob : undefined
    }
  }

  updateData (el, options) {
    // TODO: el.timestamp will be undefined for referenced objects - what to do about them?
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

    if (!ob.meta) {
      ob.meta = {
        timestamp: el.timestamp,
        version: el.version
      }
    }

    this.versions[el.timestamp] = ob

    this.timestamps = Object.keys(this.versions).sort().filter(v => v !== 'undefined')
    const pos = this.timestamps.indexOf(el.timestamp)
    if (pos > 0) {
      this.versions[this.timestamps[pos - 1]].meta.endTimestamp = el.timestamp
    }
    if (this.timestamps.length > pos + 1) {
      ob.meta.endTimestamp = this.versions[this.timestamps[pos + 1]].timestamp
    }

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
