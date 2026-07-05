const overpassOutOptions = require('./overpassOutOptions')
const boundsIsFullWorld = require('./boundsIsFullWorld')
const httpLoad = require('./httpLoad')
const Filter = require('./Filter')

module.exports = class DBTypeOverpassAPI {
  constructor (url, geowiki, options) {
    this.type = 'OverpassAPI'
    this.url = url
    this.geowiki = geowiki
    this.options = options
  }

  compile (_query, options) {
    let query
    let resultSet = '.result'

    // if the context already has a bbox and it differs from this, we can't add
    // ours
    if (_query instanceof Filter) {
      query = _query.toQl({ setsUseStatementIds: true }) + '\n'
      options.properties |= _query.properties()
      resultSet = options.statementId ? '._' + options.statementId : '.result'
    } else {
      query = _query.substr(0, this.query.length - 1) + '->.result;\n'
    }

    let queryRemoveDoneFeatures = ''
    let countRemoveDoneFeatures = 0
    for (const id in this.doneFeatures) {
      const ob = this.doneFeatures[id]

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

  mergeQueries (queries) {
    return queries.join('\nout count;\n')
  }

  execute (context, callback) {
    let queryOptions = ''

    queryOptions = '[out:json]'
    if (context.bbox && !boundsIsFullWorld(context.bbox)) {
      queryOptions += '[bbox:' + context.bbox.toLatLonString() + ']'
    }

    const query = queryOptions + ';\n' + context.query

    httpLoad(
      this.url,
      null,
      query,
      callback
    )
  }
}
