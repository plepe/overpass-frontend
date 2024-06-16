const compileRecurseReverse = require('./compileRecurseReverse')

function compileRecurseFilter (script, outputId, inputId) {
  let result = ''

  if (inputId === outputId) {
    return ''
  }

  const output = script.filter(e => e.id == outputId)[0]
  result = output.recurse.map(input => {
    if (input.id == inputId) {
      return compileRecurseReverse(input, output)
    } else {
      return compileRecurseFilter(script, input.id, inputId)
    }
  }).join('')

  return result
}

module.exports = compileRecurseFilter
