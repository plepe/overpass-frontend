const EvaluatorFunction = require('../EvaluatorFunction')

module.exports = class EvaluatorFunctionParantheses extends EvaluatorFunction {
  eval (context) {
    return this.master.exec(context, this.parameters[0])
  }

  toValue () {
    return this.parameters[0].toValue()
  }

  compileLokiJS () {
    return this.master.compileLokiJS(this.parameters[0])
  }
}
