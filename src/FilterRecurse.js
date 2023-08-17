const filterPart = require('./filterPart')
const OverpassFrontend = require('./defines')

class FilterRecurse {
  constructor (def, filter) {
    this.inputSet = def.inputSet ?? '_'
    this.inputSetRef = filter.sets[this.inputSet]
    this.outputSet = def.outputSet ?? '_'
    this.recurse = def.recurse

    filter.sets[this.outputSet] = this
  }

  toLokijs (options = {}) {
    return {
      recurse: this.recurse,
      query: this.inputSetRef.toLokijs()
    }
  }

  toQl (options = {}) {
    let result = ''

    if (this.inputSet !== '_') {
      result += '.' + this.inputSet + ' '
    }
    result += this.recurse
    if (this.outputSet !== '_') {
      result += ' ->.' + this.outputSet
    }

    return result + ';'
  }

  toString (options = {}) {
    return this.toQl(options)
  }

  _caches () {
    if (!this.inputSet) {
      return []
    }

    const result = this.inputSetRef._caches()
    result.forEach(c => {
      c.filters += ';' + this.recurse + ';'
      if (this.recurse === '>') {
        c.properties |= OverpassFrontend.MEMBERS
      }
    })

    return result
  }

  match (ob) {
  }
}

filterPart.register('recurse', FilterRecurse)
