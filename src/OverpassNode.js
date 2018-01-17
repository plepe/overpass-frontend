/* global L:false */

var util = require('util')
var OverpassObject = require('./OverpassObject')
var BoundingBox = require('boundingbox')

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

OverpassNode.prototype.updateData = function (data, options) {
  if (data.lat) {
    this.geometry = {
      lat: data.lat,
      lon: data.lon
    }

    this.bounds = new BoundingBox(data)
    this.center = this.bounds.getCenter()
  }

  this.constructor.super_.prototype.updateData.call(this, data, options)
}

OverpassNode.prototype.leafletFeature = function (options) {
  switch ('nodeFeature' in options ? options.nodeFeature : null) {
    case 'Marker':
      return L.marker(this.geometry, options)
    case 'Circle':
      return L.circle(this.geometry, options.radius, options)
    case 'CircleMarker':
    default:
      return L.circleMarker(this.geometry, options)
  }
}

OverpassNode.prototype.intersects = function (bbox) {
  if (!this.bounds) {
    return 1
  }

  return bbox.intersects(this.bounds) ? 2 : 0
}

module.exports = OverpassNode
