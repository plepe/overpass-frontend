var fs = require('fs')
var conf = JSON.parse(fs.readFileSync('test/conf.json', 'utf8'));

if (!conf.generator) {
  console.error('Set correct "generator" string in test/conf.json!')
  process.exit(0)
}

var assert = require('assert')
var async = require('async')

var DOMParser = require('@xmldom/xmldom').DOMParser
var XMLSerializer = require('@xmldom/xmldom').XMLSerializer
var document = new DOMParser().parseFromString('<xml></xml>', 'text/xml').documentElement

var OverpassFrontend = require('../src/OverpassFrontend')
var overpassFrontend = new OverpassFrontend(conf.url)

describe('RequestBBox exportOSMXML', function() {
  it('Query with default options', function (done) {
    overpassFrontend.clearCache()
    const file = 'test/files/RequestBBox-export-1.xml'
    var expected = fs.readFileSync(file).toString()

    var req = overpassFrontend.BBoxQuery(
      "(node[level=0];nwr[building];way[highway];relation[level='-1'];)",
      {
	"minlat": 48.19610,
	"minlon": 16.33800,
	"maxlat": 48.19620,
	"maxlon": 16.33810
      }
    )

    const osm = document.ownerDocument.createElement('osm')
    osm.setAttribute('version', '0.6')

    req.exportOSMXML({}, osm, (err) => {
      if (err) {
        return done(err)
      }

      let serializer = new XMLSerializer()
      let text = serializer.serializeToString(osm)
      //fs.writeFileSync(file, text)

      assert.deepEqual(text, expected)

      done()
    })
  })
})
