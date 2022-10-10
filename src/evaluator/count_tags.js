const EvaluatorFunction = require('../EvaluatorFunction')

module.exports = class EvaluatorFunctionCountTags extends EvaluatorFunction {
  eval (context) {
    return context.tags ? Object.keys(context.tags).length : null
  }
}
