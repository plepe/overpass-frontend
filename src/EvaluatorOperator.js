const evaluatorExport = require('./evaluatorExport')
const EvaluatorPart = require('./EvaluatorPart')
const EvaluatorValue = require('./EvaluatorValue')

module.exports = class EvaluatorOperator extends EvaluatorPart {
  constructor (op, left, right, master) {
    super(master)
    this.op = op
    this.left = left
    this.right = right
  }

  toJSON () {
    return { op: this.op, left: evaluatorExport(this.left), right: evaluatorExport(this.right) }
  }

  toValue () {
    if (this.left.toValue() === null || this.right.toValue() === null) {
      return null
    }
    return this.eval({})
  }

  simplify () {
    const v = this.toValue()
    if (v !== null) {
      return new EvaluatorValue(v, this.master)
    }
    const left = this.left ? this.left.simplify() : null
    const right = this.right ? this.right.simplify() : null
    return new this.constructor(this.op, left, right, this.master)
  }

  compileLokiJS () {
    return { needMatch: true }
  }
}
