const filterPart = require('./filterPart')
const OverpassFrontend = require('./defines')
const FilterStatement = require('./FilterStatement')
const andTypes = require('./andTypes')

const cachesMapTypes = {
  '>': [
    [
      { type: 'way', properties: OverpassFrontend.MEMBERS },
      { type: 'node', recurseType: 'w', recurseRecType: 'bn' },
    ],
    [
      { type: 'relation', properties: OverpassFrontend.MEMBERS },
      { type: 'node', recurseType: 'r', recurseRecType: 'bn' },
    ],
    [
      { type: 'relation', properties: OverpassFrontend.MEMBERS },
      { type: 'way', recurseType: 'r', recurseRecType: 'bw' },
    ],
    [
      { type: 'relation', properties: OverpassFrontend.MEMBERS },
      { type: 'way', recurseType: 'r', recurseRecType: 'bw', properties: OverpassFrontend.MEMBERS },
      { type: 'node', recurseType: 'w', recurseRecType: 'bn' },
    ]
  ],
  '<': [
    [
      { type: 'node' },
      { type: 'way', properties: OverpassFrontend.MEMBERS, recurseType: 'bn', recurseRecType: 'w' },
    ],
    [
      { type: 'node' },
      { type: 'relation', properties: OverpassFrontend.MEMBERS, recurseType: 'bn', recurseRecType: 'r' },
    ],
    [
      { type: 'way' },
      { type: 'relation', properties: OverpassFrontend.MEMBERS, recurseType: 'bw', recurseRecType: 'r' },
    ],
    [
      { type: 'node' },
      { type: 'way', properties: OverpassFrontend.MEMBERS, recurseType: 'bn', recurseRecType: 'w' },
      { type: 'relation', properties: OverpassFrontend.MEMBERS, recurseType: 'bw', recurseRecType: 'r' },
    ]
  ]
}

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
      result += '._' + (this.inputSetRef ? this.inputSetRef.id : 'missing') + ' '
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
    return [this.inputSetRef]
  }

  recurse (options = {}) {
    let properties = this.inputSetRef ? this.inputSetRef.properties() : 0
    properties |= ['>', '>>'].includes(this.type) ? OverpassFrontend.MEMBERS : 0

    return [{
      type: this.type,
      properties,
      id: this.inputSetRef ? this.inputSetRef.id : null
    }]
  }

  compileQuery (options = {}) {
    if (!this.inputSetRef) {
      return {
        query: this.toQl(options),
        loki: {},
        recurse: [null]
      }
    }

    const r = this.inputSetRef.compileQuery()

    r.type = this.type
    r.inputSet = this.inputSet

    return {
      query: this.toQl(options),
      loki: {},
      recurse: [r]
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
      result += this.filter.baseFilter.toQl({ outputSet: '._base' })
    }

    result += this.toQl()

    return result
  }

  _caches () {
    if (!this.inputSet || !this.inputSetRef) {
      return []
    }

    const possRecursions = cachesMapTypes[this.type]
    if (!possRecursions) {
      console.log('_caches(): unknown recursion type', this.type)
      return []
    }

    const result = []
    possRecursions.forEach(recursions => {
      const setId = '._' + this.inputSetRef.id
      const r = this.inputSetRef._caches()

      recursions = [...recursions]
      const thisFilter = recursions.shift()

      r.forEach(c => {
        c.type = andTypes(c.type ?? 'nwr', thisFilter.type)
        if (!c.type) {
          return
        }

        c.setId = setId
        if (thisFilter.properties) {
          c.properties |= OverpassFrontend.MEMBERS
        }

        let inBetween = c

        recursions.forEach((b, i) => {
          inBetween.setId = setId

          inBetween.filtersFwd = '(' + b.recurseType + setId + ')'
          inBetween.filtersRec = '(' + b.recurseRecType + setId + ')'

          const e = {
            type: b.type,
            properties: (b.properties ?? 0),
            filters: '',
            recurse: [inBetween]
          }

          inBetween = e
        })

        result.push(inBetween)
      })
    })

    return result
  }

  match (ob) {
  }

  derefSets () {
    if (!this.inputSetRef) {
      return []
    }

    const deref = this.inputSetRef.derefSets()

    return deref.map(d => {
      const r = {
        type: 'nwr',
        filters: [],
        recurse: [{
          recurseType: this.type,
          type: d.type,
          filters: d.filters
        }]
      }

      if (d.recurse) {
        r.recurse[0].recurse = d.recurse
      }

      return r
    })
  }

  properties () {
    return ['<', '<<'].includes(this.type) ? OverpassFrontend.MEMBERS : 0
  }

  possibleBounds (ob) {
    return null
  }
}

filterPart.register('recurse', FilterRecurse)
