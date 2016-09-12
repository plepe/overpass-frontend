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

module.exports = OverpassNode
