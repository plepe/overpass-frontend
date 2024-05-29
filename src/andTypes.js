module.exports = function andTypes (a, b) {
  if (a === 'nwr') {
    return b
  }
  if (b === 'nwr' || a === b) {
    return a
  }
}
