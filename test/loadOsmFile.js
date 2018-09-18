const loadOsmFile = require('../src/loadOsmFile')
if (typeof XMLHttpRequest === 'undefined') {
  global.XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest
  const DOMParser = require('xmldom').DOMParser
}

describe('.osm', function () {
  it ('test', function (done) {
    loadOsmFile('test/data.osm', (err, result) => {
      console.log(result)
      done(err)
    })
  })
})
