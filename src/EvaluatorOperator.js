const evaluatorExport = require('./evaluatorExport')
const EvaluatorPart = require('./EvaluatorPart')

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

  compileLokiJS () {
    return { needMatch: true }
  }
}
