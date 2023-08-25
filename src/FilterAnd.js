const filterPart = require('./filterPart')
const cacheMerge = require('./cacheMerge')
const FilterStatement = require('./FilterStatement')

class FilterAnd extends FilterStatement {
  constructor (def, filter) {
    super(def, filter)
    this.outputSet = '_'
    this.filter = filter
    this.parts = []

    let hasType = false
    let hasOutputSet = false
    def.and.forEach(part => {
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
      $and:
      this.parts
        .map(part => {
          const r = part.toLokijs(options)
          if (r.needMatch) {
            needMatch = true
          }
          delete r.needMatch
          return r
        })
        .filter(part => Object.keys(part).length)
    }

    if (needMatch) {
      r.needMatch = true
    }

    return r
  }

  toQl (options = {}) {
    const first = this.parts[0]
    const last = this.parts[this.parts.length - 1]
    const others = this.parts.concat().slice(1, this.parts.length - 1)
    const set = '.x' + this.filter.uniqId()
    const subOptions1 = JSON.parse(JSON.stringify(options))
    const subOptions2 = JSON.parse(JSON.stringify(options))
    const subOptions3 = JSON.parse(JSON.stringify(options))
    subOptions1.outputSet = set
    subOptions2.inputSet = set
    subOptions2.outputSet = set
    subOptions3.inputSet = set

    let result = first.toQl(subOptions1) +
      others.map(part => part.toQl(subOptions2)).join('') +
      last.toQl(subOptions3) +
      (options.outputSet ? '->' + options.outputSet : '')

    if (this.outputSet !== '_') {
      result = '(' + result + ')->.' + this.outputSet + ';'
    }

    return result
  }

  toString (options = {}) {
    return this.toQl(options)
  }

  toQuery (options = {}) {
    let result = this.requiredInputSets()
      .map(s => s.toQuery()).join('')
    result += this.toQl(options)
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

  recurse () {
  }

  /**
   * return query and queries this depends upon as string.
   * @return {string}
   */
  fullString () {
    return this.toString()
  }

  _caches () {
    let result = []

    const list = this.parts.concat()
    const first = list.shift()

    let current = first._caches()
    list.forEach(part => {
      const r = part._caches()

      r.forEach(r1 => {
        current.forEach(c => {
          result.push(cacheMerge(c, r1))
        })
      })

      current = result
    })

    return result
  }

  match (ob) {
    return this.parts.every(part => part.match(ob))
  }
}

filterPart.register('and', FilterAnd)
