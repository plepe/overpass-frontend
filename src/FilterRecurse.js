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
      recurse: [{
        inputSet: this.inputSet,
        recurse: this.recurse,
        query: this.inputSetRef.fullString()
      }]
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

  toQlParts (options = {}) {
    const r = this.inputSetRef.toQlParts()

    return {
      query: this.toQl(options),
      recurse: [{
        recurse: this.recurse,
        inputSet: this.inputSet,
        query: r.query
      }]
    }
  }

  toString (options = {}) {
    return this.toQl(options)
  }

  /**
   * return query and queries this depends upon as string.
   * @return {string}
   */
  fullString () {
    let result = ''

    if (this.inputSets) {
      result += Object.values(this.inputSets).map(s => s.fullString()).join('')
    } else if (this.filter.baseFilter) {
      result += this.filter.baseFilter.toQl({outputSet: '._base'})
    }

    result += this.toQl()

    return result
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
