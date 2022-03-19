/* global L:false */

const async = require('async')
const BoundingBox = require('boundingbox')
const OverpassObject = require('./OverpassObject')
const OverpassFrontend = require('./defines')
const turf = {
  booleanIntersects: require('@turf/boolean-intersects').default
}

/**
 * A way
 * @property {string} id ID of this object, starting with 'w'.
 * @property {number} osm_id Numeric id.
 * @property {string} type Type: 'way'.
 * @property {object} tags OpenStreetMap tags.
 * @property {object} meta OpenStreetMap meta information.
 * @property {Point[]} geometry of the object
 * @property {object} data Data as loaded from Overpass API.
 * @property {bit_array} properties Which information about this object is known?
 * @property {object[]} memberOf List of relations where this object is member of.
 * @property {string} memberOf.id ID of the relation where this way is member of.
 * @property {string} memberOf.role Role of this object in the relation.
 * @property {number} memberOf.sequence This object is the nth member in the relation.
 * @property {BoundingBox} bounds Bounding box of this object.
 * @property {Point} center Centroid of the bounding box.
 * @property {object[]} members Nodes of the way.
 * @property {string} members.id ID of the member.
 * @property {number} members.ref Numeric ID of the member.
 * @property {string} members.type 'node'.
 */
class OverpassWay extends OverpassObject {
  updateData (data, options) {
    if (data.nodes) {
      this.nodes = data.nodes
    }

    if (data.geometry) {
      this.geometry = data.geometry
      this.properties |= OverpassFrontend.GEOM
    }

    super.updateData(data, options)

    if (typeof this.data.nodes !== 'undefined') {
      this.members = []
      this.properties |= OverpassFrontend.MEMBERS

      for (let i = 0; i < this.data.nodes.length; i++) {
        this.members.push({
          id: 'n' + this.data.nodes[i],
          ref: this.data.nodes[i],
          type: 'node'
        })

        let obProperties = OverpassFrontend.ID_ONLY
        const ob = {
          id: this.data.nodes[i],
          type: 'node'
        }

        if (data.geometry && data.geometry[i]) {
          obProperties = obProperties | OverpassFrontend.GEOM
          ob.lat = data.geometry[i].lat
          ob.lon = data.geometry[i].lon
        }

        const memberOb = this.overpass.createOrUpdateOSMObject(ob, {
          properties: obProperties
        })

        memberOb.notifyMemberOf(this, null, i)
      }
    }

    this.checkGeometry()
  }

  notifyMemberUpdate (memberObs) {
    super.notifyMemberUpdate(memberObs)

    this.checkGeometry()
  }

  checkGeometry () {
    if (this.members && (this.properties & OverpassFrontend.GEOM) === 0) {
      this.geometry = this.members.map(
        member => {
          const node = this.overpass.cacheElements[member.id]
          return node ? node.geometry : null
        }
      ).filter(geom => geom)

      if (this.geometry.length === 0) {
        delete this.geometry
        return
      }

      if (this.geometry.length === this.members.length) {
        this.properties = this.properties | OverpassFrontend.GEOM
      }
    }

    if (this.geometry && (this.properties & OverpassFrontend.BBOX) === 0) {
      this.bounds = new BoundingBox(this.geometry[0])
      this.geometry.slice(1).forEach(geom => this.bounds.extend(geom))
    }

    if (this.bounds && (this.properties & OverpassFrontend.CENTER) === 0) {
      this.center = this.bounds.getCenter()
    }

    if ((this.properties & OverpassFrontend.GEOM) === OverpassFrontend.GEOM) {
      this.properties = this.properties | OverpassFrontend.BBOX | OverpassFrontend.CENTER
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
    for (let i = 0; i < this.nodes.length; i++) {
      const member = this.nodes[i]

      this._memberIds.push('n' + member)
    }

    return this._memberIds
  }

  member_ids () { // eslint-disable-line
    console.log('called deprecated OverpassWay.member_ids() function - replace by memberIds()')
    return this.memberIds()
  }

  GeoJSON () {
    const result = {
      type: 'Feature',
      id: this.type + '/' + this.osm_id,
      properties: this.GeoJSONProperties()
    }

    if (this.geometry) {
      const coordinates = this.geometry
        .filter(point => point) // discard non-loaded points
        .map(point => [point.lon, point.lat])
      const isClosed = this.members && this.members[0].id === this.members[this.members.length - 1].id

      if (isClosed) {
        result.geometry = {
          type: 'Polygon',
          coordinates: [coordinates]
        }
      } else {
        result.geometry = {
          type: 'LineString',
          coordinates: coordinates
        }
      }
    }

    return result
  }

  exportOSMXML (options, parentNode, callback) {
    super.exportOSMXML(options, parentNode,
      (err, result) => {
        if (err) {
          return callback(err)
        }

        if (!result) { // already included
          return callback(null)
        }

        if (this.members) {
          async.each(this.members,
            (member, done) => {
              const memberOb = this.overpass.cacheElements[member.id]

              const nd = parentNode.ownerDocument.createElement('nd')
              nd.setAttribute('ref', memberOb.osm_id)
              result.appendChild(nd)

              memberOb.exportOSMXML(options, parentNode, done)
            },
            (err) => {
              callback(err, result)
            }
          )
        } else {
          callback(null, result)
        }
      }
    )
  }

  exportOSMJSON (conf, elements, callback) {
    super.exportOSMJSON(conf, elements,
      (err, result) => {
        if (err) {
          return callback(err)
        }

        if (!result) { // already included
          return callback(null)
        }

        if (this.members) {
          result.nodes = []

          async.each(this.members,
            (member, done) => {
              const memberOb = this.overpass.cacheElements[member.id]

              result.nodes.push(memberOb.osm_id)

              memberOb.exportOSMJSON(conf, elements, done)
            },
            (err) => {
              callback(err, result)
            }
          )
        } else {
          callback(null, result)
        }
      }
    )
  }

  /**
   * return a leaflet feature for this object. If the ways is closed, a L.polygon will be returned, otherwise a L.polyline.
   * @param {object} [options] options Options will be passed to the leaflet function
   * @param {number[]} [options.shiftWorld=[0, 0]] Shift western (negative) longitudes by shiftWorld[0], eastern (positive) longitudes by shiftWorld[1] (e.g. by 360, 0 to show objects around lon=180)
   * @return {L.layer}
   */
  leafletFeature (options = {}) {
    if (!this.geometry) {
      return null
    }

    if (!('shiftWorld' in options)) {
      options.shiftWorld = [0, 0]
    }

    const geom = this.geometry
      .filter(g => g)
      .map(g => {
        return { lat: g.lat, lon: g.lon + options.shiftWorld[g.lon < 0 ? 0 : 1] }
      })

    if (this.geometry[this.geometry.length - 1] && this.geometry[0] &&
       this.geometry[this.geometry.length - 1].lat === this.geometry[0].lat &&
       this.geometry[this.geometry.length - 1].lon === this.geometry[0].lon) {
      return L.polygon(geom, options)
    }

    return L.polyline(geom, options)
  }

  intersects (bbox) {
    const result = super.intersects(bbox)

    if (result === 0 || result === 2) {
      return result
    }

    if (this.geometry) {
      let intersects
      if (bbox.toGeoJSON) {
        // bbox is BoudingBox
        intersects = turf.booleanIntersects(this.GeoJSON(), bbox.toGeoJSON())
      } else {
        // bbox is GeoJSON
        intersects = turf.booleanIntersects(this.GeoJSON(), bbox)
      }

      return intersects ? 2 : 0
    }

    return 1
  }

  qlOutJSON (options) {
    const result = super.qlOutJSON(options)

    if (this.data.nodes && (options.body || options.meta || options.skel || !options.ids)) {
      result.nodes = this.data.nodes
    }

    if (this.bounds && options.bb) {
      result.bounds = this.bounds
    }

    if (this.center && options.center) {
      result.center = this.center
    }

    if (this.bounds && options.geom) {
      result.geometry = this.members.map(
        member => {
          const node = this.overpass.cacheElements[member.id]
          return node ? node.geometry : null
        }
      )
    }

    return result
  }
}

module.exports = OverpassWay
