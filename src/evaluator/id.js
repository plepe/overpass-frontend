module.exports = {
  eval (p, context) {
    return context.osm_id
  },

  compileLokiJS (param) {
    return { osm_id: { $exists: true } }
  }
}
