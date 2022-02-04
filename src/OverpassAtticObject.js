const OverpassObject = require('./OverpassObject')
const OverpassFrontend = require('./defines')

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
    this.originalData = {}
    this.timestamps = null

    this.tmpDate = undefined
  }

  createTmpObject (date, timestamp, options) {
    const el = JSON.parse(this.originalData[timestamp])
    el.timestamp = date

    this.tmpDate = date
    this.tmpOb = new types[el.type](this.id)
    this.tmpOb.overpass = this.overpass
    this.tmpOb.updateData(el, {})

    return this.tmpOb
  }

  get (options) {
    if (this.tmpDate && this.tmpDate === options.date) {
      return this.tmpOb
    }

    let timestamp
    if (options.date) {
      const matching = this.timestamps.filter(d => d <= options.date)
      timestamp = matching[matching.length - 1]
    } else {
      timestamp = this.timestamps[this.timestamps.length - 1]
    }

    const ob = this.versions[timestamp]
    if (!ob || !ob.visible) {
      return null
    }

    // check for the highest timestamp of any of the member objects
    const maxMemberTimestamp = ob.memberObjects(options)
      .map(o => o && o.meta && o.meta.timestamp)
      .filter(t => t)
      .sort().reverse()[0]

    if (maxMemberTimestamp && this.tmpDate === maxMemberTimestamp) {
      return this.tmpOb
    }

    if (maxMemberTimestamp > ob.meta.timestamp) {
      // create temporary object
      return this.createTmpObject(maxMemberTimestamp, timestamp)
    }

    return ob
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

    this.originalData[el.timestamp] = JSON.stringify(el)
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

  updateTimeline (entry) {
    return this.updateData({
      id: entry.ref,
      type: entry.reftype,
      version: entry.refversion,
      timestamp: entry.created,
      endTimestamp: entry.expired
    }, { properties: 0 })
  }

  getTimeline () {
    return this.timestamps.map(ts => {
      const ob = this.versions[ts]

      return {
        version: ob.meta.version,
        timestamp: ob.meta.timestamp,
        endTimestamp: ob.meta.endTimestamp
      }
    })
  }

  addMissingObject (context) {
    this.tmpDate = context.date
    this.tmpOb = new OverpassObject()
    this.tmpOb.id = this.id
    this.tmpOb.type = { n: 'node', w: 'way', r: 'relation' }[this.id.substr(0, 1)]
    this.tmpOb.osm_id = this.id.substr(1)
    this.tmpOb.properties = OverpassFrontend.ALL
    this.tmpOb.missingObject = true
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
