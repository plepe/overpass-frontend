const EvaluatorOperator = require('../EvaluatorOperator')
const evaluatorHelper = require('../evaluatorHelper')

module.exports = class EvaluatorOperatorUnaryMinus extends EvaluatorOperator {
  eval (context) {
    let right = this.right.eval(context)
    if (evaluatorHelper.isNumber(right)) {
      right = parseFloat(right)
    }
    return -right
  }

  toString (options) {
    return '-' + this.right.toString(options)
  }

  toValue () {
    if (this.right.toValue() === null) {
      return null
    }
    return this.eval({})
  }

  priority () {
    return 0
  }

  compileLokiJS () {
    const right = this.right.compileLokiJS()

    if ('value' in right) {
      return { value: -right.value }
    }
    return { needMatch: true }
  }
}
