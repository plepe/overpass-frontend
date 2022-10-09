const EO = require('../EvaluatorOperator')
const evaluatorHelper = require('../evaluatorHelper')

module.exports = class EO_unaryMinus extends EO {
  eval (context) {
    let right = this.master.exec(context, this.right)
    if (evaluatorHelper.isNumber(right)) {
      right = parseFloat(right)
    }
    return -right
  }

  toString () {
    return '-' + this.right.toString()
  }

  priority () {
    return 0
  }

  compileLokiJS () {
    const right = this.master.compileLokiJS(this.right)

    if ('value' in right) {
      return { value: -right.value }
    }
    return { needMatch: true }
  }
}
