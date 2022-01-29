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
    this.ob.dbInsert(db)
  }
}
