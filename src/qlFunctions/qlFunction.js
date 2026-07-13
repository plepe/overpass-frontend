module.exports = class qlFunction {
  constructor (str) {
    this.value = str
    this.fun = this.constructor.fun
  }

  cacheDescriptors (descriptors, options) {
    descriptors.forEach(d => {
      d.filters += this.toString()
      d.properties |= this.properties()
    })
  }

  properties () {
    return 0
  }

  possibleBounds (ob) {
    return null
  }

  test (ob) {
    throw new Error('qlFunction ' + this.fun + ': test not implemented')
  }

  toString () {
    return '(' + this.fun + ':' + this.value + ')'
  }

  compileLokiJS () {
    return { needMatch: true }
  }
}
