module.exports = class qlFunction {
  cacheDescriptors (descriptors) {
    descriptors.forEach(d => {
      d.filters += this.toString()
      d.properties |= this.requestProperties || 0
    })
  }
}
