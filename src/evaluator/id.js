const EvaluatorFunction = require('../EvaluatorFunction')

module.exports = class EvaluatorFunctionId extends EvaluatorFunction {
  eval (context) {
    return context.osm_id
  }

  compileLokiJS () {
    return { osm_id: { $exists: true } }
  }
}
