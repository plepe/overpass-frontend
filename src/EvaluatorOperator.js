const evaluatorExport = require('./evaluatorExport')

module.exports = class EvaluatorOperator {
  constructor (op, left, right, master) {
    this.op = op
    this.left = left
    this.right = right
    this.master = master
  }

  toJSON () {
    return { op: this.op, left: evaluatorExport(this.left), right: evaluatorExport(this.right) }
  }

  compileLokiJS () {
    return { needMatch: true }
  }
}
