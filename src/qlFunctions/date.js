// This is not expected to be used by queries, only for the cacheDescriptors
const OverpassFrontend = require('../defines')
const qlFunction = require('./qlFunction')
const isodate = require('../isodate')

module.exports = class date extends qlFunction {
  constructor (str) {
    super()
    this.value = str
    this.requestProperties = OverpassFrontend.META
  }

  test (ob) {
    return true
  }

  toString (options) {
    if (options.toString === true) {
      return '(date:' + this.value + ')'
    }

    return ''
  }

  compileLokiJS () {
    const result = { needMatch: true }

    if (this.value) {
      result.timestamp = { $lte: isodate(this.value) }
    }

    return result
  }

  isSupersetOf (other) {
  }
}
