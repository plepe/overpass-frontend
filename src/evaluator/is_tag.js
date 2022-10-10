const EvaluatorFunction = require('../EvaluatorFunction')

module.exports = class EvaluatorFunctionIsTag extends EvaluatorFunction {
  eval (context) {
    const param = this.parameters.map(p => p.eval(context))
    return (context.tags && param[0] in context.tags) ? 1 : 0
  }

  compileLokiJS () {
    const param = this.parameters.map(p => p.compileLokiJS())

    if (param[0] && 'value' in param[0]) {
      const r = {}
      r['tags.' + param[0].value] = { $exists: true }
      return r
    }
  }
}
