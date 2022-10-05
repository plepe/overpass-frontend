module.exports = class qlFunction {
  constructor () {
    this.fun = this.constructor.name
  }

  cacheInfo (options) {
    options.forEach(d => {
      d.filters += this.toString()
    })

    return options
  }
}
