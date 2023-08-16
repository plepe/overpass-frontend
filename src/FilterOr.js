const filterPart = require('./filterPart')

class FilterOr {
  constructor (def, filter) {
    this.outputSet = '_'
    this.parts = []

    let hasType = false
    let hasOutputSet = false
    def.or.forEach(part => {
      if (part.outputSet) {
        if (hasOutputSet) {
          throw new Error('Filter: only one output set allowed!')
        }

        this.outputSet = part.outputSet
        hasOutputSet = true
      } else {
        this.parts.push(filterPart.get(part, filter))
      }
    })

    filter.sets[this.outputSet] = this
  }

  properties () {
  }

  toLokijs (options = {}) {
  }

  toQl (options = {}) {
    const subOptions = JSON.parse(JSON.stringify(options))
    subOptions.inputSet = options.inputSet
    subOptions.outputSet = ''

    let result = '(' + this.parts.map(p => p.toQl(subOptions)).join('') + ')' + (options.outputSet ? '->' + options.outputSet : '')

    if (this.outputSet !== '_') {
      result = '(' + result + ';)->.' + this.outputSet
    }

    return result + ';'
  }

  toString (options = {}) {
    return this.toQl(options)
  }
}

filterPart.register('or', FilterOr)
