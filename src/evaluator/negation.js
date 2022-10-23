const EvaluatorOperator = require('../EvaluatorOperator')
const evaluatorHelper = require('../evaluatorHelper')

module.exports = class EvaluatorOperatorNegation extends EvaluatorOperator {
  eval (context) {
    let right = this.right.eval(context)
    if (evaluatorHelper.isNumber(right)) {
      right = parseFloat(right)
    }
    return right ? 0 : 1
  }

  priority () {
    return 1
  }

  toString (options) {
    return '!' + this.right.toString(options)
  }

  toValue () {
    if (this.right.toValue() === null) {
      return null
    }
    return this.eval({})
  }

  compileLokiJS () {
    const right = this.right.compileLokiJS()

    if ('value' in right) {
      return { value: !right.value }
    }
    if (right !== null && typeof right === 'object') {
      const k = Object.keys(right)
      if (k.length === 1 && 'needMatch' in right) {
        return { needMatch: true }
      } else if (k.length === 1 && '$exists' in right[k]) {
        right[k].$exists = !right[k].$exists
        return right
      }
    }
    return { needMatch: true }
  }
}
