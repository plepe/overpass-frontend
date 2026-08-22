const EvaluatorFunction = require('../EvaluatorFunction')
const GeowikiAPI = require('../defines')

module.exports = class EvaluatorFunctionCountTags extends EvaluatorFunction {
  constructor (fun, parameters) {
    super(fun, parameters)
    this.requestProperties = GeowikiAPI.TAGS
  }

  eval (context) {
    return context.tags ? Object.keys(context.tags).length : null
  }
}
