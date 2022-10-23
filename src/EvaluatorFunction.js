const evaluatorExport = require('./evaluatorExport')
const EvaluatorPart = require('./EvaluatorPart')
const EvaluatorValue = require('./EvaluatorValue')

module.exports = class EvaluatorFunction extends EvaluatorPart {
  constructor (fun, parameters) {
    super()
    this.fun = fun
    this.parameters = parameters
  }

  toJSON () {
    return { fun: this.fun, parameters: this.parameters.map(p => evaluatorExport(p)) }
  }

  toString (options) {
    const param = this.parameters.map(p => p.toString(options))
    return this.fun + '(' + param.join(',') + ')'
  }

  toValue () {
    return null
  }

  simplify () {
    const v = this.toValue()
    if (v !== null) {
      return new EvaluatorValue(v)
    }
    const param = this.parameters.map(p => p.simplify())
    return new this.constructor(this.fun, param)
  }

  compileLokiJS () {
    return { needMatch: true }
  }

  calcRequestProperties () {
    let result = this.requestProperties
    this.parameters.forEach(p => {
      result |= p.calcRequestProperties()
    })
    return result
  }
}
