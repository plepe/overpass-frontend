const Request = require('./Request')

class RequestGet extends Request {
  constructor (overpass, data) {
    super(overpass, data)
    this.type = 'get'
  }
}

module.exports = RequestGet
