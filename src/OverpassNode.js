/* global L:false */

const OverpassObject = require('./OverpassObject')
const BoundingBox = require('boundingbox')
const OverpassFrontend = require('./defines')
const turf = {
  booleanIntersects: require('@turf/boolean-intersects').default
}

/**
 * A node
 * @extends OverpassObject
 * @property {string} id ID of this object, starting with 'n'.
 * @property {number} osm_id Numeric id.
 * @property {string} type Type: 'node'
 * @property {object} tags OpenStreetMap tags.
 * @property {object} meta OpenStreetMap meta information.
 * @property {Point} geometry of the object
 * @property {object} data Data as loaded from Overpass API.
 * @property {bit_array} properties Which information about this object is known?
 * @property {object[]} memberOf List of ways and relations where this object is member of.
 * @property {string} memberOf.id ID of the way or relation where this way is member of.
 * @property {string} memberOf.role Role of this object in the relation.
 * @property {number} memberOf.sequence This object is the nth member in the way resp. relation.
 * @property {BoundingBox} bounds Bounding box of this object.
 * @property {Point} center Centroid of the bounding box.
 */
class OverpassNode extends OverpassObject {
  GeoJSON () {
    const result = {
      type: 'Feature',
      id: this.type + '/' + this.osm_id,
      properties: this.GeoJSONProperties()
    }

    if (this.geometry) {
      result.geometry = {
        type: 'Point',
        coordinates: [this.geometry.lon, this.geometry.lat]
      }
    }

    return result
  }

  exportOSMXML (options, document, callback) {
    super.exportOSMXML(options, document,
      (err, result) => {
        if (err) {
          return callback(err)
        }

        if (!result) { // already included
          return callback(null)
        }

        result.setAttribute('lat', this.geometry.lat)
        result.setAttribute('lon', this.geometry.lon)

        callback(null, result)
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

        result.lat = this.geometry.lat
        result.lon = this.geometry.lon

        callback(null, result)
      }
    )
  }

  updateData (data, options) {
    super.updateData(data, options)

    if (data.lat) {
      this.geometry = {
        lat: data.lat,
        lon: data.lon
      }

      this.bounds = new BoundingBox(data)
      this.center = this.bounds.getCenter()

      this.properties = this.properties | OverpassFrontend.GEOM | OverpassFrontend.BBOX | OverpassFrontend.CENTER
    } else if (this.properties & OverpassFrontend.GEOM !== 0) {
      this.visible = false
    }

    this.properties |= OverpassFrontend.MEMBERS // node does not have members, so it always known all of them
  }

  /**
   * return a leaflet feature for this object
   * @param {object} [options] options Options will be passed to the leaflet function
   * @param {string} [options.nodeFeature='CircleMarker'] Which type of object should be returned: 'Marker' (L.marker), 'Circle' (L.circle) or 'CircleMarker' (L.circleMarker).
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

    const geom = { lat: this.geometry.lat, lon: this.geometry.lon + options.shiftWorld[this.geometry.lon < 0 ? 0 : 1] }

    switch ('nodeFeature' in options ? options.nodeFeature : null) {
      case 'Marker':
        return L.marker(geom, options)
      case 'Circle':
        return L.circle(geom, options.radius, options)
      case 'CircleMarker':
      default:
        return L.circleMarker(geom, options)
    }
  }

  intersects (bbox) {
    if (!this.bounds) {
      return 1
    }

    if (!bbox.intersects) { // GeoJSON detected
      const r = turf.booleanIntersects(this.GeoJSON(), bbox)
      return r ? 2 : 0
    }

    return bbox.intersects(this.bounds) ? 2 : 0
  }
}

module.exports = OverpassNode
