const EvaluatorFunction = require('../EvaluatorFunction')

module.exports = class EvaluatorFunctionMeta extends EvaluatorFunction {
  eval (context) {
    switch (this.fun) {
      case 'id': return context.osm_id
      case 'type': return context.type
    }
  }

  compileLokiJS () {
    switch (this.fun) {
      case 'id': return { osm_id: { $exists: true } }
      case 'type': return { type: { $exists: true } }
    }
  }
}
