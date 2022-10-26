const EvaluatorPart = require('./EvaluatorPart')

module.exports = class EvaluatorValue extends EvaluatorPart {
  constructor (value) {
    super()
    this.value = value
  }

  eval (context) {
    return this.value
  }

  toJSON () {
    if (typeof this.value === 'boolean') {
      return this.value ? 1 : 0
    }

    return this.value
  }

  toString () {
    if (typeof this.value === 'number') {
      return '' + this.value
    }

    if (typeof this.value === 'string') {
      return '"' + this.value
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"') + '"'
    }

    if (typeof this.value === 'boolean') {
      return this.value ? '1' : '0'
    }
  }

  toValue () {
    return this.value
  }

  compileLokiJS () {
    return { value: this.value }
  }
}
