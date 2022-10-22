const EvaluatorOperator = require('../EvaluatorOperator')
const evaluatorHelper = require('../evaluatorHelper')

const functions = {
  '+': (a, b) => a + b,
  '-': (a, b) => a - b,
  '*': (a, b) => a * b,
  '/': (a, b) => a / b
}
const priorities = {
  '+': 3,
  '-': 3,
  '*': 2,
  '/': 2
}

module.exports = class EvaluatorOperatorSimpleMath extends EvaluatorOperator {
  eval (context) {
    let left = this.left.eval(context)
    let right = this.right.eval(context)
    if (evaluatorHelper.isNumber(left) && evaluatorHelper.isNumber(right)) {
      left = parseFloat(left)
      right = parseFloat(right)
    } else {
      left = left.toString()
      right = right.toString()
    }
    return functions[this.op](left, right)
  }

  toString (options) {
    return this.left.toString(options) + this.op + this.right.toString(options)
  }

  priority () {
    return priorities[this.op]
  }

  compileLokiJS () {
    const left = this.left.compileLokiJS()
    const right = this.right.compileLokiJS()

    if ('value' in left && 'value' in right) {
      return { value: functions[this.op](left.value, right.value) }
    } else {
      return { needMatch: true }
    }
  }
}
