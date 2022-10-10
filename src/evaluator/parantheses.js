const EvaluatorFunction = require('../EvaluatorFunction')

module.exports = class EvaluatorFunctionParantheses extends EvaluatorFunction {
  eval (context) {
    return this.master.exec(context, this.parameters[0])
  }

  compileLokiJS () {
    return this.master.compileLokiJS(this.parameters[0])
  }
}
