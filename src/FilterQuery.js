const filterPart = require('./filterPart')
const compileFilter = require('./compileFilter')
const qlFunction = require('./qlFunctions/qlFunction')
const OverpassFrontend = require('./defines')
const cacheMerge = require('./cacheMerge')
const strsearch2regexp = require('strsearch2regexp')

class FilterQuery {
  constructor (def, filter) {
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
      } else if (part.inputSet) {
        if (part.inputSet in filter.sets) {
        } else {
          console.log('input set ' + part.inputSet + ' not defined')
          this.noResult = true
        }

        this.inputSets[part.inputSet] = filter.sets[part.inputSet]
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

    if (this.inputSets) {
      query = {
        $and: Object.values(this.inputSets)
          .map(inputSet => inputSet ? inputSet.toLokijs() : {$not: true})
          .concat(query)
      }
    }

    return query
  }

  toQl (options = {}) {
    let result = ''

    result += this.type

    if (this.inputSets) {
      result += Object.keys(this.inputSets).map(s => '.' + s).join('')
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

  toString (options = {}) {
    return this.toQl(options)
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
      Object.values(this.inputSets).reverse().forEach(set => {
        if (!set) {
          options = []
          return
        }

        const result = []
        set._caches().forEach(a => {
          options.forEach(b => {
            result.push(cacheMerge(a, b))
          })
        })

        options = result
      })
    }

    return options
  }
}

filterPart.register('default', FilterQuery)
