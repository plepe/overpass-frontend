const EO = require('../EvaluatorOperator')
const evaluatorHelper = require('../evaluatorHelper')

const functions = {
  /* eslint-disable eqeqeq */
  '!=': (a, b) => a != b,
  '==': (a, b) => a == b,
  /* eslint-enable eqeqeq */
  '<': (a, b) => a < b,
  '<=': (a, b) => a <= b,
  '>': (a, b) => a > b,
  '>=': (a, b) => a >= b
}
const priorities = {
  '!=': 5,
  '==': 5,
  '<': 4,
  '<=': 4,
  '>': 4,
  '>=': 4
}
const lokiOperatorLeft = {
  '!=': '$ne',
  '==': '$eq',
  '<': '$lt',
  '<=': '$lte',
  '>': '$gt',
  '>=': '$gte'
}
const lokiOperatorRight = {
  '!=': '$ne',
  '==': '$eq',
  '<': '$gt',
  '<=': '$gte',
  '>': '$lt',
  '>=': '$lte'
}

module.exports = class EO_comparison extends EO {
  eval (context) {
    let left = this.master.exec(context, this.left)
    let right = this.master.exec(context, this.right)
    if (evaluatorHelper.isNumber(left) && evaluatorHelper.isNumber(right)) {
      left = parseFloat(left)
      right = parseFloat(right)
    }
    return functions[this.op](left, right)
  }

  priority () {
    return priorities[this.op]
  }

  compileLokiJS () {
    const left = this.master.compileLokiJS(this.left)
    const right = this.master.compileLokiJS(this.right)
    const leftOp = lokiOperatorLeft[this.op]
    const rightOp = lokiOperatorRight[this.op]

    const r = {}
    const comp = {}
    if (left && Object.values(left) && JSON.stringify(Object.values(left)[0]) === '{"$exists":true}' && right && 'value' in right) {
      const prop = Object.keys(left)[0]
      comp[leftOp] = right.value
      r[prop] = comp
      return r
    } else if (left && 'value' in left && right && Object.values(right) && JSON.stringify(Object.values(right)[0]) === '{"$exists":true}') {
      const prop = Object.keys(right)[0]
      comp[rightOp] = left.value
      r[prop] = comp
      return r
    } else if ('value' in left && 'value' in right) {
      return { value: functions[this.op](left.value, right.value) }
    } else {
      return { needMatch: true }
    }
  }
}
