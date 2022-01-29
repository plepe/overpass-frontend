const ee = require('event-emitter')
const BoundingBox = require('boundingbox')
const OverpassFrontend = require('./defines')
const isGeoJSON = require('./isGeoJSON')
const turf = {
  booleanIntersects: require('@turf/boolean-intersects').default,
  difference: require('@turf/difference'),
  intersect: require('@turf/intersect').default
}

const booleanWithin = require('./booleanWithin')

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
    this.memberOf.push({ id: relation.id, role, sequence })
  }

  updateData (data, options) {
    if (typeof this.id === 'undefined') {
      this.id = data.type.substr(0, 1) + data.id
      this.type = data.type
      this.osm_id = data.id
    }

    this.osm3sMeta = options.osm3sMeta

    for (const k in data) {
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

    if (options.bounds) {
      if (!this.bounds || options.bounds.intersects(this.bounds)) {
        this.properties = this.properties | options.properties
      } else {
        this.properties = this.properties | OverpassFrontend.BBOX | OverpassFrontend.CENTER
      }
    } else {
      this.properties = this.properties | options.properties
    }

    // result of a request with bbox limitation, where the object was outside
    if (options.boundsNoMatch && this.bounds) {
      // this.boundsPossibleMatch: record unsucessful bbox requests for an object
      if (typeof this.boundsPossibleMatch === 'undefined') {
        this.boundsPossibleMatch = this.bounds.toGeoJSON()
      }

      this.boundsPossibleMatch = turf.difference(this.boundsPossibleMatch, options.bounds.toGeoJSON())
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
    } else if (data.tags) {
      this.tags = data.tags
      this.properties |= OverpassFrontend.TAGS
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
      this.properties |= OverpassFrontend.META
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
    const ret = {}
    let k

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
   * Export object as GeoJSON. Missing geometry will be loaded.
   * @param object options Options
   * @param function callback Function which will be called with (err, result)
   */
  exportGeoJSON (options, callback) {
    this.overpass.get(
      this.id,
      {
        properties: OverpassFrontend.TAGS | OverpassFrontend.MEMBERS | OverpassFrontend.META | OverpassFrontend.GEOM
      },
      () => {},
      (err) => {
        if (err) {
          return callback(err)
        }

        callback(null, this.GeoJSON(options))
      }
    )
  }

  /**
   * Export object (and members) as OpenStreetMap XML
   * @param object options Options
   * @param DOMNode parentNode a DOM Node where the object will be appended as child. Depending on object type and options, member objects will also be appended on the same level.
   * @param function callback Function which will be called with (err, dom node)
   */
  exportOSMXML (options, parentNode, callback) {
    if (!parentNode._alreadyIncluded) {
      parentNode._alreadyIncluded = {}
    }
    if (this.id in parentNode._alreadyIncluded) {
      return callback(null)
    }
    parentNode._alreadyIncluded[this.id] = true

    if ((this.properties & (OverpassFrontend.TAGS | OverpassFrontend.MEMBERS | OverpassFrontend.META)) !== (OverpassFrontend.TAGS | OverpassFrontend.MEMBERS | OverpassFrontend.META)) {
      return this.overpass.get(
        this.id,
        {
          properties: OverpassFrontend.TAGS | OverpassFrontend.MEMBERS | OverpassFrontend.META
        },
        () => {},
        (err) => {
          if (err) {
            return callback(err)
          }

          this._exportOSMXML(options, parentNode, callback)
        }
      )
    }

    this._exportOSMXML(options, parentNode, callback)
  }

  _exportOSMXML (options, parentNode, callback) {
    const result = parentNode.ownerDocument.createElement(this.type)
    result.setAttribute('id', this.osm_id)

    if (this.meta) {
      result.setAttribute('version', this.meta.version)
      result.setAttribute('timestamp', this.meta.timestamp)
      result.setAttribute('changeset', this.meta.changeset)
      result.setAttribute('uid', this.meta.uid)
      result.setAttribute('user', this.meta.user)
    }

    if (this.tags) {
      for (const k in this.tags) {
        const tag = parentNode.ownerDocument.createElement('tag')
        tag.setAttribute('k', k)
        tag.setAttribute('v', this.tags[k])

        result.appendChild(tag)
      }
    }

    parentNode.appendChild(result)

    callback(null, result)
  }

  /**
   * Export object (and members) as OpenStreetMap JSON
   * @param object options Options
   * @param object elements All exported elements, include member objects. Pass an empty object. If a member element would be exported multiple times it will appear only once. For the final export, to be compatible to Overpass API, you should convert the object to an array via Object.values().
   * @param function callback Function which will be called with (err, result)
   */
  exportOSMJSON (conf, elements, callback) {
    if (this.id in elements) {
      return callback(null)
    }
    elements[this.id] = {}

    if ((this.properties & (OverpassFrontend.TAGS | OverpassFrontend.MEMBERS | OverpassFrontend.META)) !== (OverpassFrontend.TAGS | OverpassFrontend.MEMBERS | OverpassFrontend.META)) {
      return this.overpass.get(
        this.id,
        {
          properties: OverpassFrontend.TAGS | OverpassFrontend.MEMBERS | OverpassFrontend.META
        },
        () => {},
        (err) => {
          if (err) {
            return callback(err)
          }

          this._exportOSMJSON(conf, elements, callback)
        }
      )
    }

    this._exportOSMJSON(conf, elements, callback)
  }

  _exportOSMJSON (conf, elements, callback) {
    const result = elements[this.id]
    result.type = this.type
    result.id = this.osm_id

    if (this.meta) {
      result.version = this.meta.version
      result.timestamp = this.meta.timestamp
      result.changeset = this.meta.changeset
      result.uid = this.meta.uid
      result.user = this.meta.user
    }

    if (this.tags && Object.keys(this.tags).length) {
      result.tags = this.tags
    }

    callback(null, result)
  }

  /**
   * Check whether this object intersects (or is within) the specified bounding box. Returns 0 if it does not match; 1 if the exact geometry is not known, but the object's bounding box matches; 2 exact match.
   * @param {boundingbox:BoundingBox} bbox Bounding box
   * @return {number}
   */
  intersects (bbox) {
    if (this.bounds) {
      if (!bbox.intersects) { // GeoJSON detected
        const geojson = this.bounds.toGeoJSON()
        if (!turf.booleanIntersects(geojson, bbox)) {
          return 0
        }
        if (booleanWithin(geojson, bbox)) {
          return 2
        }
      } else {
        if (!bbox.intersects(this.bounds)) {
          return 0
        }
        if (this.bounds.within(bbox)) {
          return 2
        }
      }
    }

    if (this.boundsPossibleMatch) {
      const remaining = turf.intersect(isGeoJSON(bbox) ? bbox : bbox.toGeoJSON(), this.boundsPossibleMatch)

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

  dbInsert (db) {
    if (!this.dbData) {
      this.dbData = {}
      db.insert(this.dbData)
    }

    this.dbData.tags = this.tags
    this.dbData.osmMeta = this.meta
    this.dbData.id = this.id
    if (this.meta) {
      this.dbData.timestamp = this.meta.timestamp
    }
    this.dbData.type = this.type

    if (this.bounds && this.bounds.minlat) {
      this.dbData.minlat = this.bounds.minlat
      this.dbData.minlon = this.bounds.minlon
      this.dbData.maxlat = this.bounds.maxlat
      this.dbData.maxlon = this.bounds.maxlon

      if (this.bounds.minlon > this.bounds.maxlon) {
        this.dbData.stretchLon180 = true
        this.overpass.hasStretchLon180 = true
      }
    }

    db.update(this.dbData)
  }
}

ee(OverpassObject.prototype)

module.exports = OverpassObject
