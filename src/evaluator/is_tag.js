const EF = require('../EvaluatorFunction')

module.exports = class EF_is_tag extends EF {
  eval (context) {
    return context.tags && this.parameters[0] in context.tags ? 1 : 0
  }

  compileLokiJS () {
    if (this.parameters[0] && 'value' in this.parameters[0]) {
      const r = {}
      r['tags.' + this.parameters[0].value] = { $exists: true }
      return r
    }
  }
}
