const fs = require('fs')
const DOMParser = require('xmldom').DOMParser

const convertFromXML = require('./convertFromXML')

module.exports = function loadOsmFile (url, callback) {
  if (typeof location === 'undefined' && !url.match(/^(http:|https:|)\/\//)) {
    fs.readFile(url,
      (err, content) => {
        let data

        if (err) {
          return callback(err)
        }

        if (url.match(/\.osm$/)) {
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

  let req = new XMLHttpRequest()

  req.onreadystatechange = function () {
    if (req.readyState === 4) {
      if (req.status === 200) {
        let data

        if (req.responseXML) {
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
      url = location.protocol + url
    }
  }

  req.open('GET', url)
  req.send()
}
