const EvaluatorFunction = require('../EvaluatorFunction')

module.exports = class EvaluatorFunctionType extends EvaluatorFunction {
  eval (context) {
    return context.type
  }

  compileLokiJS () {
    return { type: { $exists: true } }
  }
}
