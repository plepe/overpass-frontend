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
          return callback(err)
        }

        callback(null, data)
      }
    )

    return
  }

  fetch(url)
    .then(req => {
      if (!req.ok) {
        const e = new Error('Received error ' + req.status + ' (' + req.statusText + ')')
        return callback(e)
      }

      return url.match(/\.osm\.bz2$/) ? req.arrayBuffer() : req.text()
    })
    .then(content => {
      let data = url.match(/\.osm\.bz2$/) ? new Uint8Array(content) : content
      try {
        data = convertData(url, data)
      } catch (err) {
        return callback(err)
      }

      callback(null, data)
    })
    .catch(err => {
      global.setTimeout(() => callback(err), 0)
    })
}

function convertData (url, content) {
  let data
  if (url.match(/\.osm(\.bz2)?$/)) {
    if (url.match(/\.osm\.bz2$/)) {
      try {
        data = bzip2.simple(bzip2.array(content))
      } catch (err) {
        throw new Error('Error decoding bzip2 stream')
      }

      content = ''
      for (let i = 0; i < data.byteLength; i++) {
        content += String.fromCharCode(data[i])
      }
      content = decodeURIComponent(escape(content))
    }

    const parser = new DOMParser({
      errorHandler: {
        error: (err) => { throw new Error('Error parsing XML file: ' + err) },
        fatalError: (err) => { throw new Error('Error parsing XML file: ' + err) }
      }
    })
    data = parser.parseFromString(content.toString(), 'text/xml')

    return convertFromXML(data.getElementsByTagName('osm')[0])
  } else {
    try {
      return JSON.parse(content)
    } catch (err) {
      throw new Error('Error parsing JSON file: ' + err)
    }
  }
}
