const httpLoad = require('./httpLoad')
const boundsIsFullWorld = require('./boundsIsFullWorld')
const DBTypeBase = require('./DBTypeBase')

module.exports = class DBTypeOverpassAPI extends DBTypeBase {
  execute (context, callback) {
    let queryOptions = ''

    queryOptions = '[out:json]'
    if (context.bbox && !boundsIsFullWorld(context.bbox)) {
      queryOptions += '[bbox:' + context.bbox.toLatLonString() + ']'
    }

    const query = queryOptions + ';\n' +
      context.subRequests.map(c => c.query).join('\nout count;\n')

    httpLoad(
      this.url,
      null,
      query,
      callback
    )
  }
}
