const fs = require('fs')
const bzip2 = require('bzip2')
const parseDataUrl = require('parse-data-url')

module.exports = function loadFile (url, options, callback) {
  let filename = url
  if ('filename' in options) {
    filename = options.filename
  }

  if (url.match(/^data:/)) {
    const parsed = parseDataUrl(url)
    if (!parsed) {
      const e = new Error('Error parsing data URL')
      return callback(e)
    }

    let content = parsed.toBuffer()

    const m = filename.match(/^(.*)\.bz2$/)
    if (m || parsed.contentType === 'application/x-bzip') {
      try {
        content = bzip2decode(content)
      } catch (err) {
        return callback(err)
      }
      filename = m ? m[1] : filename
    }

    if (filename === url) {
      filename = parsed.contentType === 'application/json'
        ? 'file.osm.json'
          : 'file.osm'
    }

    return callback(null, content, filename)
  }

  if (typeof location === 'undefined' && !url.match(/^(http:|https:|)\/\//)) {
    fs.readFile(url,
      (err, content) => {
        if (err) {
          return callback(err)
        }

        const m = filename.match(/^(.*)\.bz2$/)
        if (m) {
          try {
            content = bzip2decode(content)
          } catch (err) {
            return callback(err)
          }
          filename = m[1]
        }

        callback(null, content, filename)
      }
    )

    return
  }

  const req = new global.XMLHttpRequest()

  req.onreadystatechange = function () {
    if (req.readyState === 4) {
      if (req.status === 200) {
        let content

        const m = filename.match(/^(.*)\.bz2$/)
        if (m) {
          try {
            content = bzip2decode(new Uint8Array(req.response))
          } catch (err) {
            return callback(err)
          }
          filename = m[1]
        } else {
          content = req.response
        }

        callback(null, content, filename)
      } else {
        callback(new Error('Received error ' + req.status + ' (' + req.statusText + ')'))
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

  if (filename.match(/\.bz2$/)) {
    req.responseType = 'arraybuffer'
  }

  req.open('GET', url)
  req.send()
}

function bzip2decode (file) {
  let data

  try {
    data = bzip2.simple(bzip2.array(file))
  } catch (err) {
    throw new Error('Error decoding bzip2 stream')
  }

  let content = ''

  for (let i = 0; i < data.byteLength; i++) {
    content += String.fromCharCode(data[i])
  }

  return decodeURIComponent(escape(content))
}
