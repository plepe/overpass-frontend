var util = require('util')
var OverpassObject = require('./OverpassObject')

util.inherits(OverpassRelation, OverpassObject)
function OverpassRelation() {
  OverpassObject.call(this);
}

OverpassRelation.prototype.update_data = function(data, request) {
  this.constructor.super_.prototype.update_data.call(this, data, request)
}

OverpassRelation.prototype.member_ids = function() {
  if(this._member_ids)
    return this._member_ids;

  if(typeof this.data.members == 'undefined')
    return null

  this._member_ids = [];
  for(var i = 0; i < this.data.members.length; i++) {
    var member = this.data.members[i];

    this._member_ids.push(member.type.substr(0, 1) + member.ref);
  }

  return this._member_ids;
}

OverpassRelation.prototype.leafletFeature = function(options) {
  if(!this.data.members)
    return null

  var features = []

  for(var i = 0; i < this.data.members.length; i++) {
    var member = this.data.members[i]

    switch(member.type) {
      case 'node':
        switch(options.nodeType) {
          case 'Marker':
            var feature = L.marker(member, options)
            break
          case 'Circle':
            var feature = L.circle(member, options.radius, options)
            break
          case 'CircleMarker':
          default:
            var feature = L.circleMarker(member, options)
        }

        features.push(feature)
        break

      case 'way':
        if(member.geometry[member.geometry.length - 1].lat == member.geometry[0].lat &&
           member.geometry[member.geometry.length - 1].lon == member.geometry[0].lon)
          var feature = L.polygon(member.geometry, options)
        else
          var feature = L.polyline(member.geometry, options)

        features.push(feature)
        break

      case 'relation':
      default:
        break
    }
  }

  return L.featureGroup(features)
}

module.exports = OverpassRelation
