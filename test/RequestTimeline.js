var fs = require('fs')
var conf = JSON.parse(fs.readFileSync('test/conf.json', 'utf8'));

if (!conf.generator) {
  console.error('Set correct "generator" string in test/conf.json!')
  process.exit(0)
}

const assert = require('assert')
const async = require('async')

const OverpassFrontend = require('..')

if (typeof XMLHttpRequest === 'undefined') {
  global.XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest
  const DOMParser = require('xmldom').DOMParser
}

let overpassFrontend

describe('Request timeline from Overpass API (with attic data)', function () {
  it('init', function () {
    overpassFrontend = new OverpassFrontend(conf['url-history'], {attic: true})
  })

  it('Load timeline of a node', function (done) {
    overpassFrontend.getTimeline(
      'n973838907',
      {},
      (err, result) => {
        console.log(result)
      },
      (err) => done(err)
    )
  })
})
