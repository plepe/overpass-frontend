/* global L:false */

var OverpassObject = require('./OverpassObject')
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
      }
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
