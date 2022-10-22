const EvaluatorOperator = require('../EvaluatorOperator')
const evaluatorHelper = require('../evaluatorHelper')

module.exports = class EvaluatorOperatorConjunction extends EvaluatorOperator {
  eval (context) {
    let left = this.left.eval(context)
    let right = this.right.eval(context)
    if (evaluatorHelper.isNumber(left) && evaluatorHelper.isNumber(right)) {
      left = parseFloat(left)
      right = parseFloat(right)
    }
    return left && right
  }

  priority () {
    return 6
  }

  toString (options) {
    return this.left.toString(options) + '&&' + this.right.toString(options)
  }

  compileLokiJS () {
    const left = this.left.compileLokiJS()
    const right = this.right.compileLokiJS()
    const leftNeedMatch = left.needMatch
    const rightNeedMatch = right.needMatch
    delete left.needMatch
    delete right.needMatch
    const leftKeys = Object.keys(left)
    const rightKeys = Object.keys(right)

    if (!leftKeys.length && rightKeys.length) {
      right.needMatch = !!(leftNeedMatch || rightNeedMatch)
      return right
    }
    if (leftKeys.length && !rightKeys.length) {
      left.needMatch = !!(leftNeedMatch || rightNeedMatch)
      return left
    }

    return { $and: [left, right], needMatch: !!(leftNeedMatch || rightNeedMatch) }
  }

  isSupersetOf (other) {
    const r = super.isSupersetOf(other)
    if (r !== undefined) {
      return r
    }

    if (this.left.isSupersetOf(other) && this.right.isSupersetOf(other)) {
      return true
    }
  }
}
