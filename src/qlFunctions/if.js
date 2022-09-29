const qlFunction = require('./qlFunction')

const Evaluator = require('../Evaluator')

module.exports = class If extends qlFunction {
  constructor (str) {
    super()
    this.fun = 'if'

    this.value = new Evaluator()
    this.value.parse(str)
  }

  test (ob) {
    return this.value.exec(ob)
  }

  toString () {
    return '(if:' + this.value.toString() + ')'
  }

  compileLokiJS () {
    return [null, null, true]
  }

  isSupersetOf (other) {
    return false
  }
}
