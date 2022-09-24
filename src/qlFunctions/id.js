const qlFunction = require('./qlFunction')

module.exports = class id extends qlFunction {
  constructor (str) {
    super()
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
      return ['osm_id', { $eq: this.value[0] }]
    } else {
      return ['osm_id', { $in: this.value }]
    }
  }

  cacheInfo (options) {
    let v = this.value
    if (options.ids) {
      v = options.ids.filter(n => this.value.includes(n))
    }

    options.ids = v.sort()
  }

  isSupersetOf (otherValue) {
    return !otherValue.filter(id => !this.value.includes(id)).length
  }
}
