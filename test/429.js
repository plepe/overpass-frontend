var fs = require('fs')
var conf = JSON.parse(fs.readFileSync('test/conf.json', 'utf8'));

if (!conf.generator) {
  console.error('Set correct "generator" string in test/conf.json!')
  process.exit(0)
}

var assert = require('assert')

var OverpassFrontend = require('../src/OverpassFrontend')

let url = conf.url + (conf.url.match(/\?/) ? '&' : '?') + 'status=429'
conf.timeGap429 = 10
conf.timeGap429Exp = 2

var overpassFrontend = new OverpassFrontend(url, conf)

describe('Retries after 429 error', function() {
  it('...', function(done) {
    this.timeout(20000)
    let rejectCount = 0

    overpassFrontend.on('reject', (status, context) => {
      rejectCount++
      if (status.errorCount !== rejectCount) {
        assert.fail('Error count does not correctly increase')
      }

      switch (rejectCount) {
        case 1:
          assert.equal(true, status.retry)
          assert.equal(10, status.retryTimeout)
          break
        case 2:
          assert.equal(true, status.retry)
          assert.equal(20, status.retryTimeout)
          break
        case 3:
          assert.equal(true, status.retry)
          assert.equal(40, status.retryTimeout)
          break
        case 4:
          assert.equal(false, status.retry)
          break
      }
    })

    overpassFrontend.get('r910885',
      {
        properties: OverpassFrontend.ALL
      },
      function(err, result, index) {
        assert.fail('This should not return successful results')
      },
      function(err) {
        if (!err || !err.status === 429) {
          assert.fail("Expect 429 status")
        }

        done()
      }
    )
  })
})
