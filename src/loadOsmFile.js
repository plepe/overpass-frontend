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
      return callback(e)
    }

    url = parsed.contentType === 'application/json'
      ? 'file.json'
      : parsed.contentType.match(/^application\/x-bzip/)
        ? 'file.osm.bz2'
        : 'file.osm'

    let data
    try {
      data = convertData(url, parsed.toBuffer())
    } catch (err) {
      return callback(err)
    }

    return callback(null, data)
  }

  if (typeof location === 'undefined' && !url.match(/^(http:|https:|)\/\//)) {
    fs.readFile(url,
      (err, content) => {
        if (err) { return callback(err) }

        let data
        try {
          data = convertData(url, content)
        } catch (err) {
          return global.setTimeout(() => callback(err), 0)
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
        let data = url.match(/\.osm\.bz2$/) ? new Uint8Array(req.response) : req.responseText
        try {
          data = convertData(url, data)
        }
        catch (err) {
          return callback(err)
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

    try {
      data = new DOMParser().parseFromString(content.toString(), 'text/xml')
    }
    catch (err) {
      throw new Error("Error parsing XML file: " + err)
    }

    return convertFromXML(data.getElementsByTagName('osm')[0])
  } else {
    try {
      return JSON.parse(content)
    }
    catch (err) {
      throw new Error("Error parsing JSON file: " + err)
    }
  }
}
