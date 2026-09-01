const FilterStatement = require('./FilterStatement')
const filterPart = require('./filterPart')
const turf = require('./turf')
const compileCacheDescriptors = require('./compileCacheDescriptors.js')

// TODO: concerning recurses in the subtrahend, the cache descriptors might still be wrong, as they recurse to 'r;(node;node(r)->.1);r(bn.1);' <- why would we be interested in 'r(bn.1);'?

class FilterDiff extends FilterStatement {
  constructor (def, filter) {
    super(def, filter)
    this.outputSet = '_'
    this.parts = []
    this.filter = filter

    let hasOutputSet = false
    def.diff.forEach(part => {
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
    const r = this.parts[0].toLokijs(options)
    r.needMatch = true

    return r
  }

  toQl (options = {}) {
    if ('fromStatementId' in options && options.fromStatementId === this.id) {
      return ''
    }

    let hasOutputSet = false
    const subOptions = JSON.parse(JSON.stringify(options))
    subOptions.inputSet = options.inputSet
    subOptions.outputSet = ''

    let result = '(' + this.parts.map(p => p.toQl(subOptions)).join('-') + ')'

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
    const result = []
    this.parts.forEach(p => {
      p.recurse().forEach(r => {
        const alreadyExist = result
          .filter(e => r.id === e.id && r.properties === e.properties && r.type === e.type)
          .length

        if (!alreadyExist) {
          result.push(r)
        }
      })
    })

    return result
  }

  toQuery (options = {}) {
    const allRecurse = this.parts.filter(p => p.recurse().length)
    if (allRecurse.length) {
      return '(' + this.parts.map(p => 'nwr._' + p.id + ';').join('-') + ')->._' + this.id + ';'
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

    const minuents = this.parts[0].compileQuery(options)
    const subtrahends = this.parts[1].compileQuery(options)

    result.recurse = (minuents.recurse || []).concat(subtrahends.recurse || [])
    if (!result.recurse.length) {
      delete result.recurse
    }

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
    const minuends = [this.parts[0]._caches(options)].flat()
    const subtrahendCaches = [this.parts[1]._caches(options)].flat()
    let properties = 0
    subtrahendCaches.forEach(c => {
      properties |= c.properties
    })
    const subtrahends = compileCacheDescriptors([this.parts[1]._caches(options)].flat(), { skipRecurses: true })

    const result = []
    minuends.forEach(m => {
      const entry = { ...m }
      entry.properties |= properties
      if (subtrahends.length === 1) {
        entry.diff = printCacheDescriptor(subtrahends[0])
      } else {
        entry.diff = '(' + subtrahends.map(s => printCacheDescriptor(s) + ';').join('') + ')'
      }

      entry.recurse = entry.recurse || []
      ;(subtrahendCaches || []).forEach(s => {
        (s.recurse || []).forEach(r => {
          const alreadyExist = entry.recurse
            .filter(e => r.setId === e.setId)
            .length

          if (!alreadyExist) {
            r.filtersFwd = ''
            entry.recurse.push(r)
          }
        })
      })

      console.log(entry)
      if (!entry.recurse.length) {
        delete entry.recurse
      }

      result.push(entry)
    })

    return result
  }

  match (ob) {
    return this.parts[0].match(ob) && !this.parts[1].match(ob)
  }

  derefSets () {
    const minuends = [this.parts[0].derefSets()].flat()
    const subtrahends = [this.parts[1].derefSets()].flat()

    const result = []
    minuends.forEach(m => {
      const entry = { ...m }
      entry.diff = subtrahends
      result.push(entry)
    })

    return result
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
}

function printCacheDescriptor (entry) {
  let result = entry.id

  if (entry.ids) {
    result += '(id:' + entry.ids.join(',') + ')'
  }

  return result
}

filterPart.register('diff', FilterDiff)
