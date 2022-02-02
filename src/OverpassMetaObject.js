const OverpassObject = require('./OverpassObject')
const OverpassFrontend = require('./defines')

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

  get (options) {
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
    if (!this.ob.missingObject) {
      this.ob.dbInsert(db)
    }
  }

  emitUpdate () {
    this.ob.emit('update', this.ob)
  }

  addMissingObject (context) {
    this.ob = new OverpassObject()
    this.ob.id = this.id
    this.ob.type = { n: 'node', w: 'way', r: 'relation' }[this.id.substr(0, 1)]
    this.ob.osm_id = this.id.substr(1)
    this.ob.properties = OverpassFrontend.ALL
    this.ob.missingObject = true
  }

  notifyMemberUpdate (memberObs) {
    this.ob.notifyMemberUpdate(memberObs)
  }
}
