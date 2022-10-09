const evaluatorExport = require('./evaluatorExport')

module.exports = class EF {
  constructor (fun, parameters, master) {
    this.fun = fun
    this.parameters = parameters
    this.master = master
  }

  export () {
    return { fun: this.fun, parameters: this.parameters.map(p => evaluatorExport(p)) }
  }

  compileLokiJS () {
    return { needMatch: true }
  }
}
