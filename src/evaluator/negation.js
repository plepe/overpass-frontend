const EO = require('../EvaluatorOperator')
const evaluatorHelper = require('../evaluatorHelper')

module.exports = class EO_negation extends EO {
  eval (context) {
    let right = this.master.exec(context, this.right)
    if (evaluatorHelper.isNumber(right)) {
      right = parseFloat(right)
    }
    return right ? 0 : 1
  }

  priority () {
    return 1
  }

  compileLokiJS () {
    const right = this.master.compileLokiJS(this.right)

    if ('value' in right) {
      return { value: !right.value }
    }
    if (right !== null && typeof right === 'object') {
      const k = Object.keys(right)
      if (k.length === 1 && '$exists' in right[k]) {
        right[k].$exists = !right[k].$exists
        return right
      }
    }
    return { needMatch: true }
  }
}
