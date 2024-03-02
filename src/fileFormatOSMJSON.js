module.exports = {
  id: 'OSMJSON',

  willLoad (url, content) {
    return url.match(/\.json(\.bz2)?$/)
  },

  load (content) {
    return JSON.parse(content)
  }
}
