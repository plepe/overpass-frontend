const FilterStatement = require('./FilterStatement')
const filterPart = require('./filterPart')
const turf = require('./turf')

class FilterOr extends FilterStatement {
  constructor (def, filter) {
    super(def, filter)
    this.outputSet = '_'
    this.parts = []
    this.filter = filter

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
    if ('fromStatementId' in options && options.fromStatementId >= this.id) {
      return ''
    }

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

  _caches (options) {
    return this.parts
      .map(part => part._caches(options))
      .flat()
  }

  match (ob) {
    let result = false

    for (let i = 0; i < this.parts.length; i++) {
      const r = this.parts[i].match(ob)
      if (r === true) { return true }
      if (r === null) { result = null }
    }

    return result
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

  conflate () {
    // first, conflate all parts
    this.parts.forEach(part => part.conflate())

    // if there's only one part, replace this statement by its only part
    if (this.parts.length === 1) {
      this.filter._replaceStatement(this, this.parts[0])
      this.parts[0].conflate()
      return
    }

    // if this statement is used by several statements, do not conflate
    const usage = this.filter._statementUsage(this)
    if (usage.length !== 1) {
      return
    }

    // take the only dependant and check if it can be merged into
    // each part.
    const toReplace = usage[0]
    const notMergeable = this.parts.filter(part => !part.mergeable(toReplace))
    if (notMergeable.length) {
      return
    }

    // merge the dependant into each part.
    this.parts.forEach(part => {
      part.merge(toReplace)

      Object.entries(part.inputSets).forEach(([id, inputSet]) => {
        if (inputSet.set === this) {
          delete (part.inputSets[id])
        }
      })
    })

    // remove the dependant and adapt its dependants.
    this.outputSet = toReplace.outputSet
    this.filter._replaceStatement(toReplace, this)

    // try to conflate again
    this.conflate()
  }

  dependents () {
    return this.parts.map(i => i.dependents().concat([i])).flat()
  }
}

filterPart.register('or', FilterOr)
