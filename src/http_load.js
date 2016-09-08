if(typeof require != 'undefined') {
  var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest
}

function http_load(url, get_param, post_param, callback) {
  var req = new XMLHttpRequest();
  req.onreadystatechange = function() {
    if(req.readyState == 4 && req.status == 200) {
      var data = JSON.parse(req.responseText);
      callback(null, data);
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
