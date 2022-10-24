module.exports = {
  isNumber (v) {
    if (typeof v === 'number') {
      return true
    }
    if (typeof v === 'boolean' || v === null || v === undefined) {
      return false
    }
    return !!v.match(/^[0-9]+(\.[0-9]+)?$/)
  },

  isValue (v) {
    return v === null || ['number', 'string', 'boolean'].includes(typeof v)
  }
}
