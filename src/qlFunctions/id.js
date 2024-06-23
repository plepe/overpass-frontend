const OverpassFrontend = require('../defines')
const qlFunction = require('./qlFunction')

module.exports = class id extends qlFunction {
  constructor (str) {
    super()
    this.fun = 'id'

    if (Array.isArray(str)) {
      this.value = str
    } else {
      this.value = str.split(/,/g).map(v => parseInt(v))
    }
  }

  test (ob) {
    return this.value.includes(ob.osm_id)
  }

  toString () {
    return '(id:' + this.value.join(',') + ')'
  }

  compileLokiJS () {
    if (this.value.length === 1) {
      return { osm_id: { $eq: this.value[0] } }
    } else {
      return { osm_id: { $in: this.value } }
    }
  }

  cacheDescriptors (descriptors, options) {
    descriptors.forEach(o => {
      let v = this.value
      if (o.ids) {
        v = o.ids.filter(n => this.value.includes(n))
      }

      o.ids = v.sort()
      o.properties |= OverpassFrontend.ID_ONLY
    })
  }

  isSupersetOf (other) {
    if (other instanceof id) {
      return !other.value.filter(id => !this.value.includes(id)).length
    }
  }

  properties () {
    return OverpassFrontend.ID_ONLY
  }
}
