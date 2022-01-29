const OverpassObject = require('./OverpassObject')
const OverpassNode = require('./OverpassNode')
const OverpassWay = require('./OverpassWay')
const OverpassRelation = require('./OverpassRelation')

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
    } else if (el.type === 'relation') {
      this.ob = new OverpassRelation(this.id)
    } else if (el.type === 'way') {
      this.ob = new OverpassWay(this.id)
    } else if (el.type === 'node') {
      this.ob = new OverpassNode(this.id)
    } else {
      this.ob = new OverpassObject(this.id)
    }

    this.ob.overpass = this.overpass
    this.ob.updateData(el, options)

    return this.ob
  }

  dbInsert (db) {
    this.ob.dbInsert(db)
  }
}
