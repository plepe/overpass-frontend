/* global L:false */

const async = require('async')
const BoundingBox = require('boundingbox')
const OverpassObject = require('./OverpassObject')
const GeowikiAPI = require('./defines')
const turf = require('./turf')

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
      this.properties |= GeowikiAPI.GEOM
    }

    super.updateData(data, options)

    if (typeof this.data.nodes !== 'undefined') {
      this.members = []
      this.properties |= GeowikiAPI.MEMBERS

      for (let i = 0; i < this.data.nodes.length; i++) {
        this.members.push({
          id: 'n' + this.data.nodes[i],
          ref: this.data.nodes[i],
          type: 'node'
        })

        let obProperties = GeowikiAPI.ID_ONLY
        const ob = {
          id: this.data.nodes[i],
          type: 'node'
        }

        if (data.geometry && data.geometry[i]) {
          obProperties = obProperties | GeowikiAPI.GEOM
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
    if (this.members && (this.properties & GeowikiAPI.GEOM) === 0) {
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
        this.properties = this.properties | GeowikiAPI.GEOM
      }
    }

    if (this.geometry && (!this.bounds || (this.properties & GeowikiAPI.BBOX) === 0)) {
      this.bounds = new BoundingBox(this.geometry[0])
      this.geometry.slice(1).forEach(geom => this.bounds.extend(geom))
    }

    if (this.bounds && (!this.center || (this.properties & GeowikiAPI.CENTER) === 0)) {
      this.center = this.bounds.getCenter()
    }

    if ((this.properties & GeowikiAPI.GEOM) === GeowikiAPI.GEOM) {
      this.properties = this.properties | GeowikiAPI.BBOX | GeowikiAPI.CENTER
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

  GeoJSON (options = { meta: true, geom: true }) {
    const result = super.GeoJSON(options)

    if (options.bb && this.bounds) {
      result.bbox = [this.bounds.minlon, this.bounds.minlat, this.bounds.maxlon, this.bounds.maxlat]
    }

    if (options.center && this.bounds) {
      result.geometry = {
        type: 'Point',
        coordinates: [
          parseFloat(this.center.lon.toFixed(7)),
          parseFloat(this.center.lat.toFixed(7))
        ]
      }
    }

    if (options.geom && this.geometry) {
      const coordinates = this.geometry
        .filter(point => point) // discard non-loaded points
        .map(point => [point.lon, point.lat])
      const isClosed = coordinates.length > 1 && this.members && this.members[0].id === this.members[this.members.length - 1].id

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

    if (this.members && ((!options.ids && !options.tags) || options.body || options.skel)) {
      result.properties['@members'] = this.nodes.map(m => {
        return { type: 'node', ref: m }
      })
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
        // bbox is BoundingBox
        intersects = turf.booleanIntersects(this.GeoJSON(), bbox.toGeoJSON())
      } else {
        // bbox is GeoJSON
        intersects = turf.booleanIntersects(this.GeoJSON(), bbox)
      }

      return intersects ? 2 : 0
    }

    return 1
  }

  outJson (options) {
    const result = super.outJson(options)

    if ((options.bb || options.geom) && this.bounds) {
      result.bounds = { ...this.bounds }
    }

    if (options.center && this.bounds) {
      result.center = {
        lat: parseFloat(this.center.lat.toFixed(7)),
        lon: parseFloat(this.center.lon.toFixed(7))
      }
    }

    if (this.nodes && ((!options.ids && !options.tags) || options.body || options.skel)) {
      result.nodes = this.nodes
    }

    if (options.geom && this.geometry) {
      result.geometry = this.geometry
    }

    return result
  }

  _outXml (options, document, result) {
    if ((options.bb || options.geom) && this.bounds) {
      const blank = document.createTextNode('\n  ')
      result.appendChild(blank)

      const node = document.createElement('bounds')
      node.setAttribute('minlat', this.bounds.minlat.toFixed(7))
      node.setAttribute('minlon', this.bounds.minlon.toFixed(7))
      node.setAttribute('maxlat', this.bounds.maxlat.toFixed(7))
      node.setAttribute('maxlon', this.bounds.maxlon.toFixed(7))
      result.appendChild(node)
    }

    if (options.center && this.bounds) {
      const blank = document.createTextNode('\n  ')
      result.appendChild(blank)

      const node = document.createElement('center')
      node.setAttribute('lat', this.center.lat.toFixed(7))
      node.setAttribute('lon', this.center.lon.toFixed(7))
      result.appendChild(node)
    }

    if (this.nodes && ((!options.ids && !options.tags) || options.body || options.skel)) {
      this.nodes.forEach((id, i) => {
        const blank = document.createTextNode('\n  ')
        result.appendChild(blank)

        const nd = document.createElement('nd')
        nd.setAttribute('ref', id)

        if (options.geom && this.geometry) {
          nd.setAttribute('lat', this.geometry[i].lat.toFixed(7))
          nd.setAttribute('lon', this.geometry[i].lon.toFixed(7))
        }

        result.appendChild(nd)
      })
    }

    return result
  }
}

module.exports = OverpassWay
