const filterPart = require('./filterPart')
const compileFilter = require('./compileFilter')

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

  properties () {
  }

  toLokijs (options = {}) {
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
}

filterPart.register('default', FilterQuery)
