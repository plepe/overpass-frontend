/* global L:false */

var util = require('util')
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
  var member

  if ((request.options.properties & OverpassFrontend.MEMBERS) &&
      data.members) {
    this.members = []

    for (i = 0; i < data.members.length; i++) {
      member = data.members[i]

      this.members.push(data.members[i])
      this.members[i].id = data.members[i].type.substr(0, 1) + data.members[i].ref
    }
  }

  if ((request.options.properties & OverpassFrontend.MEMBERS) &&
      (request.options.properties & OverpassFrontend.GEOM) &&
      data.members) {
    this.geometry = []

    for (i = 0; i < data.members.length; i++) {
      member = data.members[i]

      switch (member.type) {
        case 'node':
          this.geometry.push({
            lat: member.lat,
            lon: member.lon
          })
          break
        case 'way':
          this.geometry.push(member.geometry)
          break
        case 'relation':
          break
      }
    }
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

  var features = []

  for (var i = 0; i < this.data.members.length; i++) {
    var member = this.data.members[i]
    var feature

    switch (member.type) {
      case 'node':
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

OverpassRelation.prototype.GeoJSON = function () {
  var geometries = []
  for (var i = 0; i < this.geometry.length; i++) {
    var geometry = this.geometry[i]

    if ('length' in geometry) {
      geometries.push({
        type: 'LineString',
        coordinates: geometry.map(function (item) {
          return [ item.lon, item.lat ]
        })
      })
    } else {
      geometries.push({
        type: 'Point',
        coordinates: [ geometry.lon, geometry.lat ]
      })
    }
  }

  return {
    type: 'Feature',
    id: this.type + '/' + this.osm_id,
    geometry: {
      type: 'GeometryCollection',
      geometries: geometries
    },
    properties: this.GeoJSONProperties()
  }
}

OverpassRelation.prototype.intersects = function (bbox) {
  var i

  if (this.geometry) {
    var geojson = this.GeoJSON()

    for (i = 0; i < geojson.geometry.geometries.length; i++) {
      var g = {
        type: 'Feature',
        geometry: geojson.geometry.geometries[i]
      }

      var intersects = turf.bboxClip(g, [ bbox.bounds.minlon, bbox.bounds.minlat, bbox.bounds.maxlon, bbox.bounds.maxlat ])

      if (g.geometry.type === 'Point') {
        if (intersects) {
          return 2
        }
      }
      if (g.geometry.type === 'LineString') {
        if (intersects.geometry.coordinates.length) {
          return 2
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
