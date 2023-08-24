const filterPart = require('./filterPart')

class FilterOr {
  constructor (def, filter) {
    this.id = filter.createStatementId()
    filter.statements[this.id] = this
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

  toLokijs (options = {}) {
    let needMatch = false

    const r = {
      $or:
      this.parts.map(part => {
        const r = part.toLokijs(options)
        if (r.needMatch) {
          needMatch = true
        }
        delete r.needMatch
        return r
      })
    }

    // if the $or has elements that are always true, remove whole $or
    if (r.$or.filter(p => Object.keys(p).length === 0).length > 0) {
      delete r.$or
    }

    if (needMatch) {
      r.needMatch = true
    }

    return r
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

  recurse () {
    return []
  }

  compileQuery (options = {}) {
    const result = {
      query: this.toQl()
    }

    result.loki = this.toLokijs()
    delete result.loki.recurse

    return result
  }

  /**
   * return query and queries this depends upon as string.
   * @return {string}
   */
  fullString () {
    return this.toString()
  }

  _caches () {
    const result = []

    return this.parts
      .map(part => part._caches())
      .flat()
  }

  match (ob) {
    return this.parts.some(part => part.match(ob))
  }
}

filterPart.register('or', FilterOr)
