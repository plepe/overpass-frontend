/* global L:false */

var BoundingBox = require('boundingbox')
var OverpassObject = require('./OverpassObject')
var OverpassFrontend = require('./defines')
var turf = {
  bboxClip: require('@turf/bbox-clip').default
}

class OverpassWay extends OverpassObject {
  updateData (data, options) {
    if (data.nodes) {
      this.nodes = data.nodes
    }

    if (data.geometry) {
      this.geometry = data.geometry
    }

    super.updateData(data, options)

    if (typeof this.data.nodes !== 'undefined') {
      this.members = []

      for (var i = 0; i < this.data.nodes.length; i++) {
        this.members.push({
          id: 'n' + this.data.nodes[i],
          ref: this.data.nodes[i],
          type: 'node'
        })

        let obProperties = OverpassFrontend.ID_ONLY
        let ob = {
          id: this.data.nodes[i],
          type: 'node'
        }

        if (data.geometry) {
          obProperties = obProperties | OverpassFrontend.GEOM
          ob.lat = data.geometry[i].lat
          ob.lon = data.geometry[i].lon
        }

        let memberOb = this.overpass.createOrUpdateOSMObject(ob, {
          properties: obProperties
        })

        memberOb.notifyMemberOf(this, null, i)
      }

      if (!this.geometry) {
        this.geometry = this.members.map(
          member => {
            let node = this.overpass.cacheElements[member.id]
            if (node) {
              return node.geometry
            }
          }
        )
        this.geometry = this.geometry.filter(geom => geom)

        if (!this.geometry.length) {
          delete this.geometry
        }
      }
    }

    if (this.geometry && this.geometry.filter(geom => geom).length === this.geometry.length) {
      this.properties = this.properties | OverpassFrontend.GEOM

      if (!this.bounds) {
        this.bounds = new BoundingBox(this.geometry[0])
        this.geometry.slice(1).forEach(geom => this.bounds.extend(geom))
        this.center = this.bounds.getCenter()
        this.properties = this.properties | OverpassFrontend.BBOX | OverpassFrontend.CENTER
      }
    }
  }

  notifyMemberUpdate (memberObs) {
    super.notifyMemberUpdate(memberObs)

    if (!this.members) {
      return
    }

    memberObs.forEach(memberOb => {
      this.members.forEach((member, index) => {
        if (memberOb.id === member.id) {
          if (memberOb.geometry) {
            if (!this.geometry) {
              this.geometry = new Array(this.members.length)
            }

            this.geometry[index] = memberOb.geometry
          }
        }

        if (this.bounds) {
          this.bounds.extend(memberOb.geometry)
        } else {
          this.bounds = new BoundingBox(memberOb.geometry)
        }
      })
    })

    // all nodes known -> set bbox, geom and center
    if (this.geometry && this.geometry.filter(geom => geom).length === this.geometry.length) {
      this.center = this.bounds.getCenter()
      this.properties = this.properties | OverpassFrontend.BBOX | OverpassFrontend.GEOM | OverpassFrontend.CENTER
    }
  }

  memberIds () {
    if (this._memberIds) {
      return this._memberIds
    }

    if (!this.nodes) {
      return null
    }

    this._memberIds = []
    for (var i = 0; i < this.nodes.length; i++) {
      var member = this.nodes[i]

      this._memberIds.push('n' + member)
    }

    return this._memberIds
  }

  member_ids () { // eslint-disable-line
    console.log('called deprecated OverpassWay.member_ids() function - replace by memberIds()')
    return this.memberIds()
  }

  GeoJSON () {
    var result = {
      type: 'Feature',
      id: this.type + '/' + this.osm_id,
      properties: this.GeoJSONProperties()
    }

    if (this.geometry) {
      let coordinates = []
      for (var i = 0; i < this.geometry.length; i++) {
        coordinates.push([ this.geometry[i].lon, this.geometry[i].lat ])
      }

      result.geometry = {
        type: 'LineString',
        coordinates: coordinates
      }
    }

    return result
  }

  leafletFeature (options) {
    if (!this.geometry) {
      return null
    }

    if (this.geometry[this.geometry.length - 1].lat === this.geometry[0].lat &&
       this.geometry[this.geometry.length - 1].lon === this.geometry[0].lon) {
      return L.polygon(this.geometry, options)
    }

    return L.polyline(this.geometry, options)
  }

  intersects (bbox) {
    if (this.bounds) {
      if (!bbox.intersects(this.bounds)) {
        return 0
      }
    }

    if (this.geometry) {
      var intersects = turf.bboxClip(this.GeoJSON(), [ bbox.minlon, bbox.minlat, bbox.maxlon, bbox.maxlat ])

      return intersects.geometry.coordinates.length ? 2 : 0
    }

    return super.intersects(bbox)
  }
}

module.exports = OverpassWay
