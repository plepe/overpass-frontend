module.exports = class qlFunction {
  constructor () {
    this.fun = this.constructor.name
  }

  cacheDescriptors (descriptors) {
    descriptors.forEach(d => {
      d.filters += this.toString({ toString: true })
      d.properties |= this.requestProperties || 0
    })
  }
}
