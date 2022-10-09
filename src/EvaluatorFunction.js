const evaluatorExport = require('./evaluatorExport')

module.exports = class EF {
  constructor (fun, parameters, master) {
    this.fun = fun
    this.parameters = parameters
    this.master = master
  }

  toJSON () {
    return { fun: this.fun, parameters: this.parameters.map(p => evaluatorExport(p)) }
  }

  toString () {
    const param = this.parameters.map(p => p.toString())
    return this.fun + '(' + param.join(',') + ')'
  }

  compileLokiJS () {
    return { needMatch: true }
  }
}
