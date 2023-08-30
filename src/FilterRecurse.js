const filterPart = require('./filterPart')
const OverpassFrontend = require('./defines')
const FilterStatement = require('./FilterStatement')

class FilterRecurse extends FilterStatement {
  constructor (def, filter) {
    super(def, filter)
    this.inputSet = def.inputSet ?? '_'
    this.inputSetRef = filter.sets[this.inputSet]
    this.outputSet = def.outputSet ?? '_'
    this.type = def.recurse

    filter.sets[this.outputSet] = this
  }

  toLokijs (options = {}) {
    return {}
  }

  toQl (options = {}) {
    let result = ''

    if (options.setsUseStatementIds) {
      result += '._' + this.inputSetRef.id + ' '
    } else if (this.inputSet !== '_') {
      result += '.' + this.inputSet + ' '
    }
    result += this.type
    if (options.setsUseStatementIds) {
      result += ' ->._' + this.id
    } else if (this.outputSet !== '_') {
      result += ' ->.' + this.outputSet
    }

    return result + ';'
  }

  toQuery (options = {}) {
    return this.toQl({ ...options, setsUseStatementIds: true })
  }

  /**
   * return a list of all input sets which are needed before this statement
   * @returns {FilterStatement}
   */
  requiredInputSets () {
    return [ this.inputSetRef ]
  }

  recurse (options = {}) {
    return [{
      type: this.type,
      inputSet: this.inputSet,
      statement: this.inputSetRef
    }]
  }

  compileQuery (options = {}) {
    const r = this.inputSetRef.compileQuery()

    r.type = this.type
    r.inputSet = this.inputSet

    return {
      query: this.toQl(options),
      loki: {},
      recurse: [ r ]
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
      c.filters += ';' + this.type + ';'
      if (this.type === '>') {
        c.properties |= OverpassFrontend.MEMBERS
      }
    })

    return result
  }

  match (ob) {
  }
}

filterPart.register('recurse', FilterRecurse)
