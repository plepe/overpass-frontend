const evaluatorExport = require('./evaluatorExport')
const EvaluatorPart = require('./EvaluatorPart')

module.exports = class EvaluatorFunction extends EvaluatorPart {
  constructor (fun, parameters, master) {
    super(master)
    this.fun = fun
    this.parameters = parameters
  }

  toJSON () {
    return { fun: this.fun, parameters: this.parameters.map(p => evaluatorExport(p)) }
  }

  toString () {
    const param = this.parameters.map(p => p.toString())
    return this.fun + '(' + param.join(',') + ')'
  }

  toValue () {
    return null
  }

  compileLokiJS () {
    return { needMatch: true }
  }
}
