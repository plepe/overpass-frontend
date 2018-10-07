const ee = require('event-emitter')
var BoundingBox = require('boundingbox')
var OverpassFrontend = require('./defines')
var turf = {
  difference: require('@turf/difference'),
  intersect: require('@turf/intersect').default
}

/**
 * Base class for representing map features.
 * @property {string} id ID of this object.
 * @property {number} osm_id Numeric id.
 * @property {string} type Type: 'node', 'way' or 'relation'.
 * @property {object} tags OpenStreetMap tags.
 * @property {object} meta OpenStreetMap meta information.
 * @property {object} geometry of the object
 * @property {object} data Data as loaded from Overpass API.
 * @property {bit_array} properties Which information about this object is known?
 * @property {object[]} memberOf List of ways and relations where this object is member of.
 * @property {string} memberOf.id ID of the way or relation where this way is member of.
 * @property {string} memberOf.role Role of this object in the relation.
 * @property {number} memberOf.sequence This object is the nth member in the way resp. relation.
* @property {BoundingBox} bounds Bounding box of this object.
 * @property {Point} center Centroid of the bounding box.
 */
class OverpassObject {
  constructor () {
    this.data = {}
    this.properties = 0
    this.memberOf = []
  }

  memberIds () {
    return []
  }

  member_ids () { // eslint-disable-line
    console.log('called deprecated OverpassObject.member_ids() function - replace by memberIds()')
    return this.memberIds()
  }

  notifyMemberOf (relation, role, sequence) {
    this.memberOf.push({ relation, role, sequence })
  }

  updateData (data, options) {
    if (typeof this.id === 'undefined') {
      this.id = data.type.substr(0, 1) + data.id
      this.type = data.type
      this.osm_id = data.id
    }

    this.osm3sMeta = options.osm3sMeta

    for (var k in data) {
      this.data[k] = data[k]
    }

    if (data.bounds) {
      this.bounds = new BoundingBox(data.bounds)
      this.center = this.bounds.getCenter()
      this.diagonalLength = this.bounds.diagonalLength()
    } else if (data.center) {
      this.bounds = new BoundingBox(data.center)
      this.center = this.bounds.getCenter()
    }

    if (options.bbox) {
      if (!this.bounds || options.bbox.intersects(this.bounds)) {
        this.properties = this.properties | options.properties
      } else {
        this.properties = this.properties | OverpassFrontend.BBOX | OverpassFrontend.CENTER
      }
    } else {
      this.properties = this.properties | options.properties
    }

    // result of a request with bbox limitation, where the object was outside
    if (options.bboxNoMatch && this.bounds) {
      // this.boundsPossibleMatch: record unsucessful bbox requests for an object
      if (typeof this.boundsPossibleMatch === 'undefined') {
        this.boundsPossibleMatch = this.bounds.toGeoJSON()
      }

      this.boundsPossibleMatch = turf.difference(this.boundsPossibleMatch, options.bbox.toGeoJSON())
    }

    // geometry is known -> no need for this.boundsPossibleMatch
    if (this.geometry) {
      delete this.boundsPossibleMatch
    }

    if (options.properties & OverpassFrontend.TAGS) {
      if (typeof data.tags === 'undefined') {
        this.tags = {}
      } else {
        this.tags = data.tags
      }
    }
    this.errors = []

    if (data.timestamp) {
      this.meta = {
        timestamp: data.timestamp,
        version: data.version,
        changeset: data.changeset,
        user: data.user,
        uid: data.uid
      }
    }

    if (data.tags) {
      this.tags = data.tags
    }
  }

  notifyMemberUpdate (memberObs) {
  }

  /**
   * Title of of this object (default: name, operator or ref or the id of the object)
   * @return {string}
   */
  title () {
    if (!this.tags) {
      return this.id
    }

    return this.tags.name || this.tags.operator || this.tags.ref || this.id
  }

  /**
   * GeoJSON representation of this object
   * @return {object}
   */
  GeoJSON () {
    return {
      type: 'Feature',
      id: this.type + '/' + this.osm_id,
      geometry: null,
      properties: this.GeoJSONProperties()
    }
  }

  GeoJSONProperties () {
    var ret = {}
    var k

    ret['@id'] = this.type + '/' + this.osm_id

    if (this.tags) {
      for (k in this.tags) {
        ret[k] = this.tags[k]
      }
    }

    if (this.meta) {
      for (k in this.meta) {
        ret['@' + k] = this.meta[k]
      }
    }

    for (k in this.osm3sMeta) {
      ret['@osm3s:' + k] = this.osm3sMeta[k]
    }

    return ret
  }

  /**
   * Check whether this object intersects (or is within) the specified bounding box. Returns 0 if it does not match; 1 if the exact geometry is not known, but the object's bounding box matches; 2 exact match.
   * @param {boundingbox:BoundingBox} bbox Bounding box
   * @return {number}
   */
  intersects (bbox) {
    if (!this.bounds) {
      return 0
    }

    if (!bbox.intersects(this.bounds)) {
      return 0
    }

    if (this.boundsPossibleMatch) {
      var remaining = turf.intersect(bbox.toGeoJSON(), this.boundsPossibleMatch)

      if (!remaining || remaining.geometry.type !== 'Polygon') {
        // geometry.type != Polygon: bbox matches border of this.boundsPossibleMatch
        return 0
      }

      return 1
    }

    return 1
  }

  /**
   * return a leaflet feature for this object.
   * @param {object} [options] options Options will be passed to the leaflet function
   * @return {L.layer}
   */
  leafletFeature (options) {
    return null
  }

  dbInsert () {
    if (!this.dbData) {
      this.dbData = {}
    }

    this.dbData.tags = this.tags
    this.dbData.osmMeta = this.meta
    this.dbData.id = this.id
    this.dbData.type = this.type

    if (this.bounds && this.bounds.minlat) {
      this.dbData.minlat = this.bounds.minlat
      this.dbData.minlon = this.bounds.minlon
      this.dbData.maxlat = this.bounds.maxlat
      this.dbData.maxlon = this.bounds.maxlon
    }

    return this.dbData
  }
}

ee(OverpassObject.prototype)

module.exports = OverpassObject
