const Request = require('./Request')
const overpassOutOptions = require('./overpassOutOptions')
const turf = require('./turf')

class RequestBBox extends Request {
  constructor (overpass, data) {
    super(overpass, data)
    this.type = 'BBoxQuery'
  }

  compileQuery () {
    // var BBoxString = this.remainingBounds.toLatLonString()
    // TODO: turf union/difference is broken - use full bounds instead
    var BBoxString = this.bounds.toLatLonString()
    var queryOptions = '[bbox:' + BBoxString + ']'

    var query = '[out:json]' + queryOptions + ';\n(' + this.query + ')->.result;\n'

    var queryRemoveDoneFeatures = ''
    var countRemoveDoneFeatures = 0
    for (var id in this.doneFeatures) {
      var ob = this.doneFeatures[id]

      if (countRemoveDoneFeatures % 1000 === 999) {
        query += '(' + queryRemoveDoneFeatures + ')->.done;\n'
        queryRemoveDoneFeatures = '.done;'
      }

      queryRemoveDoneFeatures += ob.type + '(' + ob.osm_id + ');'
      countRemoveDoneFeatures++
    }

    if (countRemoveDoneFeatures) {
      query += '(' + queryRemoveDoneFeatures + ')->.done;\n'
      query += '(.result; - .done);\n'
    }

    query += 'out ' + overpassOutOptions(this.options) + ';'

    return {
      query,
      parts: [
        {
          properties: this.options.properties
        }
      ]
    }
  }

  isDone () {
    // check if we need to call Overpass API (whole area known?)
    var remainingBounds = this.bounds
    if (this.overpass.overpassBBoxQueryRequested[this.query] !== null) {
      var toRequest = this.bounds.toGeoJSON()
      remainingBounds = turf.difference(toRequest, this.overpass.overpassBBoxQueryRequested[this.query])

      return remainingBounds === undefined
    }

    return false
  }
}

module.exports = RequestBBox
