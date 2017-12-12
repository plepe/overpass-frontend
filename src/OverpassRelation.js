/* global L:false */

var util = require('util')
var osmtogeojson = require('osmtogeojson')
var OverpassObject = require('./OverpassObject')
var OverpassFrontend = require('./defines')
var turf = {
  bboxClip: require('turf-bbox-clip')
}

util.inherits(OverpassRelation, OverpassObject)
function OverpassRelation () {
  OverpassObject.call(this)
}

OverpassRelation.prototype.updateData = function (data, request) {
  var i

  if ((request.options.properties & OverpassFrontend.MEMBERS) &&
      data.members) {
    this.members = []

    for (i = 0; i < data.members.length; i++) {
      var member = data.members[i]

      this.members.push(member)
      this.members[i].id = member.type.substr(0, 1) + member.ref
    }
  }

  if ((request.options.properties & OverpassFrontend.MEMBERS) &&
      (request.options.properties & OverpassFrontend.GEOM) &&
      data.members) {
    this.geometry = osmtogeojson({ elements: [ data ] })
  }

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

  var feature = L.geoJSON(this.geometry, {
    pointToLayer: function (options, geoJsonPoint, member) {
      switch (options.nodeFeature) {
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

      return feature
    }.bind(this, options)
  })

  feature.setStyle(options)

  return feature
}

OverpassRelation.prototype.GeoJSON = function () {
  var ret = {
    type: 'Feature',
    id: this.type + '/' + this.osm_id,
    properties: this.GeoJSONProperties()
  }

  if (this.geometry && this.geometry.features && this.geometry.features.length) {
    if (this.geometry.features.length === 1) {
      ret.geometry = this.geometry.features[0].geometry
    } else {
      ret.geometry = {
        type: 'GeometryCollection',
        geometries: []
      }

      this.geometry.features.forEach(function (x) {
        ret.geometry.geometries.push(x.geometry)
      })
    }
  }

  return ret
}

OverpassRelation.prototype.intersects = function (bbox) {
  var i

  if (this.bounds) {
    if (!bbox.intersects(this.bounds)) {
      return 0
    }
  }

  if (this.geometry) {
    for (i = 0; i < this.geometry.features.length; i++) {
      var g = this.geometry.features[i]

      var intersects = turf.bboxClip(g, [ bbox.minlon, bbox.minlat, bbox.maxlon, bbox.maxlat ])

      if (g.geometry.type === 'Point') {
        if (intersects) {
          return 2
        }
      }
      if (g.geometry.type === 'LineString' || g.geometry.type === 'Polygon') {
        if (intersects.geometry.coordinates.length) {
          return 2
        }
      }
      if (g.geometry.type === 'MultiPolygon') {
        for (var j = 0; j < intersects.geometry.coordinates.length; j++) {
          if (intersects.geometry.coordinates[j].length) {
            return 2
          }
        }
      }
    }

    // if there's a relation member (where Overpass does not return the
    // geometry) we can't know if the geometry intersects -> return 1
    for (i = 0; i < this.data.members.length; i++) {
      if (this.data.members[i].type === 'relation') {
        return 1
      }
    }

    // if there's no relation member we can be sure there's no intersection
    return 0
  }

  return this.constructor.super_.prototype.intersects.call(this, bbox)
}

module.exports = OverpassRelation
