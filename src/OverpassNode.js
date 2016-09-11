var util = require('util')
var OverpassObject = require('./OverpassObject')

util.inherits(OverpassNode, OverpassObject)
function OverpassNode() {
  OverpassObject.call(this);
}

OverpassNode.prototype.GeoJSON = function() {
  return {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [ this.geometry.lon, this.geometry.lat ]
    },
    properties: this.tags
  };
}

OverpassNode.prototype.update_data = function(data, request) {
  if(data.lat) {
    this.geometry = {
      lat: data.lat,
      lon: data.lon
    };

//    this.bounds = L.latLngBounds(
//        L.latLng(data.lat, data.lon),
//        L.latLng(data.lat, data.lon)
//      );
//    this.center = L.latLng(data.lat, data.lon);
  }

  this.constructor.super_.prototype.update_data.call(this, data, request)
}

module.exports = OverpassNode
