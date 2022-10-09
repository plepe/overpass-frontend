const EF = require('../EvaluatorFunction')

module.exports = class EF_count_tags extends EF {
  eval (context) {
    return context.tags ? Object.keys(context.tags).length : null
  }
}
