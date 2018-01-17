var BoundingBox = require('boundingbox')
var OverpassFrontend = require('./defines')
var turf = {
  difference: require('@turf/difference'),
  intersect: require('@turf/intersect').default
}

function OverpassObject () {
  this.data = {}
  this.properties = 0
}

OverpassObject.prototype.member_ids = function () {
  return []
}

OverpassObject.prototype.updateData = function (data, options) {
  if (typeof this.id === 'undefined') {
    this.id = data.type.substr(0, 1) + data.id
    this.type = data.type
    this.osm_id = data.id
  }

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

OverpassObject.prototype.title = function () {
  if (!this.tags) {
    return this.id
  }

  return this.tags.name || this.tags.operator || this.tags.ref
}

OverpassObject.prototype.GeoJSON = function () {
  return {
    type: 'Feature',
    id: this.type + '/' + this.osm_id,
    geometry: null,
    properties: this.GeoJSONProperties()
  }
}

OverpassObject.prototype.GeoJSONProperties = function () {
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

  return ret
}

OverpassObject.prototype.intersects = function (bbox) {
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

OverpassObject.prototype.leafletFeature = function (options) {
  return null
}

module.exports = OverpassObject
