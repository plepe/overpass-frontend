module.exports = class qlFunction {
  cacheDescriptors (descriptors) {
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
}
