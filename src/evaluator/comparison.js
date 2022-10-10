const EvaluatorOperator = require('../EvaluatorOperator')
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
const opIsSupersetOfLeft = {
  '==' (currentValue, otherOp, otherValue) {
    switch (otherOp) {
      case '==':
        /* eslint-disable eqeqeq */
        return currentValue == otherValue
  /* eslint-enable eqeqeq */
    }
  },
  '!=' (currentValue, otherOp, otherValue) {
    return false
  },
  '<' (currentValue, otherOp, otherValue) {
    switch (otherOp) {
      case '<':
      case '<=':
        return currentValue > otherValue
    }
  },
  '<=' (currentValue, otherOp, otherValue) {
    switch (otherOp) {
      case '<':
      case '<=':
      case '==':
        return currentValue >= otherValue
    }
  },
  '>' (currentValue, otherOp, otherValue) {
    switch (otherOp) {
      case '>':
      case '>=':
        return currentValue < otherValue
    }
  },
  '>=' (currentValue, otherOp, otherValue) {
    switch (otherOp) {
      case '>':
      case '>=':
      case '==':
        return currentValue <= otherValue
    }
  }
}
const opIsSupersetOfRight = {
  '==' (currentValue, otherOp, otherValue) {
    switch (otherOp) {
      case '==':
        /* eslint-disable eqeqeq */
        return currentValue == otherValue
  /* eslint-enable eqeqeq */
    }
  },
  '!=' (currentValue, otherOp, otherValue) {
    return false
  },
  '<' (currentValue, otherOp, otherValue) {
    switch (otherOp) {
      case '<':
      case '<=':
        return currentValue < otherValue
    }
  },
  '<=' (currentValue, otherOp, otherValue) {
    switch (otherOp) {
      case '<':
      case '<=':
      case '==':
        return currentValue <= otherValue
    }
  },
  '>' (currentValue, otherOp, otherValue) {
    switch (otherOp) {
      case '>':
      case '>=':
        return currentValue > otherValue
    }
  },
  '>=' (currentValue, otherOp, otherValue) {
    switch (otherOp) {
      case '>':
      case '>=':
      case '==':
        return currentValue >= otherValue
    }
  }
}

module.exports = class EvaluatorOperatorComparison extends EvaluatorOperator {
  eval (context) {
    let left = this.left.eval(context)
    let right = this.right.eval(context)
    if (evaluatorHelper.isNumber(left) && evaluatorHelper.isNumber(right)) {
      left = parseFloat(left)
      right = parseFloat(right)
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
    const left = this.left.compileLokiJS()
    const right = this.right.compileLokiJS()
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

  isSupersetOf (other) {
    const r = super.isSupersetOf(other)
    if (r !== undefined) {
      return r
    }

    const left = this.left.compileLokiJS()
    const right = this.right.compileLokiJS()
    const otherLeft = other.left ? other.left.compileLokiJS() : null
    const otherRight = other.right ? other.right.compileLokiJS() : null

    if (this.left && this.left.fun && other.left && other.left.fun && JSON.stringify(this.left) === JSON.stringify(other.left) && 'value' in right && 'value' in otherRight) {
      return this.op in opIsSupersetOfLeft && opIsSupersetOfLeft[this.op](right.value, other.op, otherRight.value)
    }

    if (this.right && this.right.fun && other.right && other.right.fun && JSON.stringify(this.right) === JSON.stringify(other.right) && 'value' in left && 'value' in otherLeft) {
      return this.op in opIsSupersetOfRight && opIsSupersetOfRight[this.op](left.value, other.op, otherLeft.value)
    }
  }
}
