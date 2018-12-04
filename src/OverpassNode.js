/* global L:false */

var OverpassObject = require('./OverpassObject')
var BoundingBox = require('boundingbox')
var OverpassFrontend = require('./defines')

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
    let result = {
      type: 'Feature',
      id: this.type + '/' + this.osm_id,
      properties: this.GeoJSONProperties()
    }

    if (this.geometry) {
      result.geometry = {
        type: 'Point',
        coordinates: [ this.geometry.lon, this.geometry.lat ]
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
    }
  }

  /**
   * return a leaflet feature for this object
   * @param {object} [options] options Options will be passed to the leaflet function
   * @param {string} [options.nodeFeature='CircleMarker'] Which type of object should be returned: 'Marker' (L.marker), 'Circle' (L.circle) or 'CircleMarker' (L.circleMarker).
   * @return {L.layer}
   */
  leafletFeature (options) {
    if (!this.geometry) {
      return null
    }

    switch ('nodeFeature' in options ? options.nodeFeature : null) {
      case 'Marker':
        return L.marker(this.geometry, options)
      case 'Circle':
        return L.circle(this.geometry, options.radius, options)
      case 'CircleMarker':
      default:
        return L.circleMarker(this.geometry, options)
    }
  }

  intersects (bbox) {
    if (!this.bounds) {
      return 1
    }

    return bbox.intersects(this.bounds) ? 2 : 0
  }
}

module.exports = OverpassNode
