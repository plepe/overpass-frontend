const fs = require('fs')
const DOMParser = require('@xmldom/xmldom').DOMParser
const bzip2 = require('bzip2')

const convertFromXML = require('./convertFromXML')

module.exports = function loadOsmFile (url, callback) {
  if (typeof location === 'undefined' && !url.match(/^(http:|https:|)\/\//)) {
    fs.readFile(url,
      (err, content) => {
        let data

        if (err) {
          return callback(err)
        }

        if (url.match(/\.osm(\.bz2)?$/)) {
          if (url.match(/\.osm\.bz2$/)) {
            data = bzip2.simple(bzip2.array(content))
            content = ''
            for (let i = 0; i < data.byteLength; i++) {
              content += String.fromCharCode(data[i])
            }
            content = decodeURIComponent(escape(content))
          }

          data = new DOMParser().parseFromString(content.toString(), 'text/xml')
          data = convertFromXML(data.getElementsByTagName('osm')[0])
        } else {
          data = JSON.parse(content)
        }

        callback(null, data)
      }
    )

    return
  }

  const req = new global.XMLHttpRequest()

  req.onreadystatechange = function () {
    if (req.readyState === 4) {
      if (req.status === 200) {
        let data

        if (url.match(/\.osm\.bz2$/)) {
          let content = new Uint8Array(req.response)
          data = bzip2.simple(bzip2.array(content))
          content = ''
          for (let i = 0; i < data.byteLength; i++) {
            content += String.fromCharCode(data[i])
          }

          content = decodeURIComponent(escape(content))
          data = new DOMParser().parseFromString(content.toString(), 'text/xml')
          data = convertFromXML(data.getElementsByTagName('osm')[0])
        } else if (req.responseXML) {
          data = convertFromXML(req.responseXML.firstChild)
        } else {
          data = JSON.parse(req.responseText)
        }

        callback(null, data)
      } else {
        callback(req)
      }
    }
  }

  if (url.substr(0, 2) === '//') {
    if (typeof location === 'undefined') {
      url = 'https:' + url
    } else {
      url = global.location.protocol + url
    }
  }

  if (url.match(/\.osm\.bz2$/)) {
    req.responseType = 'arraybuffer'
  }

  req.overrideMimeType('text/xml')
  req.open('GET', url)
  req.send()
}
