const EvaluatorFunction = require('../EvaluatorFunction')

module.exports = class EvaluatorFunctionLength extends EvaluatorFunction {
  eval (context) {
    const value = this.parameters[0].eval(context)
    console.log(value)
    return value
  }

  toString (options) {
    const param = this.parameters.map(p => p.toString(options))
    if (options.toString === true) {
      return this.fun + '(' + param.join(',') + ')'
    }
    return param.join(',')
  }

  toValue () {
    return this.parameters[0].toValue()
  }

  compileLokiJS () {
    return this.parameters[0].compileLokiJS()
  }
}
