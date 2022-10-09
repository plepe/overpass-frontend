module.exports = function evaluatorExport (current) {
  if (current === null || ['number', 'string', 'boolean'].includes(typeof current)) {
    return current
  }

  if ('op' in current) {
    return current.toJSON()
  }

  if ('fun' in current) {
    return current.toJSON()
  }

  return current
}
