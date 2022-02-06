const OverpassObject = require('./OverpassObject')

const types = {
  node: require('./OverpassNode'),
  way: require('./OverpassWay'),
  relation: require('./OverpassRelation')
}

module.exports = class OverpassMetaObject {
  constructor (id, overpass) {
    this.id = id
    this.overpass = overpass
    this.ob = null
  }

  /**
   * Return an object
   * @param {options} - Options (currently none)
   * @returns {OverpassObject|false|null|undefined} - if an object is loaded, returns the object. If the object does not exist, returns false. If the object might exist and a query to the database server is required, return null. If the object might already be loaded and the code is waiting for further information, return undefined (no query to the database server will be done at this time).
   */
  get (options) {
    if (this.ob && !this.ob.visible) {
      return false
    }

    return this.ob
  }

  updateData (el, options) {
    if (this.ob) {
      // no new information -> return
      if (~this.ob.properties & options.properties === 0) {
        return this.ob
      }
    } else if (el.type in types) {
      this.ob = new types[el.type](this.id)
    } else {
      this.ob = new OverpassObject(this.id)
    }

    this.ob.overpass = this.overpass
    this.ob.updateData(el, options)

    return this.ob
  }

  dbInsert (db) {
    if (this.ob) {
      this.ob.dbInsert(db)
    }
  }

  emitUpdate () {
    this.ob.emit('update', this.ob)
  }

  addMissingObject (context) {
    if (!this.ob) {
      this.ob = new OverpassObject(this.id)
    }

    this.ob.visible = false
  }

  notifyMemberUpdate (memberObs) {
    this.ob.notifyMemberUpdate(memberObs)
  }
}
