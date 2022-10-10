const EvaluatorOperator = require('../EvaluatorOperator')
const evaluatorHelper = require('../evaluatorHelper')

module.exports = class EvaluatorOperatorConjunction extends EvaluatorOperator {
  eval (context) {
    let left = this.master.exec(context, this.left)
    let right = this.master.exec(context, this.right)
    if (evaluatorHelper.isNumber(left) && evaluatorHelper.isNumber(right)) {
      left = parseFloat(left)
      right = parseFloat(right)
    }
    return left && right
  }

  priority () {
    return 6
  }

  toString () {
    return this.left.toString() + '&&' + this.right.toString()
  }

  compileLokiJS () {
    const left = this.master.compileLokiJS(this.left)
    const right = this.master.compileLokiJS(this.right)
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
