const strsearch2regexp = require('strsearch2regexp')
const qlFunction = require('./qlFunctions/qlFunction')
const qlQuoteString = require('./qlQuoteString')

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
    return '(' + part.recurse + (part.inputSet ? '.' + part.inputSet : '') + ('role' in part ? part.role : '') + ')'
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
        return '[~' + qlQuoteString(part.key) + '~".",i]'
      } else if (keyRegexp) {
        return '[~' + qlQuoteString(part.key) + '~"."]'
      } else {
        return '[' + keyRegexp + qlQuoteString(part.key) + ']'
      }
    case 'not_exists':
      return '[!' + qlQuoteString(part.key) + ']'
    case '=':
    case '!=':
    case '~':
    case '!~':
      return '[' + keyRegexp + qlQuoteString(part.key) + part.op + qlQuoteString(part.value) + ']'
    case '~i':
    case '!~i':
      return '[' + keyRegexp + qlQuoteString(part.key) + part.op.substr(0, part.op.length - 1) + qlQuoteString(part.value) + ',i]'
    case 'has':
      return '[' + keyRegexp + qlQuoteString(part.key) + '~' + qlQuoteString('^(.*;|)' + part.value + '(|;.*)$') + ']'
    case 'strsearch':
      return '[' + keyRegexp + qlQuoteString(part.key) + '~' + qlQuoteString(strsearch2regexp(part.value)) + ',i]'
    default:
      throw new Error('unknown operator' + JSON.stringify(part))
  }
}
