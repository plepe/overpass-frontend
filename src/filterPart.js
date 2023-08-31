/* eslint-disable new-cap */
const types = {}

module.exports = {
  get (def, filter) {
    for (const k in types) {
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
