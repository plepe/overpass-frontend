var util = require('util')
var OverpassObject = require('./OverpassObject')
var BoundingBox = require('boundingbox')

// so that the linter does not complain
if (typeof L === 'undefined') {
  var L
}

util.inherits(OverpassNode, OverpassObject)
function OverpassNode () {
  OverpassObject.call(this)
}

OverpassNode.prototype.GeoJSON = function () {
  return {
    type: 'Feature',
    id: this.type + '/' + this.osm_id,
    geometry: {
      type: 'Point',
      coordinates: [ this.geometry.lon, this.geometry.lat ]
    },
    properties: this.GeoJSONProperties()
  }
}

OverpassNode.prototype.updateData = function (data, request) {
  if (data.lat) {
    this.geometry = {
      lat: data.lat,
      lon: data.lon
    }

    this.bounds = new BoundingBox(data)
    this.center = this.bounds.getCenter()
  }

  this.constructor.super_.prototype.updateData.call(this, data, request)
}

OverpassNode.prototype.leafletFeature = function (options) {
  switch ('nodeType' in options ? options.nodeType : null) {
    case 'Marker':
      return L.marker(this.geometry, options)
    case 'Circle':
      return L.circle(this.geometry, options.radius, options)
    case 'CircleMarker':
    default:
      return L.circleMarker(this.geometry, options)
  }
}

module.exports = OverpassNode
