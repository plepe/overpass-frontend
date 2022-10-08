module.exports = {
  eval (p, context) {
    return context.tags ? Object.keys(context.tags).length : null
  },

//  compileLokiJS (param) {
//  }
}
