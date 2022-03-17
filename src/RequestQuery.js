const Request = require('./Request')
const defines = require('./defines')

class RequestQuery extends Request {
  /**
   * @param {OverpassFrontend} overpass
   * @param {data} data
   */
  constructor (overpass, data) {
    super(overpass, data)
    this.type = 'query'
  }
}

module.exports = RequestQuery
