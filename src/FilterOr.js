const FilterStatement = require('./FilterStatement')
const filterPart = require('./filterPart')
const turf = require('./turf')

class FilterOr extends FilterStatement {
  constructor (def, filter) {
    super(def, filter)
    this.outputSet = '_'
    this.parts = []

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
    const allRecurse = this.parts.filter(p => p.recurse().length)
    if (allRecurse.length) {
      return {}
    }

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
    let hasOutputSet = false
    const subOptions = JSON.parse(JSON.stringify(options))
    subOptions.inputSet = options.inputSet
    subOptions.outputSet = ''

    let result = '(' + this.parts.map(p => p.toQl(subOptions)).join('') + ')'

    if (options.outputSet) {
      hasOutputSet = true
      result += (options.outputSet ? '->' + options.outputSet : '')
    }

    if (options.setsUseStatementIds) {
      result = (hasOutputSet ? '(' + result + ';)' : result) + '->._' + this.id
    } else if (this.outputSet !== '_') {
      result = (hasOutputSet ? '(' + result + ';)' : result) + '->.' + this.outputSet
    }

    return result + ';'
  }

  toString (options = {}) {
    return this.toQl(options)
  }

  recurse () {
    const allRecurse = this.parts.filter(p => p.recurse().length)
    if (!allRecurse.length) {
      return []
    }

    return this.parts.map(p => {
      return { id: p.id, properties: p.properties(), type: 'or' }
    })
  }

  toQuery (options = {}) {
    const allRecurse = this.parts.filter(p => p.recurse().length)
    if (allRecurse.length) {
      return '(' + this.parts.map(p => 'nwr._' + p.id + ';').join('') + ')->._' + this.id + ';'
    }

    let result = this.requiredInputSets()
      .map(s => s.toQuery()).join('')
    result += this.toQl({ ...options, setsUseStatementIds: true })
    return result
  }

  /**
   * return a list of all input sets which are needed before this statement
   * @returns {FilterStatement}
   */
  requiredInputSets () {
    const statements = []

    this.parts.forEach(p => {
      p.requiredInputSets().forEach(s => {
        if (!statements.includes(s) && !this.parts.includes(s)) {
          statements.push(s)
        }
      })
    })

    return statements
  }

  compileQuery (options = {}) {
    const result = {
      query: this.toQl(options)
    }

    result.loki = this.toLokijs(options)
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
    return this.parts
      .map(part => part._caches())
      .flat()
  }

  match (ob) {
    return this.parts.some(part => part.match(ob))
  }

  derefSets () {
    return this.parts.map(p => p.derefSets()).flat()
  }

  properties () {
    let result = 0
    this.parts.forEach(p => {
      result |= p.properties()
    })
    return result
  }

  possibleBounds (ob) {
    let bounds = null

    this.parts.forEach(p => {
      const b = p.possibleBounds(ob)
      if (b) {
        if (bounds) {
          bounds = turf.difference(b, bounds)
        } else {
          bounds = b
        }
      }
    })

    return bounds
  }
}

filterPart.register('or', FilterOr)
