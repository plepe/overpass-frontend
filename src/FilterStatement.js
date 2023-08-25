module.exports = class FilterStatement {
  constructor (def, filter) {
    this.id = filter.createStatementId()
    filter.statements[this.id] = this
  }

  /**
   * Compile all (recursing) parts of a query
   */
  compileQuery (options = {}) {
    const result = {}
    let query = this.toQuery({ outputSet: '._' + this.id }) + '\n'

    if ((this.list && this.list.length) || options.includeEmptyDone) {
      const types = {}
      ;(this.list ?? []).forEach(item => {
        if (!(item.type in types)) {
          types[item.type] = []
        }

        types[item.type].push(item.osm_id)
      })

      query += '(' + Object.entries(types)
        .map(([ type, ids]) => {
          return type + '  (id:' + ids.join(',') + ');\n'
        })
        .join('') + ')->._done' + this.id + ';\n'

      query += '(._' + this.id + '; - ._done' + this.id + ';)->._' + this.id + ';\n'
    }

    result[this.id] = query

    return result
  }
}
