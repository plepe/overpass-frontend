module.exports = class FilterStatement {
  constructor (def, filter, options) {
    // check if the part is named (outputSet with _X, where X is a number)
    const findOutputSet = (def.or || def.diff || def.and) ? def.or ?? def.diff ?? def.and : def
    if (Array.isArray(findOutputSet)) {
      const outputSet = findOutputSet.filter(d => d.outputSet)
      if (options.clone && outputSet.length && outputSet[0].outputSet.match(/^_\d+$/)) {
        const id = parseInt(outputSet[0].outputSet.substr(1))
        this.id = filter.registerStatementId(this, id)
      }
    }

    if (this.id === undefined) {
      this.id = filter.createStatementId(this)
    }
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

  /**
   * Check if this statement and the given statement are mergeable. If yes, the
   * 'merge()' function will do the actual merging.
   * @param {FilterStatement} statement The statement to merge with.
   */
  mergeable (statement) {
    return false
  }

  /**
   * Merge this statement with the given statement.
   * @param {FilterStatement} statement The statement to merge with.
   */
  merge (statement) {
  }

  /**
   * Conflate this statement with nearby statements if possible.
   */
  conflate () {
  }

  /**
   * List of all dependents
   */
  dependents () {
    return []
  }
}
