var util = require('util')
var OverpassObject = require('./OverpassObject')
var BoundingBox = require('boundingbox')

util.inherits(OverpassNode, OverpassObject)
function OverpassNode() {
  OverpassObject.call(this);
}

OverpassNode.prototype.GeoJSON = function() {
  return {
    type: 'Feature',
    id: this.type + '/' + this.osm_id,
    geometry: {
      type: 'Point',
      coordinates: [ this.geometry.lon, this.geometry.lat ]
    },
    properties: this.GeoJSONProperties()
  };
}

OverpassNode.prototype.update_data = function(data, request) {
  if(data.lat) {
    this.geometry = {
      lat: data.lat,
      lon: data.lon
    };

    this.bounds = new BoundingBox(data)
    this.center = this.bounds.getCenter()
  }

  this.constructor.super_.prototype.update_data.call(this, data, request)
}

OverpassNode.prototype.leafletFeature = function(options) {
  switch(options.nodeType) {
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
