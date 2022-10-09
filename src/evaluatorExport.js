module.exports = function evaluatorExport (current) {
  if (current === null || ['number', 'string', 'boolean'].includes(typeof current)) {
    return current
  }

  if ('op' in current) {
    return { op: current.op, left: evaluatorExport(current.left), right: evaluatorExport(current.right) }
  }

  if ('fun' in current) {
    return current.export()
  }

  return current
}
