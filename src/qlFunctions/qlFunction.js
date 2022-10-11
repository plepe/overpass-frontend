module.exports = class qlFunction {
  constructor () {
    this.fun = this.constructor.name
  }

  cacheDescriptors (descriptors) {
    descriptors.forEach(d => {
      d.filters += this.toString()
      d.properties |= this.requestProperties || 0
    })
  }
}
