const EvaluatorFunction = require('../EvaluatorFunction')
const OverpassFrontend = require('../defines')

module.exports = class EvaluatorFunctionCountTags extends EvaluatorFunction {
  requestProperties = OverpassFrontend.TAGS

  eval (context) {
    return context.tags ? Object.keys(context.tags).length : null
  }
}
