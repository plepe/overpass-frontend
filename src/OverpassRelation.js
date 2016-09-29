var util = require('util')
var OverpassObject = require('./OverpassObject')

// so that the linter does not complain
if (typeof L === 'undefined') {
  var L
}

util.inherits(OverpassRelation, OverpassObject)
function OverpassRelation () {
  OverpassObject.call(this)
}

OverpassRelation.prototype.updateData = function (data, request) {
  this.constructor.super_.prototype.updateData.call(this, data, request)
}

OverpassRelation.prototype.member_ids = function () {
  if (this._member_ids) {
    return this._member_ids
  }

  if (typeof this.data.members === 'undefined') {
    return null
  }

  this._member_ids = []
  for (var i = 0; i < this.data.members.length; i++) {
    var member = this.data.members[i]

    this._member_ids.push(member.type.substr(0, 1) + member.ref)
  }

  return this._member_ids
}

OverpassRelation.prototype.leafletFeature = function (options) {
  if (!this.data.members) {
    return null
  }

  var features = []

  for (var i = 0; i < this.data.members.length; i++) {
    var member = this.data.members[i]
    var feature

    switch (member.type) {
      case 'node':
        switch (options.nodeType) {
          case 'Marker':
            feature = L.marker(member, options)
            break
          case 'Circle':
            feature = L.circle(member, options.radius, options)
            break
          case 'CircleMarker':
          default:
            feature = L.circleMarker(member, options)
        }

        features.push(feature)
        break

      case 'way':
        if (member.geometry[member.geometry.length - 1].lat === member.geometry[0].lat &&
           member.geometry[member.geometry.length - 1].lon === member.geometry[0].lon) {
          feature = L.polygon(member.geometry, options)
        } else {
          feature = L.polyline(member.geometry, options)
        }

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
