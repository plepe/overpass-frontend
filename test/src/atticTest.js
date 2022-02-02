const assert = require('assert')
const async = require('async')

module.exports = {
  get (overpassFrontend, options, callback) {
    async.eachOf(options.timestamps,
      (date, i, done) => {
        const found = []
        const expected = Object.keys(options.expectedTimestamps).filter(e => options.expectedTimestamps[e][i])

        overpassFrontend.get(
          options.ids,
          { date },
          function (err, result) {
            found.push(result.id)

            //console.log('At ' + date + ' found:', result.id, 'with ts', result.meta.timestamp)
            assert.equal(result.meta.timestamp, options.expectedTimestamps[result.id][i], 'Node ' + result.id + ' at date ' + date + ' has wrong timestamp')

            if (expected.indexOf(result.id) === -1) {
              error += 'Unexpected result ' + result.id + '\n'
            }
          },
          function (err) {
            if (err) {
              return done(err)
            }

            if (found.length !== expected.length) {
              return done('At date ' + date + ', wrong count of objects returned:\n' +
               'Expected: ' + expected.join(', ') + '\n' +
               'Found: ' + found.join(', '))
            }

            done()
          })
        }, callback
      )
  },

  bbox (overpassFrontend, options, callback) {
    async.eachOf(options.timestamps,
      (date, i, done) => {
        const found = []
        const expected = Object.keys(options.expectedTimestamps).filter(e => options.expectedTimestamps[e][i])

        overpassFrontend.BBoxQuery(
          options.query,
          options.bbox,
          { date },
          function (err, result) {
            found.push(result.id)

            //console.log('At ' + date + ' found:', result.id, 'with ts', result.meta.timestamp)
            assert.equal(result.meta.timestamp, options.expectedTimestamps[result.id][i], 'Node ' + result.id + ' at date ' + date + ' has wrong timestamp')

            if (expected.indexOf(result.id) === -1) {
              error += 'Unexpected result ' + result.id + '\n'
            }
          },
          function (err) {
            if (err) {
              return done(err)
            }

            if (found.length !== expected.length) {
              return done('At date ' + date + ', wrong count of objects returned:\n' +
               'Expected: ' + expected.join(', ') + '\n' +
               'Found: ' + found.join(', '))
            }

            done()
          })
        }, callback
      )
  }
}
