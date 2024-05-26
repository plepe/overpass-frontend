const fs = require('fs')
const bzip2 = require('bzip2')

module.exports = function loadFile (url, options, callback) {
  let filename = url
  if ('filename' in options) {
    filename = options.filename
  }

  if (typeof location === 'undefined' && !url.match(/^(http:|https:|)\/\//)) {
    fs.readFile(url,
      (err, content) => {
        if (err) {
          return callback(err)
        }

        const m = filename.match(/^(.*)\.bz2$/)
        if (m) {
          content = bzip2decode(content)
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
          content = bzip2decode(new Uint8Array(req.response))
          filename = m[1]
        } else {
          content = req.response
        }

        callback(null, content, filename)
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

  if (filename.match(/\.bz2$/)) {
    req.responseType = 'arraybuffer'
  }

  req.open('GET', url)
  req.send()
}

function bzip2decode (file) {
  const data = bzip2.simple(bzip2.array(file))
  let content = ''

  for (let i = 0; i < data.byteLength; i++) {
    content += String.fromCharCode(data[i])
  }

  return decodeURIComponent(escape(content))
}
