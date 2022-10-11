const OverpassFrontend = require('../defines')
const qlFunction = require('./qlFunction')

module.exports = class uid extends qlFunction {
  requestProperties = OverpassFrontend.META

  constructor (str) {
    super()
    this.value = str.split(/,/g).map(v => {
      if (!v.match(/^\s*\d+\s*/)) {
        throw new Error('Error parsing uid filter, expect a numeric value: "' + v + '"')
      }

      return parseInt(v)
    })
  }

  test (ob) {
    if (!ob.meta) {
      return
    }

    return this.value.includes(ob.meta.uid)
  }

  toString () {
    return '(uid:' + this.value.join(',') + ')'
  }

  compileLokiJS () {
    if (this.value.length === 1) {
      return { 'osmMeta.uid': { $eq: this.value[0] } }
    } else {
      return { 'osmMeta.uid': { $in: this.value } }
    }
  }

  isSupersetOf (other) {
    if (other instanceof uid) {
      return !other.value.filter(id => !this.value.includes(id)).length
    }
  }
}
