const evaluatorExport = require('../evaluatorExport')
const EvaluatorOperator = require('../EvaluatorOperator')
const EvaluatorValue = require('../EvaluatorValue')

module.exports = class EvaluatorOperatorTernary extends EvaluatorOperator {
  constructor (op, condition, left, right) {
    super()
    this.op = op
    this.condition = condition
    this.left = left
    this.right = right
  }

  eval (context) {
    const condition = this.condition.eval(context)
    if (condition) {
      return this.left.eval(context)
    } else {
      return this.right.eval(context)
    }
  }

  toValue () {
    const condition = this.condition.toValue()
    if (condition === null) {
      return null
    }
    if (condition) {
      return this.left.toValue()
    } else {
      return this.right.toValue()
    }
  }

  toJSON () {
    const result = super.toJSON()
    result.condition = evaluatorExport(this.condition)
    return result
  }

  toString (options) {
    return this.condition.toString(options) + '?' + this.left.toString(options) + ':' + this.right.toString(options)
  }

  priority () {
    return 8
  }

  isSupersetOf (other) {
    const r = super.isSupersetOf(other)
    if (r !== undefined) {
      return r
    }

    if (this.left.isSupersetOf(other) && this.right.isSupersetOf(other)) {
      return true
    }
  }

  cacheDescriptors (descriptors) {
    const copyLeft = JSON.parse(JSON.stringify(descriptors))
    const copyRight = JSON.parse(JSON.stringify(descriptors))
    this.condition.cacheDescriptors(descriptors)
    this.left.cacheDescriptors(copyLeft)
    this.right.cacheDescriptors(copyRight)
    descriptors.push(...copyLeft)
    descriptors.push(...copyRight)
  }

  simplify () {
    const v = this.toValue()
    if (v !== null) {
      return new EvaluatorValue(v, this.master)
    }
    const condition = this.condition.simplify()
    const left = this.left.simplify()
    const right = this.right.simplify()
    return new EvaluatorOperatorTernary(this.op, condition, left, right)
  }
}
