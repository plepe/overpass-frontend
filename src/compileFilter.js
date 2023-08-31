const strsearch2regexp = require('strsearch2regexp')
const qlFunction = require('./qlFunctions/qlFunction')

module.exports = function compileFilter (part, options = {}) {
  if (Array.isArray(part)) {
    return part.map(compileFilter).join('')
  }

  if (part.or) {
    const result = { or: [], outputSet: '_' }
    part.or.forEach(p => {
      if (p.outputSet) {
        result.outputSet = p.outputSet
      } else {
        result.or.push(compileFilter(p))
      }
    })
    return result
  }

  const keyRegexp = (part.keyRegexp ? '~' : '')

  if (part instanceof qlFunction) {
    return part.toString(options)
  }

  if (part.type) {
    return part.type
  }

  if (part.recurse) {
    return '(' + part.recurse + (part.inputSet ? '.' + part.inputSet : '') + ')'
  }

  if (part.inputSet) {
    return '.' + part.inputSet
  }

  if (part.outputSet) {
    return '->.' + part.outputSet
  }

  switch (part.op) {
    case 'has_key':
      if (part.keyRegexp === 'i') {
        return '[~' + qlesc(part.key) + '~".",i]'
      } else if (keyRegexp) {
        return '[~' + qlesc(part.key) + '~"."]'
      } else {
        return '[' + keyRegexp + qlesc(part.key) + ']'
      }
    case 'not_exists':
      return '[!' + qlesc(part.key) + ']'
    case '=':
    case '!=':
    case '~':
    case '!~':
      return '[' + keyRegexp + qlesc(part.key) + part.op + qlesc(part.value) + ']'
    case '~i':
    case '!~i':
      return '[' + keyRegexp + qlesc(part.key) + part.op.substr(0, part.op.length - 1) + qlesc(part.value) + ',i]'
    case 'has':
      return '[' + keyRegexp + qlesc(part.key) + '~' + qlesc('^(.*;|)' + part.value + '(|;.*)$') + ']'
    case 'strsearch':
      return '[' + keyRegexp + qlesc(part.key) + '~' + qlesc(strsearch2regexp(part.value)) + ',i]'
    default:
      throw new Error('unknown operator' + JSON.stringify(part))
  }
}

function qlesc (str) {
  return '"' + str.replace(/"/g, '\\"') + '"'
}
