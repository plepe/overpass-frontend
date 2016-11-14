/* global location:false */

if (typeof XMLHttpRequest === 'undefined') {
  var XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest
}

function httpLoad (url, getParam, postParam, callback) {
  var req = new XMLHttpRequest()

  req.onreadystatechange = function () {
    var data = null
    var err = null

    if (req.readyState === 4) {
      if (req.status === 200) {
        try {
          data = JSON.parse(req.responseText)
        } catch (err) {
          // err already set
        }

        callback(err, data)
      } else {
        try {
          err = JSON.parse(req.responseText)
        } catch (err) {
          if (req.responseText.search('OSM3S Response') !== -1) {
            var lines = req.responseText.split(/\n/)
            var e = ''

            for (var i = 0; i < lines.length; i++) {
              var m
              if ((m = lines[i].match(/<p><strong style="color:#FF0000">Error<\/strong>: (.*)<\/p>/))) {
                e += m[1] + '\n'
              }
            }

            // Could not parse error message - create alternative
            if (e === '') {
              e = 'Got error ' + req.status
            }

            callback(e, null)
          } else {
            callback(req.responseText, null)
          }
        }
      }
    }
  }

  var reqType = 'GET'
  var postData = null
  if (postParam) {
    reqType = 'POST'
    postData = postParam
  }

  if (url.substr(0, 2) === '//') {
    if (typeof location === 'undefined') {
      url = 'https:' + url
    } else {
      url = location.protocol + url
    }
  }

  req.open(reqType, url, true)
  try {
    req.send(postData)
  } catch (err) {
    callback(err, null)
  }
}

module.exports = httpLoad
