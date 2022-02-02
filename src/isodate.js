module.exports = function isodate (date = null) {
  return new Date(date).toISOString().replace(/\.\d{3}Z/, 'Z')
}
