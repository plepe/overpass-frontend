const EF = require('../EvaluatorFunction')

module.exports = class EF_type extends EF {
  eval (context) {
    return context.type
  }

  compileLokiJS () {
    return { type: { $exists: true } }
  }
}
