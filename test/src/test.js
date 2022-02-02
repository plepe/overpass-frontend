const assert = require('assert')

module.exports = {
  get (overpassFrontend, options, done) {
    let foundSubRequestCount = 0
    const found = []
    const foundMembers = []
    let isDone = false

    function compileListener (subRequest) {
      foundSubRequestCount++
    }

    if (options.options.members) {
      options.options.memberCallback = function (err, result) {
        if (err) { return done(err) }
        foundMembers.push(result.id)

        if (options.expectedMembers.indexOf(result.id) === -1) {
          assert.fail('Unexpected member result ' + result.id)
        }

        if (options.expectedMemberMemberOf) {
          assert.deepEqual(result.memberOf, options.expectedMemberMemberOf[result.id], 'Member.memberOf for ' + result.id + ' is wrong!')
        }

        if ('expectedMemberProperties' in options) {
          assert.equal(result.properties & options.expectedMemberProperties, options.expectedMemberProperties, 'Member should known about sub members')
        }

        assert.equal(isDone, false, 'Called memberCallback after finalCallback')
      }
    }

    const request = overpassFrontend.get(
      options.ids,
      options.options,
      function (err, result) {
        if (err) { return done(err) }
        found.push(result.id)

        if ('expectedProperties' in options) {
          assert.equal(result.properties, options.expectedProperties)
        }
      },
      function (err) {
        isDone = true
        if (err) {
          return done(err)
        }

        if (options.expected) {
          assert.deepEqual(found.sort(), options.expected.sort(), 'Wrong list of objects returned')
        }

        if (options.expectedMembers) {
          assert.deepEqual(foundMembers.sort(), options.expectedMembers.sort(), 'Wrong list of member objects returned')
        }

        if (options.expectedSubRequestCount) {
          assert.equal(foundSubRequestCount, options.expectedSubRequestCount, 'Wrong count of sub requests!')
        }

        request.off('subrequest-compile', compileListener)

        done()
      }
    )

    request.on('subrequest-compile', compileListener)
  },

  bbox (overpassFrontend, options, done) {
    let foundSubRequestCount = 0
    const found = []
    const foundMembers = []
    let isDone = false

    function compileListener (subRequest) {
      foundSubRequestCount++
    }

    if (options.options.members) {
      options.options.memberCallback = function (err, result) {
        if (err) { return done(err) }
        foundMembers.push(result.id)

        if (options.expectedMemberMemberOf) {
          assert.deepEqual(result.memberOf, options.expectedMemberMemberOf[result.id], 'Member.memberOf for ' + result.id + ' is wrong!')
        }

        if ('expectedMemberProperties' in options) {
          assert.equal(result.properties, options.expectedMemberProperties, 'Member should known about sub members')
        }

        assert.equal(isDone, false, 'Called memberCallback after finalCallback')
      }
    }

    const request = overpassFrontend.BBoxQuery(
      options.query,
      options.bbox,
      options.options,
      function (err, result) {
        if (err) { return done(err) }
        found.push(result.id)

        if ('expectedProperties' in options) {
          assert.equal(result.properties, options.expectedProperties)
        }
      },
      function (err) {
        isDone = true
        if (err) {
          return done(err)
        }

        if (options.expected) {
          assert.deepEqual(found.sort(), options.expected.sort(), 'Wrong list of objects returned')
        }

        if (options.expectedMembers) {
          assert.deepEqual(foundMembers.sort(), options.expectedMembers.sort(), 'Wrong list of member objects returned')
        }

        if (options.expectedSubRequestCount) {
          assert.equal(foundSubRequestCount, options.expectedSubRequestCount, 'Wrong count of sub requests!')
        }

        request.off('subrequest-compile', compileListener)

        done()
      }
    )

    request.on('subrequest-compile', compileListener)
  }
}
