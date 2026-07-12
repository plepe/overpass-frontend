const httpLoad = require('./httpLoad')
const boundsIsFullWorld = require('./boundsIsFullWorld')
const overpassOutOptions = require('./overpassOutOptions')
const Filter = require('./Filter')
const DBTypeBase = require('./DBTypeBase')

module.exports = class DBTypeOverpassAPI extends DBTypeBase {
  compile (_query, options) {
    let query;
    let resultSet = '.result'

    // if the context already has a bbox and it differs from this, we can't add
    // ours
    if (_query instanceof Filter) {
      query = _query.toQl({ setsUseStatementIds: true }) + '\n'
      options.properties |= _query.properties()
      resultSet = options.statementId ? '._' + options.statementId : '.result'
    } else {
      query = _query.substr(0, _query.length - 1) + '->.result;\n'
    }

    let queryRemoveDoneFeatures = ''
    let countRemoveDoneFeatures = 0
    for (const id in options.doneFeatures) {
      const ob = options.doneFeatures[id]

      if (countRemoveDoneFeatures % 1000 === 999) {
        query += '(' + queryRemoveDoneFeatures + ')->.done;\n'
        queryRemoveDoneFeatures = '.done;'
      }

      queryRemoveDoneFeatures += ob.type + '(' + ob.osm_id + ');'
      countRemoveDoneFeatures++
    }

    if (countRemoveDoneFeatures) {
      query += '(' + queryRemoveDoneFeatures + ')->.done;\n'
      query += '(' + resultSet + '; - .done;)->' + resultSet + ';\n'
    }

    query += resultSet + ' out ' + overpassOutOptions(options) + ';\n'

    return query
  }

  execute (context, callback) {
    let queryOptions = ''

    queryOptions = '[out:json]'
    if (context.bbox && !boundsIsFullWorld(context.bbox)) {
      queryOptions += '[bbox:' + context.bbox.toLatLonString() + ']'
    }

    const query = queryOptions + ';\n' +
      context.subRequests.map(c => c.query.join('\nout count;\n')).join('\nout count;\n')

    httpLoad(
      this.url,
      null,
      query,
      callback
    )
  }
}
