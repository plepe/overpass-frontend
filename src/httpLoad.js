if (typeof require !== 'undefined') {
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
          var lines = req.responseText.split(/\n/)
          var e = ''

          for (var i = 0; i < lines.length; i++) {
            var m
            if ((m = lines[i].match(/<p><strong style="color:#FF0000">Error<\/strong>: (.*)<\/p>/))) {
              e += m[1] + '\n'
            }
          }

          callback(e, null)
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

  req.open(reqType, url, true)
  req.send(postData)
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = httpLoad
}
