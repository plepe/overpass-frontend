const EF = require('../EvaluatorFunction')

module.exports = class EF_parantheses extends EF {
  eval (context) {
    return this.master.exec(context, this.parameters[0])
  }

  compileLokiJS () {
    return this.parameters[0]
  }
}
