const Request = require('./Request')
const OverpassQL = require('./OverpassQL')
const defines = require('./defines')

class RequestQuery extends Request {
  /**
   * @param {OverpassFrontend} overpass
   * @param {data} data
   */
  constructor (overpass, data) {
    super(overpass, data)
    this.type = 'query'

    this.script = OverpassQL.parse(this.query)
  }
}

module.exports = RequestQuery
