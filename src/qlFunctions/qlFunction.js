module.exports = class qlFunction {
  cacheDescriptors (descriptors) {
    descriptors.forEach(d => {
      d.filters += this.toString({ toString: true })
      d.properties |= this.requestProperties || 0
    })
  }
}
