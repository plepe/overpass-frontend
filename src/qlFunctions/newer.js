const OverpassFrontend = require('../defines')
const qlFunction = require('./qlFunction')
const parseString = require('../parseString')

module.exports = class newer extends qlFunction {
  constructor (str) {
    super()
    this.fun = 'newer'

    const p = parseString(str)
    if (!p && !p[1].match(/^\s*$/)) {
      throw new Error('newer expects a string with a timestamp')
    }
    this.value = p[0]
  }

  test (ob) {
    if (!ob.meta) {
      return
    }

    return ob.meta.timestamp >= this.value
  }

  toString () {
    return '(newer:"' + this.value + '")'
  }

  compileLokiJS () {
    return { 'osmMeta.timestamp': { $gte: this.value } }
  }

  isSupersetOf (other) {
    if (other instanceof newer) {
      return other.value >= this.value
    }
  }

  properties () {
    return OverpassFrontend.META
  }
}
