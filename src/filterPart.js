/* eslint-disable new-cap */
const types = {}

module.exports = {
  get (def, filter, options) {
    for (const k in types) {
      if (def[k]) {
        return new types[k](def, filter, options)
      }
    }

    return new types.default(def, filter, options)
  },

  register (type, cls) {
    types[type] = cls
  }
}
