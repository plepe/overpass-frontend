module.exports = class FilterStatement {
  constructor (def, filter) {
    this.id = filter.createStatementId()
    filter.statements[this.id] = this
  }

  derefSets () {
    return []
  }

  properties () {
    return 0
  }

  possibleBounds (ob) {
    return null
  }
}
