module.exports = class qlFunction {
  constructor () {
    this.fun = this.constructor.name
  }

  cacheInfo (options) {
    options.filters += this.toString()
  }
}
