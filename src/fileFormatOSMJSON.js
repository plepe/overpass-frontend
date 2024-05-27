module.exports = {
  id: 'OSMJSON',

  willLoad (url, content, options) {
    return url.match(/\.osm\.json$/)
  },

  load (content, options, callback) {
    let result

    try {
      result = JSON.parse(content)
    } catch (err) {
      return callback(new Error('Error parsing JSON file: ' + err.message))
    }

    callback(null, result)
  }
}
