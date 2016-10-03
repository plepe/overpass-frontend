/* global L:false */

var util = require('util')
var OverpassObject = require('./OverpassObject')

util.inherits(OverpassWay, OverpassObject)
function OverpassWay () {
  OverpassObject.call(this)
}

OverpassWay.prototype.updateData = function (data, request) {
  if (data.nodes) {
    this.nodes = data.nodes
  }

  if (data.geometry) {
    this.geometry = data.geometry
  }

  this.constructor.super_.prototype.updateData.call(this, data, request)
}

OverpassWay.prototype.member_ids = function () {
  if (this._member_ids) {
    return this._member_ids
  }

  if (!this.nodes) {
    return null
  }

  this._member_ids = []
  for (var i = 0; i < this.nodes.length; i++) {
    var member = this.nodes[i]

    this._member_ids.push('n' + member)
  }

  return this._member_ids
}

OverpassWay.prototype.GeoJSON = function () {
  var coordinates = []
  for (var i = 0; i < this.geometry.length; i++) {
    coordinates.push([ this.geometry[i].lon, this.geometry[i].lat ])
  }

  return {
    type: 'Feature',
    id: this.type + '/' + this.osm_id,
    geometry: {
      type: 'LineString',
      coordinates: coordinates
    },
    properties: this.GeoJSONProperties()
  }
}

OverpassWay.prototype.leafletFeature = function (options) {
  if (!this.geometry) {
    return null
  }

  if (this.geometry[this.geometry.length - 1].lat === this.geometry[0].lat &&
     this.geometry[this.geometry.length - 1].lon === this.geometry[0].lon) {
    return L.polygon(this.geometry, options)
  }

  return L.polyline(this.geometry, options)
}

module.exports = OverpassWay
