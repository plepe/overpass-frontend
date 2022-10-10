const evaluatorExport = require('./evaluatorExport')
const EvaluatorPart = require('./EvaluatorPart')
const EvaluatorValue = require('./EvaluatorValue')

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

  simplify () {
    const v = this.toValue()
    if (v !== null) {
      return new EvaluatorValue(v, this.master)
    }
    const param = this.parameters.map(p => p.simplify())
    return new this.constructor(this.fun, param, this.master)
  }

  compileLokiJS () {
    return { needMatch: true }
  }
}
