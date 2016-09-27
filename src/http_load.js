if(typeof require != 'undefined') {
  var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest
}

function http_load(url, get_param, post_param, callback) {
  var req = new XMLHttpRequest();
  req.onreadystatechange = function() {
    var data = null
    var err = null

    if(req.readyState == 4) {
      if(req.status == 200) {
        try {
          data = JSON.parse(req.responseText)
        }
        catch (err) {
          // err already set
        }

        callback(err, data)
      }
      else {
        try {
          err = JSON.parse(req.responseText)
        }
        catch (err) {
          var lines = req.responseText.split(/\n/)
          var err = ''

          for (var i = 0; i < lines.length; i++) {
            var m
            if (m = lines[i].match(/<p><strong style="color:#FF0000">Error<\/strong>: (.*)<\/p>/))
              err += m[1] + '\n'
          }

          callback(err, null)
        }
      }
    }
  }

  var req_type = 'GET';
  var post_data = null;
  if(post_param) {
    req_type = 'POST';
    post_data = post_param;
  }

  req.open(req_type, url, true);
  req.send(post_data);
}

if(typeof module != 'undefined' && module.exports)
  module.exports = http_load 
