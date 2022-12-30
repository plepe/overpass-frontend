const qlFunction = require('./qlFunction')

module.exports = class properties extends qlFunction {
  constructor (str) {
    super()
    this.fun = 'properties'

    this.value = parseInt(str)
  }

  test (ob) {
    return !!(ob.properties & this.value)
  }

  toString (options) {
    if (options.toString === true) {
      return '(properties:' + this.value + ')'
    }

    return ''
  }

  compileLokiJS () {
    return { needMatch: true }
  }

  cacheDescriptors (descriptors) {
    descriptors.forEach(o => {
      o.properties |= this.value
    })
  }

  isSupersetOf (other) {
    if (other instanceof properties) {
      return (other.value & this.value) === other.value
    }
  }
}
