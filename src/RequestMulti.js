const Request = require('./Request')

/**
 * A request consisting of several requests - duplicate results will be filtered
 * @extends Request
 */
class RequestMulti extends Request {
  constructor (overpass, options, requests) {
    super(overpass, options)
    this.type = 'RequestMulti'

    this.doneFeatures = {}
    this.requests = requests

    this.requests.forEach(req => {
      req.on('finish', () => {
        this.requests.splice(this.requests.indexOf(req), 1)
      })

      req.featureCallback = (err, ob) => {
        if (!(ob.id in this.doneFeatures)) {
          this.doneFeatures[ob.id] = true
          this.featureCallback(err, ob)
        }
      }
      req.finalCallback = () => {}

      this.overpass.requests.push(req)
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
}

module.exports = RequestMulti
