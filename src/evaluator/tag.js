module.exports = {
  eval (p, context) {
    return context.tags && context.tags[p[0]]
  },

  compileLokiJS (param) {
    if (param[0] && 'value' in param[0]) {
      const r = {}
      r['tags.' + param[0].value] = { $exists: true }
      return r
    }
  }
}
