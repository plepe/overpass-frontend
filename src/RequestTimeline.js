const Request = require('./Request')

/**
 * A BBox request
 * @extends Request
 */
class RequestTimeline extends Request {
  /**
   * @param {OverpassFrontend} overpass
   * @param {object} options
   */
  constructor (overpass, data) {
    super(overpass, data)
    this.type = 'Timeline'

    if (typeof this.ids === 'string') {
      this.ids = [this.ids]
    } else {
      this.ids = this.ids.concat()
    }

    this.result = []
    this.loadFinish = false
  }

  /**
   * check if there are any map features which can be returned right now
   */
  preprocess () {
    this.allFound = true

    this.ids.forEach((id, i) => {
      if (id === null) {
        return
      }

      const metaOb = this.overpass.cache.getMeta(id)
      if (!metaOb) {
        this.allFound = false
        return
      }

      const timeline = metaOb.getTimeline()
      if (timeline || timeline === false) {
        const result = { id, timeline }

        this.featureCallback(null, result, i)
        this.ids[i] = null
        return
      }

      this.allFound = false
    })
  }

  /**
   * shall this Request be included in the current call?
   * @param {OverpassFrontend#Context} context - Current context
   * @return {boolean|int[]} - yes|no - or [ minEffort, maxEffort ]
   */
  willInclude (context) {
    if (!super.willInclude(context)) {
      return false
    }

    return true
  }

  /**
   * how much effort can a call to this request use
   * @return {Request#minMaxEffortResult} - minimum and maximum effort
   */
  minMaxEffort () {
    return { minEffort: 0, maxEffort: 0 }
  }

  /**
   * compile the query
   * @param {OverpassFrontend#Context} context - Current context
   * @return {Request#SubRequest|false} - the compiled query or false if the bbox does not match
   */
  _compileQuery (context) {
    const query = this.ids.map(id => {
      if (id) {
        return 'timeline("' + { n: 'node', w: 'way', r: 'relation' }[id[0]] + '", ' + id.substr(1) + ');\n'
      } else {
        return ''
      }
    }).join('') + 'out;\n'

    const subRequest = {
      query,
      request: this,
      parts: [
        {
          receiveObject: this.receiveObject.bind(this)
        }
      ],
      effort: 0
    }

    return subRequest
  }

  /**
   * receive an object from OverpassFronted -> enter to cache, return to caller
   * @param {OverpassObject} ob - Object which has been received
   * @param {Request#SubRequest} subRequest - sub request which is being handled right now
   * @param {int} partIndex - Which part of the subRequest is being received
   */
  receiveObject (ob) {
  }

  /**
   * the current subrequest is finished -> update caches, check whether request is finished
   * @param {Request#SubRequest} subRequest - the current sub request
   */
  finishSubRequest (subRequest) {
    this.preprocess()

    this.ids.forEach(id => {
      this.overpass.createOrGetMetaObject(id).addMissingObject()
    })

    super.finishSubRequest(subRequest)
  }

  /**
   * check if we need to call Overpass API. Maybe whole area is cached anyway?
   * @return {boolean} - true, if we need to call Overpass API
   */
  needLoad () {
    return !this.allFound
  }

  mayFinish () {
    return this.allFound
  }
}

module.exports = RequestTimeline
