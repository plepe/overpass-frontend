const qlFunction = require('./qlFunction')

const Evaluator = require('../Evaluator')

module.exports = class If extends qlFunction {
  constructor (str) {
    super()
    this.fun = 'if'

    this.value = new Evaluator()
    this.value.parse(str)
  }

  test (ob) {
    return !!this.value.exec(ob)
  }

  toString (options = {}) {
    return '(if:' + this.value.toString(options) + ')'
  }

  compileLokiJS () {
    const r = this.value.compileLokiJS()
    if ('value' in r) {
      return { needMatch: !r.value } // TODO: remove needMatch; what to return if r.value is false/null/0/''?
    }
    if ('property' in r) {
      return { needMatch: true }
    }
    return r
  }

  cacheDescriptors (descriptors) {
    this.value.cacheDescriptors(descriptors)
  }

  isSupersetOf (other) {
    if (other.fun === 'if') {
      return this.value.isSupersetOf(other.value)
    }

    return false
  }

  properties () {
    return this.value.properties()
  }
}
