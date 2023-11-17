const types = {}

module.exports = {
  get (def, filter) {
    for (const k in types) {
      if (def[k]) {
        return new types[k](def, filter)
      }
    }

    const Type = types.default
    return new Type(def, filter)
  },

  register (type, cls) {
    types[type] = cls
  }
}
