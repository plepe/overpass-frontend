const DOMParser = require('@xmldom/xmldom').DOMParser
const convertFromXML = require('./convertFromXML')

module.exports = {
  id: 'OSMXML',

  willLoad (url, content) {
    return url.match(/\.osm(\.bz2)?$/)
  },

  load (content) {
    let data = new DOMParser().parseFromString(content.toString(), 'text/xml')
    return convertFromXML(data.getElementsByTagName('osm')[0])
  }
}
