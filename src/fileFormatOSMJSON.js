module.exports = {
  id: 'OSMJSON',

  willLoad (url, content, options) {
    return url.match(/\.json(\.bz2)?$/)
  },

  load (content, options, callback) {
    callback(null, JSON.parse(content))
  }
}
