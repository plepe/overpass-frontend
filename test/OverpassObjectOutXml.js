const fs = require('fs')
const conf = JSON.parse(fs.readFileSync('test/conf.json', 'utf8'));
const assert = require('assert').strict
const DOMParser = require('@xmldom/xmldom').DOMParser
const XMLSerializer = require('@xmldom/xmldom').XMLSerializer

const OverpassFrontend = require('..')
const testOverpassObject = require('./src/testOverpassObject')
const loadOverpassFrontendFile = require('./src/loadOverpassFrontendFile.js')

const toTest = [
  'n3037893171',
  'n377991',
  'w299709376',
  'w31254026',
  'r2334391',
  'r3237099',
  'r7735480',
  'r6384718',
  'r6487824',
  'r6412377',
  'r20313',
]

const exceptions = {
//  'w299709376': ['center', 'noids center'],
//  'w31254026': ['center', 'noids center'],
//  'r2334391': ['center', 'noids center'],
  'r3237099': ['center', 'noids center'],
  'r6384718': ['bb', 'noids bb', 'center', 'noids center'],
  'r6487824': ['bb', 'noids bb', 'center', 'noids center'],
//  'r6412377': ['center', 'noids center'],
  'r20313': ['geom', 'ids geom', 'tags geom', 'meta geom', 'skel geom', 'noids geom', 'bb', 'noids bb', 'center', 'noids center'], // bounds missing in file load mode
}

const outVariants = [
  '', 'ids', 'skel', 'body', 'tags', 'meta', 'geom', 'ids geom', 'ids tags', 'tags geom', 'meta geom', 'skel geom', 'noids', 'noids skel', 'noids geom', 'noids tags', 'bb', 'noids bb', 'center', 'noids center',
  // 'bb center', -- Overpass API always returns either center OR bounds
]

const originalResults = {}

const overpassFrontendFile = loadOverpassFrontendFile('test/data.osm.bz2')

const parser = new DOMParser({
  errorHandler: {
    error: (err) => { throw new Error('Error parsing XML file: ' + err) },
    fatalError: (err) => { throw new Error('Error parsing XML file: ' + err) }
  }
})

const types = { n: 'node', w: 'way', r: 'relation' }
describe('Overpass Object Structures', function () {
  describe('get original results', function () {
   
    it('get all objects', function (done) { 
      let query = '[out:xml];\n'

      toTest.forEach(osmId => {
        let type = osmId[0]
        let id = osmId.substr(1)

        outVariants.forEach(outParam => {
          query += types[type] + '(' + id + ');out ' + outParam + ';out count;\n'
        })
      })

      fetch(conf.url, {
        method: 'POST',
        body: query
      })
        .then(req => req.text())
        .then(receive)

      function receive (results) {
        results = results.split('\n  ').join('\n') // remove the first 2 spaces on each line
        const data = parser.parseFromString(results, 'text/xml')

        let osmPoi = 0
        let osmId = toTest[osmPoi]
        let varPoi = 0
        let variant = outVariants[varPoi]

        const osm = data.getElementsByTagName('osm')[0]
        let el = osm.firstChild
        
        originalResults[osmId] = {}
        originalResults[osmId][variant] = []

        while (el) {
          if (el.nodeName === 'count') {
            if (++varPoi >= outVariants.length) {
              varPoi = 0
              osmPoi++
              osmId = toTest[osmPoi]

              if (osmId) {
                originalResults[osmId] = {}
              }
            }

            variant = outVariants[varPoi]
            if (osmId && variant !== undefined) {
              originalResults[osmId][variant] = []
            }
          } else if (['node', 'way', 'relation'].includes(el.nodeName)) {
            originalResults[osmId][variant].push(el)
          }

          el = el.nextSibling
        }

        //console.log(JSON.stringify(originalResults, null, '  '))
        done()
      }
    })
  })

  describe('Load from OverpassFrontend via file', function () {
    const overpassFrontend = overpassFrontendFile
    const xml = parser.parseFromString('<xml/>', 'text/xml')
    const document = xml.ownerDocument
    const serializer = new XMLSerializer()

    toTest.forEach(osmId => {
      outVariants.forEach(outParam => {

        const outOptions = {}
        outParam.split(' ').forEach(o => outOptions[o] = true)

        it (osmId + ' ' + outParam, function (done) {
          overpassFrontend.get(osmId, {},
            (err, object) => {
              const actual = object.outXml(outOptions, document)
              const expected = originalResults[osmId][outParam][0]

              const actualText = serializer.serializeToString(actual)
              const expectText = serializer.serializeToString(originalResults[osmId][outParam][0])

              if (osmId in exceptions && exceptions[osmId].includes(outParam)) {
                console.log('skip test')
              } else {
                assert.equal(actualText, expectText, 'Items are not equal')
              }
            },
            (err) => {
              done()
            })
          })
        })
      })
  })

  describe('Load individually via OverpassFrontend.query() from server', function () {
    const overpassFrontend = new OverpassFrontend(conf.url)
    const serializer = new XMLSerializer()

    toTest.forEach(osmId => {
      let type = osmId[0]
      let id = osmId.substr(1)

      outVariants.forEach(outParam => {
        it (osmId + ' ' + outParam, function (done) {
          overpassFrontend.clearCache()

          const query = '[out:xml];' + types[type] + '(' + id + ');out ' + outParam + ';'
          overpassFrontend.query(query, {},
            (err, result) => {
              if (err) {
                assert.fail('Got error: ' + err.message)
              }

              const xml = parser.parseFromString(result, 'text/xml')
              const document = xml.ownerDocument

              const osm = document.getElementsByTagName('osm')[0]

              let countChildren = 0
              let current = osm.firstChild
              let element
              while (current) {
                if (current.tagName) {
                  countChildren++
                  element = current
                }
                current = current.nextSibling
              }

              const expected = originalResults[osmId][outParam][0]

              if (expected) {
                assert.equal(countChildren, 1, 'Expecting one element')
              } else {
                assert.equal(countChildren, 0, 'Expecting no elements')
              }

              if (element) {
                const actualText = serializer.serializeToString(element)
                const expectText = serializer.serializeToString(expected)

                assert.equal(actualText, expectText)
              }

              done()
            }
          )
        })
      })
    })
  })

  describe('Load individually via OverpassFrontend.query() from file', function () {
    const overpassFrontend = overpassFrontendFile
    const serializer = new XMLSerializer()

    toTest.forEach(osmId => {
      let type = osmId[0]
      let id = osmId.substr(1)

      outVariants.forEach(outParam => {
        it (osmId + ' ' + outParam, function (done) {
          overpassFrontend.clearCache()

          const query = '[out:xml];' + types[type] + '(' + id + ');out ' + outParam + ';'
          overpassFrontend.query(query, {},
            (err, result) => {
              if (err) {
                assert.fail('Got error: ' + err.message)
              }

              const xml = parser.parseFromString(result, 'text/xml')
              const document = xml.ownerDocument

              const osm = document.getElementsByTagName('osm')[0]

              let countChildren = 0
              let current = osm.firstChild
              let element
              while (current) {
                if (current.tagName) {
                  countChildren++
                  element = current
                }
                current = current.nextSibling
              }

              const expected = originalResults[osmId][outParam][0]

              if (expected) {
                assert.equal(countChildren, 1, 'Expecting one element')
              } else {
                assert.equal(countChildren, 0, 'Expecting no elements')
              }

              if (element) {
                const actualText = serializer.serializeToString(element)
                const expectText = serializer.serializeToString(expected)

                if (osmId in exceptions && exceptions[osmId].includes(outParam)) {
                  console.log('skip test')
                } else {
                  assert.equal(actualText, expectText, 'Items are not equal')
                }
              }

              done()
            }
          )
        })
      })
    })
  })
})
