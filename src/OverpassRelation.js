/* global L:false */

var osmtogeojson = require('osmtogeojson')
var OverpassObject = require('./OverpassObject')
var OverpassFrontend = require('./defines')
var turf = {
  bboxClip: require('@turf/bbox-clip').default
}

class OverpassRelation extends OverpassObject {
  updateData (data, options) {
    var i

    if ((options.properties & OverpassFrontend.MEMBERS) &&
        data.members) {
      this.members = []

      for (i = 0; i < data.members.length; i++) {
        var member = data.members[i]

        this.members.push(member)
        this.members[i].id = member.type.substr(0, 1) + member.ref
      }
    }

    if (options.properties & OverpassFrontend.MEMBERS) {
      this.memberFeatures = data.members.map(
        (member, sequence) => {
          let ob = JSON.parse(JSON.stringify(member))
          ob.id = ob.ref
          delete ob.ref
          delete ob.role

          let memberOb = this.overpass.createOrUpdateOSMObject(ob, {
            properties: options.properties & OverpassFrontend.GEOM
          })

          memberOb.notifyMemberOf(this, member.role, sequence)

          return memberOb
        }
      )
    }

    if ((options.properties & OverpassFrontend.MEMBERS) &&
        (options.properties & OverpassFrontend.GEOM) &&
        data.members) {
      this.geometry = osmtogeojson({ elements: [ data ] })
    }

    super.updateData(data, options)
  }

  memberIds () {
    if (this._memberIds) {
      return this._memberIds
    }

    if (typeof this.data.members === 'undefined') {
      return null
    }

    this._memberIds = []
    for (var i = 0; i < this.data.members.length; i++) {
      var member = this.data.members[i]

      this._memberIds.push(member.type.substr(0, 1) + member.ref)
    }

    return this._memberIds
  }

  member_ids () { // eslint-disable-line
    console.log('called deprecated OverpassRelation.member_ids() function - replace by memberIds()')
    return this.memberIds()
  }

  leafletFeature (options) {
    if (!this.data.members) {
      return null
    }

    // no geometry? use the member features instead
    if (!this.geometry) {
      let feature = L.featureGroup()
      feature._updateCallbacks = []

      // create an event handler on the 'update' event, so that member features
      // get added to the featureGroup when they are loaded
      this.memberFeatures.forEach(
        (member, index) => {
          if (member) {
            let memberFeature = member.leafletFeature(options)
            if (memberFeature) {
              memberFeature.setStyle(options)
              memberFeature.addTo(feature)
            } else {
              let updFun = member => {
                let memberFeature = member.leafletFeature(options)
                if (memberFeature) {
                  memberFeature.setStyle(options)
                  memberFeature.addTo(feature)
                  member.off('update', updFun)
                }
              }

              member.on('update', updFun)
              feature._updateCallbacks[index] = updFun
            }
          }
        }
      )

      // when the feature gets removed from the map, remove all event handlers
      feature.on('remove', () => {
        this.memberFeatures.forEach(
          (member, index) => {
            if (member) {
              let updFun = feature._updateCallbacks[index]
              if (updFun) {
                member.off('update', updFun)
              }
            }
          }
        )
      })

      return feature
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

  GeoJSON () {
    var ret = {
      type: 'Feature',
      id: this.type + '/' + this.osm_id,
      properties: this.GeoJSONProperties()
    }

    if (this.members) {
      ret.geometry = {
        type: 'GeometryCollection',
        geometries: this.memberFeatures.map(member => {
          let geojson = member.GeoJSON()
          if ('geometry' in geojson) {
            return geojson.geometry
          }
        })
      }
    }

    return ret
  }

  intersects (bbox) {
    var i

    if (this.bounds) {
      if (!bbox.intersects(this.bounds)) {
        return 0
      }
    }

    if (this.geometry) {
      for (i = 0; i < this.geometry.features.length; i++) {
        var g = this.geometry.features[i]

        if (g.geometry.type === 'Point') {
          if (bbox.intersects(g)) {
            return 2
          }
          continue
        }

        var intersects = turf.bboxClip(g, [ bbox.minlon, bbox.minlat, bbox.maxlon, bbox.maxlat ])

        if (g.geometry.type === 'LineString' || g.geometry.type === 'Polygon') {
          if (intersects.geometry.coordinates.length) {
            return 2
          }
        }
        if (g.geometry.type === 'MultiPolygon' || g.geometry.type === 'MultiLineString') {
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
    } else if (this.members) {
      for (i in this.members) {
        let memberId = this.members[i].id
        let member = this.overpass.cacheElements[memberId]

        if (member) {
          if (member.intersects(bbox) === 2) {
            return 2
          }
        }
      }
    }

    return super.intersects(bbox)
  }
}

module.exports = OverpassRelation
