const filterPart = require('./filterPart')
const compileFilter = require('./compileFilter')
const qlFunction = require('./qlFunctions/qlFunction')
const OverpassFrontend = require('./defines')
const cacheMerge = require('./cacheMerge')
const strsearch2regexp = require('strsearch2regexp')
const FilterStatement = require('./FilterStatement')

class FilterQuery extends FilterStatement {
  constructor (def, filter) {
    super(def, filter)
    this.filter = filter

    if (!Array.isArray(def)) {
      def = [def]
    }

    this.inputSets = {}
    this.outputSet = '_'
    this.type = 'nwr'
    this.filters = []

    let hasType = false
    let hasOutputSet = false
    def.forEach(part => {
      if (part.type) {
        if (hasType) {
          throw new Error('Filter: only one type query allowed!')
        }

        this.type = part.type === 'rel' ? 'relation' : part.type
        hasType = true
      } else if (part.inputSet || part.recurse) {
        if (!part.inputSet && part.recurse) {
          part.inputSet = '_'
        }

        if (part.inputSet in filter.sets) {
        } else {
          console.log('input set ' + part.inputSet + ' not defined')
          this.noResult = true
        }

        this.inputSets[part.inputSet] = {
          set: filter.sets[part.inputSet]
        }

        if (part.recurse) {
          this.inputSets[part.inputSet].recurse = part.recurse
        }
      } else if (part.outputSet) {
        if (hasOutputSet) {
          throw new Error('Filter: only one output set allowed!')
        }

        this.outputSet = part.outputSet
        hasOutputSet = true
      } else {
        this.filters.push(part)
      }
    })

    if (!Object.keys(this.inputSets).length) {
      this.inputSets = null
    }

    filter.sets[this.outputSet] = this
  }

  toLokijs (options = {}) {
    let query = {}
    let orQueries = []

    if (this.type !== 'nwr') {
      query.type = { $eq: this.type }
    }

    this.filters.forEach(filter => {
      let k, v
      if (filter.keyRegexp) {
        k = 'needMatch'
        v = true
        // can't query for key regexp, skip
      } else if (filter instanceof qlFunction) {
        const d = filter.compileLokiJS()
        if (d.needMatch) {
          query.needMatch = true
        }
        delete d.needMatch
        if (Object.keys(d).length) {
          if (query.$and) {
            query.$and.push(d)
          } else {
            query.$and = [d]
          }
        }
      } else if (filter.op === '=') {
        k = 'tags.' + filter.key
        v = { $eq: filter.value }
      } else if (filter.op === '!=') {
        k = 'tags.' + filter.key
        v = { $ne: filter.value }
      } else if (filter.op === 'has_key') {
        k = 'tags.' + filter.key
        v = { $exists: true }
      } else if (filter.op === 'not_exists') {
        k = 'tags.' + filter.key
        v = { $exists: false }
      } else if (filter.op === 'has') {
        k = 'tags.' + filter.key
        v = { $regex: '^(.*;|)' + filter.value + '(|;.*)$' }
      } else if ((filter.op === '~') || (filter.op === '~i')) {
        k = 'tags.' + filter.key
        v = { $regex: new RegExp(filter.value, (filter.op === '~i' ? 'i' : '')) }
      } else if ((filter.op === '!~') || (filter.op === '!~i')) {
        k = 'tags.' + filter.key
        v = { $not: { $regex: new RegExp(filter.value, (filter.op === '!~i' ? 'i' : '')) } }
      } else if (filter.op === 'strsearch') {
        k = 'tags.' + filter.key
        v = { $regex: new RegExp(strsearch2regexp(filter.value), 'i') }
      } else {
        console.log('unknown filter', filter)
      }

      if (k && v) {
        if (k === 'needMatch') {
          query.needMatch = true
        } else if (k in query) {
          if (!('$and' in query[k])) {
            query[k] = { $and: [query[k]] }
          }
          query[k].$and.push(v)
        } else {
          query[k] = v
        }
      }
    })

    orQueries = orQueries.filter(q => Object.keys(q).length)
    if (orQueries.length === 1) {
      query.$or = orQueries[0]
    } else if (orQueries.length > 1) {
      query.$and = orQueries.map(q => { return { $or: q } })
    }

    const inputSets = this.inputSets ?? (this.filter.baseFilter ? {_base: {set: this.filter.baseFilter}} : null)
    if (inputSets) {
      const normalInputSets = Object.entries(inputSets)
        .filter(s => !s[1].recurse)

      if (normalInputSets.length) {
        let needMatch = query.needMatch
        delete query.needMatch

        query = {
          $and: normalInputSets
            .map(([inputsSetKey, inputSet]) => {
              const r = inputSet && inputSet.set ? inputSet.set.toLokijs() : {$not: true}
              if (r.needMatch) {
                needMatch = true
                delete r.needMatch
              }

              return r
            })
            .concat(query)
            .filter(v => Object.values(v).length)
        }

        if (query.$and.length === 0) {
          delete query.$and
        }

        if (needMatch) {
          query.needMatch = true
        }
      }
    }

    return query
  }

  toQl (options = {}) {
    let result = ''

    result += this.type

    if (this.inputSets) {
      result += Object.entries(this.inputSets).map(([s, inputSet]) => {
        if (inputSet.recurse) {
          return '(' + inputSet.recurse + (s === '_' ? '' : '.' + s) + ')'
        } else {
          return '.' + s
        }
      }).join('')
    } else if (this.filter.baseFilter) {
      result += '._base'
    }
    if (options.inputSet) {
      result += options.inputSet
    }

    result += this.filters.map(part => compileFilter(part, options)).join('')

    if (this.outputSet !== '_') {
      result += '->.' + this.outputSet
    }

    if (options.outputSet) {
      if (this.outputSet !== '_') {
        result = '(' + result + ';)->' + options.outputSet
      } else {
        result += '->' + options.outputSet
      }
    }

    return result + ';'
  }

  recurse () {
    let result = []

    if (this.inputSets) {
      const recursingInputSets = Object.entries(this.inputSets)
        .filter(s => s[1].recurse)
      const normalInputSets = Object.entries(this.inputSets)
        .filter(s => !s[1].recurse)

      if (recursingInputSets.length) {
        result = recursingInputSets.map(s => {
          return {
            type: s[1].recurse,
            inputSet: s[0],
            statement: s[1].set
          }
        })
      }

      if (normalInputSets.length) {
        normalInputSets.forEach(s => {
          if (s[1].set) {
            const q = s[1].set.recurse()
            result = result.concat(q)
          }
        })
      }
    } else if (this.filter.baseFilter) {
      const q = this.filter.baseFilter.recurse()
      result = result.concat(q)
    }

    return result
  }

  /**
   * Compile all (recursing) parts of a query
   */
  toQuery (options = {}) {
    let result = ''

    if (this.inputSets) {
      const normalInputSets = Object.entries(this.inputSets)
        .filter(s => !s[1].recurse)

      if (normalInputSets.length) {
        normalInputSets.forEach(s => {
          if (s[1].set) {
            const q = s[1].set.toQuery()
            result += q
          } else {
            result = null
          }
        })
      }
    } else if (this.filter.baseFilter) {
      const q = this.filter.baseFilter.toQuery({ outputSet: '._base' })
      result += q
    }

    if (result === null) {
      return result
    }

    result += this.toQl(options)
    return result
  }

  /**
   * return a list of all input sets which are needed before this statement
   * @returns {FilterStatement}
   */
  requiredInputSets () {
    if (!this.inputSets) {
      return []
    }

    return Object.values(this.inputSets).map(s => s.set)
  }

  /**
   * Compile all (recursing) parts of a query
   */
  compileQuery (options = {}) {
    let result = {
      query: ''
    }

    if (this.inputSets) {
      const recursingInputSets = Object.entries(this.inputSets)
        .filter(s => s[1].recurse)
      const normalInputSets = Object.entries(this.inputSets)
        .filter(s => !s[1].recurse)

      if (recursingInputSets.length) {
        result.recurse = recursingInputSets.map(s => {
          const r = s[1].set.compileQuery({ set: s[0] })

          r.inputSet = s[0]
          r.type = s[1].recurse

          return r
        })
      }

      if (normalInputSets.length) {
        normalInputSets.forEach(s => {
          if (s[1].set) {
            const q = s[1].set.compileQuery()
            result.query += q.query

            if (q.recurse) {
              result.recurse = (result.recurse ?? []).concat(q.recurse)
            }
          } else {
            result.query = null
          }
        })
      }
    } else if (this.filter.baseFilter) {
      const q = this.filter.baseFilter.compileQuery({ outputSet: '._base' })
      result.query += q.query

      if (q.recurse) {
        result.recurse = (result.recurse ?? []).concat(q.recurse)
      }
    }

    if (result.query === null) {
      return result
    }

    result.query += this.toQl(options)
    result.loki = this.toLokijs(options)
    delete result.loki.recurse

    return result
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
      result += Object.values(this.inputSets).map(s => s.set.fullString()).join('')
    } else if (this.filter.baseFilter) {
      result += this.filter.baseFilter.toQl({outputSet: '._base'})
    }

    result += this.toQl()

    return result
  }

  _caches () {
    let options = [{ filters: '', properties: 0 }]

    const inputSets = []
    let outputSet = '_'

    if (this.type !== 'nwr') {
      options.forEach(o => {
        o.type = this.type
      })
    }

    this.filters.forEach(part => {
      if (part.op) {
        options = options.map(o => {
          o.filters += compileFilter(part)
          o.properties |= OverpassFrontend.TAGS
          return o
        })
      } else if (part instanceof qlFunction) {
        part.cacheDescriptors(options)
      } else {
        throw new Error('caches(): invalid entry')
      }
    })

    if (this.inputSets) {
      Object.values(this.inputSets).reverse().forEach(inputSet => {
        if (!inputSet || !inputSet.set) {
          options = []
          return
        }

        const set = inputSet.set
        const result = []
        set._caches().forEach(a => {
          options.forEach(b => {
            result.push(cacheMerge(a, b))
          })
        })

        options = result
      })
    } else if (this.filter.baseFilter) {
      const result = []
      this.filter.baseFilter._caches().forEach(a => {
        options.forEach(b => {
          result.push(cacheMerge(a, b))
        })
      })

      options = result
    }

    return options
  }

  match (ob) {
    if (this.inputSets) {
      return Object.values(this.inputSets).every(s => s.set.match(ob))
    } else if (this.filter.baseFilter) {
      if (!this.filter.baseFilter.match(ob)) {
        return false
      }
    }

    if (this.type !== 'nwr' && ob.type !== this.type) {
      return false
    }

    return this.filters.every(part => {
      if (part.keyRegexp) {
        let regex
        if (part.value) {
          regex = new RegExp(part.value, part.op.match(/i$/) ? 'i' : '')
        }

        const keyRegex = new RegExp(part.key, part.keyRegexp === 'i' ? 'i' : '')

        for (const k in ob.tags) {
          if (k.match(keyRegex)) {
            if (regex) {
              if (ob.tags[k].match(regex)) {
                return true
              }
            } else {
              return true
            }
          }
        }
        return false
      }

      if (part instanceof qlFunction) {
        return part.test(ob)
      }

      switch (part.op) {
        case 'has_key':
          return ob.tags && (part.key in ob.tags)
        case 'not_exists':
          return ob.tags && (!(part.key in ob.tags))
        case '=':
          return ob.tags && (part.key in ob.tags) && (ob.tags[part.key] === part.value)
        case '!=':
          return ob.tags && (!(part.key in ob.tags) || (ob.tags[part.key] !== part.value))
        case '~':
          return ob.tags && (part.key in ob.tags) && (ob.tags[part.key].match(part.value))
        case '!~':
          return ob.tags && (!(part.key in ob.tags) || (!ob.tags[part.key].match(part.value)))
        case '~i':
          return ob.tags && (part.key in ob.tags) && (ob.tags[part.key].match(new RegExp(part.value, 'i')))
        case '!~i':
          return ob.tags && (!(part.key in ob.tags) || !ob.tags[part.key].match(new RegExp(part.value, 'i')))
        case 'has':
          return ob.tags && (part.key in ob.tags) && (ob.tags[part.key].split(/;/).indexOf(part.value) !== -1)
        case 'strsearch':
          return ob.tags && (part.key in ob.tags) && (ob.tags[part.key].match(new RegExp(strsearch2regexp(part.value), 'i')))
        default:
          console.log('match: unknown operator in filter', part)
          return false
      }
    })
  }
}

filterPart.register('default', FilterQuery)
