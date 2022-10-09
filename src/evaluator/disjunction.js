const EO = require('../EvaluatorOperator')
const evaluatorHelper = require('../evaluatorHelper')

module.exports = class EO_disjunction extends EO {
  eval (context) {
    let left = this.master.exec(context, this.left)
    let right = this.master.exec(context, this.right)
    if (evaluatorHelper.isNumber(left) && evaluatorHelper.isNumber(right)) {
      left = parseFloat(left)
      right = parseFloat(right)
    }
    return left || right
  }

  priority () {
    return 7
  }

  compileLokiJS () {
    const left = this.master.compileLokiJS(this.left)
    const right = this.master.compileLokiJS(this.right)

    if ('value' in left) {
      return left.value ? { value: true } : right
    }

    const leftNeedMatch = left.needMatch
    const rightNeedMatch = right.needMatch
    delete left.needMatch
    delete right.needMatch
    const leftKeys = Object.keys(left)
    const rightKeys = Object.keys(right)

    if (!leftKeys.length && rightKeys.length) {
      right.needMatch = !!(left.needMatch || right.needMatch)
      return right
    }
    if (leftKeys.length && !rightKeys.length) {
      left.needMatch = !!(left.needMatch || right.needMatch)
      return left
    }

    return { $or: [left, right], needMatch: !!(leftNeedMatch || rightNeedMatch) }
  }
}
