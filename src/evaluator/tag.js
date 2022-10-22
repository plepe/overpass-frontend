const EvaluatorFunction = require('../EvaluatorFunction')
const OverpassFrontend = require('../defines')

module.exports = class EvaluatorFunctionTag extends EvaluatorFunction {
  constructor (fun, parameters) {
    super(fun, parameters)
    this.requestProperties = OverpassFrontend.TAGS
  }

  eval (context) {
    const param = this.parameters.map(p => p.eval(context))
    return context.tags && context.tags[param[0]]
  }

  toString (options) {
    const param = this.parameters[0].toString(options)
    return 't[' + param + ']'
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
