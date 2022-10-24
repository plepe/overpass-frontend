const EvaluatorFunction = require('../EvaluatorFunction')

module.exports = class EvaluatorFunctionParantheses extends EvaluatorFunction {
  eval (context) {
    return this.parameters[0].eval(context)
  }

  toValue () {
    return this.parameters[0].toValue()
  }

  compileLokiJS () {
    return this.parameters[0].compileLokiJS()
  }
}
