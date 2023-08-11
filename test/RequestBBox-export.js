var fs = require('fs')
var conf = JSON.parse(fs.readFileSync('test/conf.json', 'utf8'));

if (!conf.generator) {
  console.error('Set correct "generator" string in test/conf.json!')
  process.exit(0)
}

var assert = require('assert')
var async = require('async')

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

    req.export({
      format: 'osmxml'
    }, (err, text) => {
      if (err) {
        return done(err)
      }

      fs.writeFileSync(file, text)
      assert.deepEqual(text, expected)

      done()
    })
  })

  it('Query with only ID_ONLY', function (done) {
    overpassFrontend.clearCache()
    const file = 'test/files/RequestBBox-export-2.xml'
    var expected = fs.readFileSync(file).toString()

    var req = overpassFrontend.BBoxQuery(
      "(node[level=0];nwr[building];way[highway];relation[level='-1'];)",
      {
	"minlat": 48.19616,
	"minlon": 16.33801,
	"maxlat": 48.19617,
	"maxlon": 16.33802
      }
    )

    req.export({
      format: 'osmxml',
      properties: OverpassFrontend.ID_ONLY
    }, (err, text) => {
      if (err) {
        return done(err)
      }

      fs.writeFileSync(file, text)
      assert.deepEqual(text, expected)

      done()
    })
  })

  it('Query with only TAGS', function (done) {
    overpassFrontend.clearCache()
    const file = 'test/files/RequestBBox-export-3.xml'
    var expected = fs.readFileSync(file).toString()

    var req = overpassFrontend.BBoxQuery(
      "(node[level=0];nwr[building];way[highway];relation[level='-1'];)",
      {
	"minlat": 48.19616,
	"minlon": 16.33801,
	"maxlat": 48.19617,
	"maxlon": 16.33802
      }
    )

    req.export({
      format: 'osmxml',
      properties: OverpassFrontend.TAGS
    }, (err, text) => {
      if (err) {
        return done(err)
      }

      fs.writeFileSync(file, text)
      assert.deepEqual(text, expected)

      done()
    })
  })

  it('Query with only META', function (done) {
    overpassFrontend.clearCache()
    const file = 'test/files/RequestBBox-export-4.xml'
    var expected = fs.readFileSync(file).toString()

    var req = overpassFrontend.BBoxQuery(
      "(node[level=0];nwr[building];way[highway];relation[level='-1'];)",
      {
	"minlat": 48.19616,
	"minlon": 16.33801,
	"maxlat": 48.19617,
	"maxlon": 16.33802
      }
    )

    req.export({
      format: 'osmxml',
      properties: OverpassFrontend.META
    }, (err, text) => {
      if (err) {
        return done(err)
      }

      fs.writeFileSync(file, text)
      assert.deepEqual(text, expected)

      done()
    })
  })

  it('Query with only MEMBERS', function (done) {
    overpassFrontend.clearCache()
    const file = 'test/files/RequestBBox-export-5.xml'
    var expected = fs.readFileSync(file).toString()

    var req = overpassFrontend.BBoxQuery(
      "(node[level=0];nwr[building];way[highway];relation[level='-1'];)",
      {
	"minlat": 48.19616,
	"minlon": 16.33801,
	"maxlat": 48.19617,
	"maxlon": 16.33802
      }
    )

    req.export({
      format: 'osmxml',
      properties: OverpassFrontend.MEMBERS
    }, (err, text) => {
      if (err) {
        return done(err)
      }

      fs.writeFileSync(file, text)
      assert.deepEqual(text, expected)

      done()
    })
  })

  it('Query with only BBOX', function (done) {
    overpassFrontend.clearCache()
    const file = 'test/files/RequestBBox-export-6.xml'
    var expected = fs.readFileSync(file).toString()

    var req = overpassFrontend.BBoxQuery(
      "(node[level=0];nwr[building];way[highway];relation[level='-1'];)",
      {
	"minlat": 48.19616,
	"minlon": 16.33801,
	"maxlat": 48.19617,
	"maxlon": 16.33802
      }
    )

    req.export({
      format: 'osmxml',
      properties: OverpassFrontend.BBOX
    }, (err, text) => {
      if (err) {
        return done(err)
      }

      fs.writeFileSync(file, text)
      assert.deepEqual(text, expected)

      done()
    })
  })

  it('Query with only GEOM', function (done) {
    overpassFrontend.clearCache()
    const file = 'test/files/RequestBBox-export-7.xml'
    var expected = fs.readFileSync(file).toString()

    var req = overpassFrontend.BBoxQuery(
      "(node[level=0];nwr[building];way[highway];relation[level='-1'];)",
      {
	"minlat": 48.19616,
	"minlon": 16.33801,
	"maxlat": 48.19617,
	"maxlon": 16.33802
      }
    )

    req.export({
      format: 'osmxml',
      properties: OverpassFrontend.GEOM
    }, (err, text) => {
      if (err) {
        return done(err)
      }

      fs.writeFileSync(file, text)
      assert.deepEqual(text, expected)

      done()
    })
  })

  it('Query with only CENTER', function (done) {
    overpassFrontend.clearCache()
    const file = 'test/files/RequestBBox-export-8.xml'
    var expected = fs.readFileSync(file).toString()

    var req = overpassFrontend.BBoxQuery(
      "(node[level=0];nwr[building];way[highway];relation[level='-1'];)",
      {
	"minlat": 48.19616,
	"minlon": 16.33801,
	"maxlat": 48.19617,
	"maxlon": 16.33802
      }
    )

    req.export({
      format: 'osmxml',
      properties: OverpassFrontend.CENTER
    }, (err, text) => {
      if (err) {
        return done(err)
      }

      fs.writeFileSync(file, text)
      assert.deepEqual(text, expected)

      done()
    })
  })

  it('Query with EMBED_GEOM', function (done) {
    overpassFrontend.clearCache()
    const file = 'test/files/RequestBBox-export-9.xml'
    var expected = fs.readFileSync(file).toString()

    var req = overpassFrontend.BBoxQuery(
      "(node[level=0];nwr[building];way[highway];relation[level='-1'];)",
      {
	"minlat": 48.19616,
	"minlon": 16.33801,
	"maxlat": 48.19617,
	"maxlon": 16.33802
      }
    )

    req.export({
      format: 'osmxml',
      properties: OverpassFrontend.EMBED_GEOM
    }, (err, text) => {
      if (err) {
        return done(err)
      }

      fs.writeFileSync(file, text)
      assert.deepEqual(text, expected)

      done()
    })
  })

  it('Query with BODY', function (done) {
    overpassFrontend.clearCache()
    const file = 'test/files/RequestBBox-export-10.xml'
    var expected = fs.readFileSync(file).toString()

    var req = overpassFrontend.BBoxQuery(
      "(node[level=0];nwr[building];way[highway];relation[level='-1'];)",
      {
	"minlat": 48.19616,
	"minlon": 16.33801,
	"maxlat": 48.19617,
	"maxlon": 16.33802
      }
    )

    req.export({
      format: 'osmxml',
      properties: OverpassFrontend.BODY
    }, (err, text) => {
      if (err) {
        return done(err)
      }

      fs.writeFileSync(file, text)
      assert.deepEqual(text, expected)

      done()
    })
  })
})

describe('RequestBBox exportOSMJSON', function() {
  it('Query with default options', function (done) {
    overpassFrontend.clearCache()
    const file = 'test/files/RequestBBox-export-1.json'
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

    req.export({
      format: 'osmjson'
    }, (err, text) => {
      if (err) {
        return done(err)
      }

      fs.writeFileSync(file, text)
      assert.deepEqual(text, expected)

      done()
    })
  })

  it('Query with only ID_ONLY', function (done) {
    overpassFrontend.clearCache()
    const file = 'test/files/RequestBBox-export-2.json'
    var expected = fs.readFileSync(file).toString()

    var req = overpassFrontend.BBoxQuery(
      "(node[level=0];nwr[building];way[highway];relation[level='-1'];)",
      {
	"minlat": 48.19616,
	"minlon": 16.33801,
	"maxlat": 48.19617,
	"maxlon": 16.33802
      }
    )

    req.export({
      format: 'osmjson',
      properties: OverpassFrontend.ID_ONLY
    }, (err, text) => {
      if (err) {
        return done(err)
      }

      fs.writeFileSync(file, text)
      assert.deepEqual(text, expected)

      done()
    })
  })

  it('Query with only TAGS', function (done) {
    overpassFrontend.clearCache()
    const file = 'test/files/RequestBBox-export-3.json'
    var expected = fs.readFileSync(file).toString()

    var req = overpassFrontend.BBoxQuery(
      "(node[level=0];nwr[building];way[highway];relation[level='-1'];)",
      {
	"minlat": 48.19616,
	"minlon": 16.33801,
	"maxlat": 48.19617,
	"maxlon": 16.33802
      }
    )

    req.export({
      format: 'osmjson',
      properties: OverpassFrontend.TAGS
    }, (err, text) => {
      if (err) {
        return done(err)
      }

      fs.writeFileSync(file, text)

      assert.deepEqual(text, expected)

      done()
    })
  })

  it('Query with only META', function (done) {
    overpassFrontend.clearCache()
    const file = 'test/files/RequestBBox-export-4.json'
    var expected = fs.readFileSync(file).toString()

    var req = overpassFrontend.BBoxQuery(
      "(node[level=0];nwr[building];way[highway];relation[level='-1'];)",
      {
	"minlat": 48.19616,
	"minlon": 16.33801,
	"maxlat": 48.19617,
	"maxlon": 16.33802
      }
    )

    req.export({
      format: 'osmjson',
      properties: OverpassFrontend.META
    }, (err, text) => {
      if (err) {
        return done(err)
      }

      fs.writeFileSync(file, text)
      assert.deepEqual(text, expected)

      done()
    })
  })

  it('Query with only MEMBERS', function (done) {
    overpassFrontend.clearCache()
    const file = 'test/files/RequestBBox-export-5.json'
    var expected = fs.readFileSync(file).toString()

    var req = overpassFrontend.BBoxQuery(
      "(node[level=0];nwr[building];way[highway];relation[level='-1'];)",
      {
	"minlat": 48.19616,
	"minlon": 16.33801,
	"maxlat": 48.19617,
	"maxlon": 16.33802
      }
    )

    req.export({
      format: 'osmjson',
      properties: OverpassFrontend.MEMBERS
    }, (err, text) => {
      if (err) {
        return done(err)
      }

      fs.writeFileSync(file, text)
      assert.deepEqual(text, expected)

      done()
    })
  })

  it('Query with only BBOX', function (done) {
    overpassFrontend.clearCache()
    const file = 'test/files/RequestBBox-export-6.json'
    var expected = fs.readFileSync(file).toString()

    var req = overpassFrontend.BBoxQuery(
      "(node[level=0];nwr[building];way[highway];relation[level='-1'];)",
      {
	"minlat": 48.19616,
	"minlon": 16.33801,
	"maxlat": 48.19617,
	"maxlon": 16.33802
      }
    )

    req.export({
      format: 'osmjson',
      properties: OverpassFrontend.BBOX
    }, (err, text) => {
      if (err) {
        return done(err)
      }

      fs.writeFileSync(file, text)
      assert.deepEqual(text, expected)

      done()
    })
  })

  it('Query with only GEOM', function (done) {
    overpassFrontend.clearCache()
    const file = 'test/files/RequestBBox-export-7.json'
    var expected = fs.readFileSync(file).toString()

    var req = overpassFrontend.BBoxQuery(
      "(node[level=0];nwr[building];way[highway];relation[level='-1'];)",
      {
	"minlat": 48.19616,
	"minlon": 16.33801,
	"maxlat": 48.19617,
	"maxlon": 16.33802
      }
    )

    req.export({
      format: 'osmjson',
      properties: OverpassFrontend.GEOM
    }, (err, text) => {
      if (err) {
        return done(err)
      }

      fs.writeFileSync(file, text)
      assert.deepEqual(text, expected)

      done()
    })
  })

  it('Query with only CENTER', function (done) {
    overpassFrontend.clearCache()
    const file = 'test/files/RequestBBox-export-8.json'
    var expected = fs.readFileSync(file).toString()

    var req = overpassFrontend.BBoxQuery(
      "(node[level=0];nwr[building];way[highway];relation[level='-1'];)",
      {
	"minlat": 48.19616,
	"minlon": 16.33801,
	"maxlat": 48.19617,
	"maxlon": 16.33802
      }
    )

    req.export({
      format: 'osmjson',
      properties: OverpassFrontend.CENTER
    }, (err, text) => {
      if (err) {
        return done(err)
      }

      fs.writeFileSync(file, text)
      assert.deepEqual(text, expected)

      done()
    })
  })

  it('Query with EMBED_GEOM', function (done) {
    overpassFrontend.clearCache()
    const file = 'test/files/RequestBBox-export-9.json'
    var expected = fs.readFileSync(file).toString()

    var req = overpassFrontend.BBoxQuery(
      "(node[level=0];nwr[building];way[highway];relation[level='-1'];)",
      {
	"minlat": 48.19616,
	"minlon": 16.33801,
	"maxlat": 48.19617,
	"maxlon": 16.33802
      }
    )

    req.export({
      format: 'osmjson',
      properties: OverpassFrontend.EMBED_GEOM
    }, (err, text) => {
      if (err) {
        return done(err)
      }

      fs.writeFileSync(file, text)
      assert.deepEqual(text, expected)

      done()
    })
  })

  it('Query with BODY', function (done) {
    overpassFrontend.clearCache()
    const file = 'test/files/RequestBBox-export-10.json'
    var expected = fs.readFileSync(file).toString()

    var req = overpassFrontend.BBoxQuery(
      "(node[level=0];nwr[building];way[highway];relation[level='-1'];)",
      {
	"minlat": 48.19616,
	"minlon": 16.33801,
	"maxlat": 48.19617,
	"maxlon": 16.33802
      }
    )

    req.export({
      format: 'osmjson',
      properties: OverpassFrontend.BODY
    }, (err, text) => {
      if (err) {
        return done(err)
      }

      fs.writeFileSync(file, text)
      assert.deepEqual(text, expected)

      done()
    })
  })
})
