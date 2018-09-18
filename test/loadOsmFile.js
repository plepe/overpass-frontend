const loadOsmFile = require('../src/loadOsmFile')
if (typeof XMLHttpRequest === 'undefined') {
  global.XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest
}

const lokijs = require('lokijs')

describe('.osm', function () {
  it ('test', function (done) {
    loadOsmFile('test/data.osm', (err, result) => {

      var db = new lokijs()
      let osm = db.addCollection('osm')
      osm.insert(result.elements.map(ob => ob.tags))


      console.log(osm.find({ 'cuisine': { '$contains': 'kebab' }}))


      console.log(result)//.map(ob => ob.tags))



      done(err)
    })
  })
})
