const EF = require('../EvaluatorFunction')

module.exports = class EF_tag extends EF {
  eval (context) {
    const param = this.parameters.map(p => this.master.exec(context, p))
    return context.tags && context.tags[param[0]]
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
