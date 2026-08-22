const Request = require('./Request')
const Filter = require('./Filter')
const async = require('async')
const RequestBBox = require('./RequestBBox')
const BoundingBox = require('boundingbox')

/**
 * A query request
 * @extends Request
 */
module.exports = class RequestQuery extends Request {
  /**
   * @param {GeowikiAPI} overpass
   * @param {string} query
   * @param {object} [options]
   * @parma {function} callback
   */
  constructor (overpass, query, options, callback) {
    if (typeof options === 'function') {
      callback = options
      options = {}
    }

    options.query = query
    options.finalCallback = callback
    if (options.featureCallback) {
      const fcb = options.featureCallback
      // err is always `null`, because it will call the finalCallback instead
      options.featureCallback = (err, ob) => fcb(ob) // eslint-disable-line
    } else {
      options.featureCallback = () => {}
    }

    if (!options.options) {
      options.options = {}
    }

    if (options.query.match(/^s*\[/)) { // query starts with [ - indication for query options
      options.query = parseQueryOptions(options.query, options)
    }

    super(overpass, options)
    this.type = 'query'
    this.options = { ...this.options, ...options }

    if (this.options.bbox) {
      const keys = ['minlat', 'minlon', 'maxlat', 'maxlon']
      const values = this.options.bbox.split(',').map(v => parseFloat(v))
      this.options.bbox = Object.fromEntries(keys.map((key, i) => [key, values[i]]))
    }

    this.filter = new Filter(options.query)
    this.outStatements = this.filter.script.filter(stmt => stmt.constructor.name === 'OutStatement')

    this.requests = []
    this.elements = []

    this.inputSets = {}
    this.outStatements.forEach((stmt, index) => {
      const inputSet = stmt.inputSet

      if (!(inputSet.id in this.inputSets)) {
        this.inputSets[inputSet.id] = {
          statements: [],
          properties: 0,
          features: []
        }
      }

      this.inputSets[inputSet.id].statements.push(stmt)
      this.inputSets[inputSet.id].properties |= stmt.properties()
    })

    if (this.options.bbox) {
      this.output.setBounds(this.options.bbox)
    }

    async.each(this.inputSets, (inputSet, done) => {
      const stmt = inputSet.statements[0]
      const queryOptions = { ...this.options }
      queryOptions.properties = inputSet.properties

      const data = {
        query: stmt.fullQuery(),
        bounds: new BoundingBox(queryOptions.bbox),
        options: queryOptions,
        featureCallback: (err, ob) => {
          inputSet.features.push(ob)
          this.featureCallback(err, ob)
        },
        finalCallback: (err) => {
          if (err) {
            this.abort()
            return this.finish(err)
          }

          this.requests.splice(this.requests.indexOf(request), 1)

          if (!this.requests.length) {
            this.buildResult()
            this.finish()
          }
        },
        doneFeatures: {}
      }

      const counts = inputSet.statements.map(stmt => stmt.count())
      if (!counts.includes(null)) {
        data.limit = Math.max(...counts)
      }

      const request = new RequestBBox(this.overpass, data)
      request.on('subrequest-compile', subRequest => this.emit('subrequest-compile', subRequest))
      this.requests.push(request)
      this.overpass.requests.push(request)
      done()
    }, (err) => {
      if (err) {
        this.abort()
        this.finish(err)
        return
      }

      if (!this.requests.length) {
        this.finish()
      }

      this.overpass._next()
    })
  }

  /**
   * abort this request and sub requests
   */
  abort () {
    this.requests.forEach(req => req.abort())
    super.abort()
  }

  willInclude () {
    return false
  }

  preprocess () {
  }

  mayFinish () {
    return !this.requests.length
  }

  buildResult () {
    this.outStatements.forEach(stmt => {
      const inputSet = this.inputSets[stmt.inputSet.id]
      const outOptions = stmt.outOptions()
      const count = stmt.count()

      let features = inputSet.features
      if (count) {
        features = features.slice(0, count)
      }

      if (outOptions.count) {
        this.output.pushCount(countElements(features))
      } else {
        features.map(ob => this.output.pushFeature(ob, outOptions))
      }
    })
  }
}

function parseQueryOptions (query, options) {
  const m = query.match(/^\s*\[([a-z]+):([^\]]+)\]\s*;?/)

  if (m) {
    query = query.substr(m[0].length)
    options.options[m[1].trim()] = m[2].trim()

    query = parseQueryOptions(query, options)
  }

  return query
}

function countElements (elements) {
  return {
    nodes: elements.filter(el => el.type === 'node').length.toString(),
    ways: elements.filter(el => el.type === 'way').length.toString(),
    relations: elements.filter(el => el.type === 'relation').length.toString(),
    total: elements.length.toString()
  }
}
