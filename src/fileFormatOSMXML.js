const DOMParser = require('@xmldom/xmldom').DOMParser
const convertFromXML = require('./convertFromXML')

module.exports = {
  id: 'OSMXML',

  willLoad (url, content, options) {
    return url.match(/\.osm$/)
  },

  load (content, options, callback) {
    let data
    const parser = new DOMParser({
      errorHandler: {
        error: (err) => { throw new Error('Error parsing XML file: ' + err) },
        fatalError: (err) => { throw new Error('Error parsing XML file: ' + err) }
      }
    })
    try {
      data = parser.parseFromString(content.toString(), 'text/xml')
    } catch (err) {
      return callback(err)
    }

    const result = convertFromXML(data.getElementsByTagName('osm')[0])

    callback(null, result)
  }
}
