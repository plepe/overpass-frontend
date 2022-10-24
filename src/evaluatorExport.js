module.exports = function evaluatorExport (current) {
  if (current === null || ['number', 'string', 'boolean'].includes(typeof current)) {
    return current
  }

  return current.toJSON()
}
