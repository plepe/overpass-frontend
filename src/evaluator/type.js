module.exports = {
  eval (p, context) {
    return context.type
  },

  compileLokiJS (param) {
    return { type: { $exists: true } }
  }
}
