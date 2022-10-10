const EvaluatorFunction = require('../EvaluatorFunction')

module.exports = class EvaluatorFunctionTag extends EvaluatorFunction {
  eval (context) {
    const param = this.parameters.map(p => this.master.exec(context, p))
    return context.tags && context.tags[param[0]]
  }

  toString () {
    const param = this.parameters[0].toString()
    return 't[' + param + ']'
  }

  compileLokiJS () {
    const param = this.parameters.map(p => this.master.compileLokiJS(p))

    if (param[0] && 'value' in param[0]) {
      const r = {}
      r['tags.' + param[0].value] = { $exists: true }
      return r
    }
  }
}
