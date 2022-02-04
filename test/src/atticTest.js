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
            if (err) { return done(err) }
            found.push(result.id)

            // console.log('At ' + date + ' found:', result.id, 'with ts', result.meta.timestamp)
            assert.equal(result.meta.timestamp, options.expectedTimestamps[result.id][i], 'Node ' + result.id + ' at date ' + date + ' has wrong timestamp')

            if ('expectedProperties' in options) {
              assert.equal(result.properties, options.expectedProperties)
            }
          },
          function (err) {
            if (err) {
              return done(err)
            }

            if (expected) {
              assert.deepEqual(found.sort(), expected.sort(), 'At ' + date + ', wrong list of objects returned')
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
            if (err) { return done(err) }
            found.push(result.id)

            // console.log('At ' + date + ' found:', result.id, 'with ts', result.meta.timestamp)
            assert.equal(result.meta.timestamp, options.expectedTimestamps[result.id][i], 'Node ' + result.id + ' at date ' + date + ' has wrong timestamp')
          },
          function (err) {
            if (err) {
              return done(err)
            }

            assert.deepEqual(found.sort(), expected.sort(), 'At ' + date + ', wrong list of objects returned')

            done()
          })
      }, callback
    )
  }
}
