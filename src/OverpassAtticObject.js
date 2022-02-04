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
    this.originalData = {}
    this.timestamps = null
    this.hasTimeline = false

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

  /**
   * Return an object
   * @param {options} - Options, e.g. date at which to query.
   * @returns {OverpassObject|false|null|undefined} - if an object is loaded, returns the object. If the object does not exist, returns false. If the object might exist and a query to the database server is required, return null. If the object might already be loaded and the code is waiting for further information, return undefined (no query to the database server will be done at this time).
   */
  get (options) {
    if (this.tmpDate === null || (this.tmpDate && this.tmpDate === options.date)) {
      return this.tmpOb
    }

    if (options.date === undefined) {
      return false
    }

    if (!this.hasTimeline) {
      this.overpass.getTimeline(this.id, {},
        (err, result) => { if (err) { console.error(err) } },
        (err) => { if (err) { console.error(err) } }
      )

      return undefined
    }

    const timestamp = this.matchingTimestamp(options)

    // before 1st version
    if (timestamp === undefined) {
      return false
    }

    const ob = this.versions[timestamp]
    if (!ob || !ob.visible) {
      return false
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
    if (this.overpass.localOnly) {
      this.hasTimeline = true
    }

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
    this.hasTimeline = true
    return this.updateData({
      id: entry.ref,
      type: entry.reftype,
      version: entry.refversion,
      timestamp: entry.created,
      endTimestamp: entry.expired
    }, { properties: 0 })
  }

  /**
   * Return the timeline of an object
   * @returns {Array|false|null} - if the timeline is known, return the list of versions. If the object does not exist, returns false. If the object might exist and a query to the database server is required, return null.
   */
  getTimeline () {
    if (this.tmpOb === false && this.tmpDate === null) {
      return false
    }

    if (!this.timestamps) {
      return null
    }

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
    if (context) {
      if (this.timestamps) {
        const matching = this.matchingTimestamp(context)
        if (matching) {
          this.versions[matching].visible = false
        }
      } else {
        this.tmpDate = context.date
      }
    } else {
      this.tmpDate = null
    }

    this.tmpOb = false
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

  matchingTimestamp (options) {
    if (options.date) {
      const matching = this.timestamps.filter(d => d <= options.date)
      return matching[matching.length - 1]
    } else {
      return this.timestamps[this.timestamps.length - 1]
    }
  }
}

module.exports = OverpassAtticObject
