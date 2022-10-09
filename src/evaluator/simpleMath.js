const EO = require('../EvaluatorOperator')
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

module.exports = class EO_simpleMath extends EO {
  eval (context) {
    let left = this.master.exec(context, this.left)
    let right = this.master.exec(context, this.right)
    if (evaluatorHelper.isNumber(left) && evaluatorHelper.isNumber(right)) {
      left = parseFloat(left)
      right = parseFloat(right)
    } else {
      left = left.toString()
      right = right.toString()
    }
    return functions[this.op](left, right)
  }

  toString () {
    return this.left.toString() + this.op + this.right.toString()
  }

  priority () {
    return priorities[this.op]
  }

  compileLokiJS () {
    const left = this.master.compileLokiJS(this.left)
    const right = this.master.compileLokiJS(this.right)

    if ('value' in left && 'value' in right) {
      return { value: functions[this.op](left.value, right.value) }
    } else {
      return { needMatch: true }
    }
  }
}
