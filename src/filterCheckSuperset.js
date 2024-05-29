const qlFunction = require('./qlFunctions/qlFunction')
const compileFilter = require('./compileFilter')

function filterCheckSuperset (filter, other) {
  return filter.some(f => {
    return other.every(o => {
      return compare(f, o)
    })
  })
}

function compare (f, o) {
  if (f.type !== 'nwr' && f.type !== o.type) {
    return false
  }

  const result = !f.filters.some(filter => {
    return !o.filters.some(otherFilter => {
      if (filter instanceof qlFunction && otherFilter instanceof qlFunction) {
        const r = filter.isSupersetOf(otherFilter)
        if (r !== undefined) {
          return r
        }
      }

      if (compileFilter(filter) === compileFilter(otherFilter)) {
        return true
      }

      if (['~', '~i'].includes(filter.op) && otherFilter.op === '=' && filter.key === otherFilter.key && otherFilter.value.match(RegExp(filter.value, filter.op === '~i' ? 'i' : ''))) {
        return true
      }
      if (['~', '~i'].includes(filter.op) && filter.keyRegexp && otherFilter.op === '=' && otherFilter.key.match(RegExp(filter.key, filter.keyRegexp === 'i' ? 'i' : '')) && otherFilter.value.match(RegExp(filter.value, filter.op === '~i' ? 'i' : ''))) {
        return true
      }
      if (filter.op === 'has_key' && otherFilter.op && !['!=', '!~', '!~i', 'not_exists'].includes(otherFilter.op) && filter.key === otherFilter.key) {
        return true
      }
      if (filter.op === 'has_key' && filter.keyRegexp && otherFilter.op && !['!=', '!~', '!~i', 'not_exists'].includes(otherFilter.op) && otherFilter.key.match(RegExp(filter.key, filter.keyRegexp === 'i' ? 'i' : ''))) {
        return true
      }
      if (filter instanceof qlFunction && otherFilter instanceof qlFunction && filter.isSupersetOf(otherFilter)) {
        return true
      }
      return false
    })
  })

  return result
}

module.exports = filterCheckSuperset
