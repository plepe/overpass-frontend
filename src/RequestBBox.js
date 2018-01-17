const Request = require('./Request')

class RequestBBox extends Request {
  constructor (overpass, data) {
    super(overpass, data)
    this.type = 'BBoxQuery'
  }
}

module.exports = RequestBBox
