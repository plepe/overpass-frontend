const DOMParser = require('@xmldom/xmldom').DOMParser
const convertFromXML = require('./convertFromXML')

module.exports = {
  id: 'OSMXML',

  willLoad (url, content, options) {
    return url.match(/\.osm(\.bz2)?$/)
  },

  load (content, options, callback) {
    const data = new DOMParser().parseFromString(content.toString(), 'text/xml')
    const result = convertFromXML(data.getElementsByTagName('osm')[0])

    callback(null, result)
  }
}
