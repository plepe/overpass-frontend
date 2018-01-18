const Request = require('./Request')
const defines = require('./defines')
const SortedCallbacks = require('./SortedCallbacks')
const BoundingBox = require('boundingbox')

/**
 * A get request (request list of map features by id)
 * @extends Request
 */
class RequestGet extends Request {
  /**
   * @param {OverpassFrontend} overpass
   * @param {data} data
   */
  constructor (overpass, data) {
    super(overpass, data)
    this.type = 'get'

    if (typeof this.ids === 'string') {
      this.ids = [ this.ids ]
    } else {
      this.ids = this.ids.concat()
    }

    if (this.options === null) {
      this.options = {}
    }
    if (typeof this.options.properties === 'undefined') {
      this.options.properties = defines.DEFAULT
    }

    for (var i = 0; i < this.ids.length; i++) {
      if (this.ids[i] in this.overpass.overpassElements && this.overpass.overpassElements[this.ids[i]] === false) {
        delete this.overpass.overpassElements[this.ids[i]]
      }
    }

    if (this.options.bbox) {
      this.options.bbox = new BoundingBox(this.options.bbox)
    }
    // option 'split' not available for get requests -> use effort instead
    delete this.options.split

    var callbacks = new SortedCallbacks(this.options, this.featureCallback, this.finalCallback)
    this.featureCallback = callbacks.next.bind(callbacks)
    this.finalCallback = callbacks.final.bind(callbacks)
  }
}

module.exports = RequestGet
