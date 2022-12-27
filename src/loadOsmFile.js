const fs = require('fs')
const DOMParser = require('@xmldom/xmldom').DOMParser
const bzip2 = require('bzip2')
const parseDataUrl = require('parse-data-url')

const convertFromXML = require('./convertFromXML')

module.exports = function loadOsmFile (url, callback) {
  if (url.match(/^data:/)) {
    const parsed = parseDataUrl(url)
    if (!parsed) {
      const e = new Error('Error parsing data URL')
      return global.setTimeout(() => callback(e), 0)
    }

    url = parsed.contentType === 'application/json'
      ? 'file.json'
      : parsed.contentType.match(/^application\/x-bzip/)
        ? 'file.osm.bz2'
        : 'file.osm'

    return callback(null, convertData(url, parsed.toBuffer()))
  }

  if (typeof location === 'undefined' && !url.match(/^(http:|https:|)\/\//)) {
    fs.readFile(url,
      (err, content) => {
        if (err) { return callback(err) }

        const data = convertData(url, content)
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

function convertData (url, content) {
  let data
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
    return convertFromXML(data.getElementsByTagName('osm')[0])
  } else {
    return JSON.parse(content)
  }
}
