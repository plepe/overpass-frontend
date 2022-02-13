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
          { date, properties: 63 },
          function (err, result, index) {
            if (err) { return done(err) }

            if (!result) {
              // console.log('At ' + date + ', query for ' + options.ids[index] + ' returned', result)
              return
            }

            found.push(result.id)

            const memberVersions = result.memberObjects().map(m => m.ob ? m.ob.meta.version : '').join(',')
            // console.log('At ' + date + ' found:', result.id, 'with ts', result.meta.timestamp, 'and geo-ts', result.meta.geometryTimestamp, '; memberVersions: ' + memberVersions )

            assert.equal(result.meta.geometryTimestamp, options.expectedTimestamps[result.id][i], result.id + ' at date ' + date + ' has wrong timestamp')

            if (options.expectedMemberVersions) {
              assert.equal(memberVersions, options.expectedMemberVersions[result.id][i], result.id + ' at date ' + date + ' has wrong member versions')
            }

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
          { date, properties: 63 },
          function (err, result) {
            if (err) { return done(err) }
            found.push(result.id)

            if (!(result.id in options.expectedTimestamps)) {
              return
            }

            const memberVersions = result.memberObjects().map(m => m.ob ? m.ob.meta.version : '').join(',')
            // console.log('At ' + date + ' found:', result.id, 'with ts', result.meta.timestamp, 'and geo-ts', result.meta.geometryTimestamp, '; memberVersions: ' + memberVersions )

            assert.equal(result.meta.geometryTimestamp, options.expectedTimestamps[result.id][i], result.id + ' at date ' + date + ' has wrong timestamp')

            if (options.expectedMemberVersions) {
              assert.equal(memberVersions, options.expectedMemberVersions[result.id][i], result.id + ' at date ' + date + ' has wrong member versions')
            }

            if ('expectedProperties' in options) {
              assert.equal(result.properties, options.expectedProperties)
            }
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
