const types = {}

module.exports = {
  get (def, filter) {
    for (let k in types) {
      if (def[k]) {
        return new types[k](def, filter)
      }
    }

    return new types.default(def, filter)
  },

  register (type, cls) {
    types[type] = cls
  }
}
