const operators = {
  '+': (a, b) => a + b,
  '-': (a, b) => a - b,
  '*': (a, b) => a * b,
  '/': (a, b) => a / b,
  '!': (a, b) => b ? 0 : 1,
  /* eslint-disable eqeqeq */
  '==': (a, b) => a == b
  /* eslint-enable eqeqeq */
}
const functions = {
  tag: (p, context) => context[p[0]]
}

module.exports = function execEvaluators (current, context) {
  if (current === null || typeof current === 'number' || typeof current === 'string') {
    return current
  }

  if (current.op) {
    const left = execEvaluators(current.left, context)
    const right = execEvaluators(current.right, context)
    return operators[current.op](left, right)
  }

  if (current.fun) {
    return functions[current.fun](current.parameters, context)
  }
}
