module.exports = {
  eval (p, context, that) {
    return that.exec(context, p[0])
  },

  compileLokiJS (param) {
    return param[0]
  }
}
