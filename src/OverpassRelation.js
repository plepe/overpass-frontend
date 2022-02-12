/* global L:false */

const async = require('async')
const BoundingBox = require('boundingbox')
const osmtogeojson = require('osmtogeojson')
const OverpassObject = require('./OverpassObject')
const OverpassFrontend = require('./defines')
const geojsonShiftWorld = require('./geojsonShiftWorld')
const turf = {
  booleanIntersects: require('@turf/boolean-intersects').default
}

/**
 * A relation
 * @property {string} id ID of this object, starting with 'r'.
 * @property {number} osm_id Numeric id.
 * @property {string} type Type: 'relation'.
 * @property {object} tags OpenStreetMap tags.
 * @property {object} meta OpenStreetMap meta information.
 * @property {GeoJSON} geometry of the object
 * @property {object} data Data as loaded from Overpass API.
 * @property {bit_array} properties Which information about this object is known?
 * @property {object[]} memberOf List of relations where this object is member of.
 * @property {string} memberOf.id ID of the relation where this object is member of.
 * @property {string} memberOf.role Role of this object in the relation.
 * @property {number} memberOf.sequence This object is the nth member in the relation.
 * @property {null|string} memberOf.connectedPrev null (unknown), 'no' (connected), 'forward' (connected at the front end of this way), 'backward' (connected at the back end of this way)
 * @property {null|string} memberOf.connectedNext null (unknown), 'no' (connected), 'forward' (connected at the back end of this way), 'backward' (connected at the front end of this way)
 * @property {null|string} members.dir null (unknown), 'forward', 'backward'
 * @property {BoundingBox} bounds Bounding box of this object.
 * @property {Point} center Centroid of the bounding box.
 * @property {object[]} members Nodes of the way.
 * @property {string} members.id ID of the member.
 * @property {number} members.ref Numeric ID of the member.
 * @property {string} members.type 'node'.
 * @property {string} members.role Role of the member.
 * @property {null|string} members.connectedPrev null (unknown), 'no' (connected), 'forward' (connected at the front end of this way), 'backward' (connected at the back end of this way)
 * @property {null|string} members.connectedNext null (unknown), 'no' (connected), 'forward' (connected at the back end of this way), 'backward' (connected at the fornt end of this way)
 * @property {null|string} members.dir null (unknown), 'forward', 'backward', 'loop'
 */
class OverpassRelation extends OverpassObject {
  updateData (data, options) {
    super.updateData(data, options)

    if (data.bounds) {
      this.bounds = new BoundingBox(data.bounds)
      this.center = this.bounds.getCenter()
      this.properties |= OverpassFrontend.BBOX | OverpassFrontend.CENTER
    }

    if (data.center) {
      this.center = data.center
      this.properties |= OverpassFrontend.CENTER
    }

    if (data.members) {
      this.members = []
      this.properties |= OverpassFrontend.MEMBERS

      const membersKnown = !!this.memberFeatures
      this.memberFeatures = data.members.map(
        (member, sequence) => {
          this.members.push(member)

          // fix referenced ways from 'out geom' output
          if (member.type === 'way' && typeof member.ref === 'string') {
            const m = member.ref.match(/^_fullGeom([0-9]+)$/)
            if (m) {
              member.ref = parseInt(m[1])
            }
          }

          member.id = member.type.substr(0, 1) + member.ref

          const memberOptions = JSON.parse(JSON.stringify(options))

          const ob = JSON.parse(JSON.stringify(member))
          ob.id = ob.ref
          delete ob.ref
          delete ob.role
          memberOptions.properties = OverpassFrontend.ID_ONLY

          if ((member.type === 'node' && 'lat' in member) ||
              (member.type === 'way' && 'geometry' in member)) {
            memberOptions.properties |= OverpassFrontend.GEOM
          }

          const memberMetaOb = this.overpass.createOrUpdateOSMObject(ob, memberOptions)

          // call notifyMemberOf only once per member
          if (!membersKnown) {
            memberMetaOb.notifyMemberOf(this, member.role, sequence)
          }

          return memberMetaOb
        }
      )

      this.updateGeometry()
    }
  }

  updateGeometry () {
    if (!this.members) {
      return
    }

    const cacheOptions = {}
    if (this.data.timestamp) {
      cacheOptions.date = this.data.timestamp
    }

    let allKnown = true
    const elements = [{
      type: 'relation',
      id: this.osm_id,
      tags: this.tags,
      members: this.members.map(member => {
        const data = {
          ref: member.ref,
          type: member.type,
          role: member.role
        }

        const ob = this.overpass.cache.get(member.id, cacheOptions)

        if (ob === undefined) {
          allKnown = false
          return data
        }

        if ((ob.properties & OverpassFrontend.GEOM) === 0) {
          allKnown = false
        }

        if (ob.type === 'node') {
          if (ob.geometry) {
            data.lat = ob.geometry.lat
            data.lon = ob.geometry.lon
          }
        } else if (ob.type === 'way') {
          data.geometry = ob.geometry
        }

        return data
      })
    }]

    this.geometry = osmtogeojson({ elements })
    if (allKnown) {
      this.properties = this.properties | OverpassFrontend.GEOM
    }

    this.members.forEach(
      (member, index) => {
        if (member.type !== 'way') {
          return
        }

        const memberOb = this.overpass.cache.get(member.id, cacheOptions)
        if (!memberOb || !memberOb.members || member.type !== 'way') {
          return
        }

        const firstMemberId = memberOb.members[0].id
        const lastMemberId = memberOb.members[memberOb.members.length - 1].id
        const revMemberOf = memberOb.memberOf.filter(memberOf => memberOf.sequence === index && memberOf.id === this.id)[0]

        if (index > 0) {
          const prevMember = this.overpass.cache.get(this.members[index - 1].id, cacheOptions)
          if (prevMember && prevMember.type === 'way' && prevMember.members) {
            if (firstMemberId === prevMember.members[0].id || firstMemberId === prevMember.members[prevMember.members.length - 1].id) {
              member.connectedPrev = 'forward'
            } else if (lastMemberId === prevMember.members[0].id || lastMemberId === prevMember.members[prevMember.members.length - 1].id) {
              member.connectedPrev = 'backward'
            } else {
              member.connectedPrev = 'no'
            }
          }
        }

        if (index < this.members.length - 1) {
          const nextMember = this.overpass.cache.get(this.members[index + 1].id, cacheOptions)
          if (nextMember && nextMember.type === 'way' && nextMember.members) {
            if (firstMemberId === nextMember.members[0].id || firstMemberId === nextMember.members[nextMember.members.length - 1].id) {
              member.connectedNext = 'backward'
            } else if (lastMemberId === nextMember.members[0].id || lastMemberId === nextMember.members[nextMember.members.length - 1].id) {
              member.connectedNext = 'forward'
            } else {
              member.connectedNext = 'no'
            }
          }
        }

        if (!member.connectedPrev || !member.connectedNext) {
          member.dir = member.connectedPrev || member.connectedNext || null
        } else if (member.connectedPrev === member.connectedNext) {
          member.dir = member.connectedPrev || member.connectedNext || null
        } else {
          member.dir = null
        }

        if (revMemberOf) {
          if ('dir' in member) {
            revMemberOf.dir = member.dir
          }
          if ('connectedPrev' in member) {
            revMemberOf.connectedPrev = member.connectedPrev
          }
          if ('connectedNext' in member) {
            revMemberOf.connectedNext = member.connectedNext
          }
        } else {
          console.log('Warning: memberOf reference ' + member.id + ' -> ' + this.id + ' (#' + index + ') does not exist.')
        }
      }
    )

    if (!(this.properties & OverpassFrontend.BBOX)) {
      this.members.forEach(member => {
        const ob = this.overpass.cache.get(member.id, cacheOptions)
        if (ob && ob.bounds) {
          if (this.bounds) {
            this.bounds.extend(ob.bounds)
          } else {
            this.bounds = new BoundingBox(ob.bounds)
          }
        }
        if (this.bounds) {
          this.center = this.bounds.getCenter()
        }
      })

      if (this.bounds && allKnown) {
        this.properties = this.properties | OverpassFrontend.BBOX | OverpassFrontend.CENTER
      }
    }
  }

  notifyMemberUpdate (memberObs) {
    super.notifyMemberUpdate(memberObs)

    if (!this.members) {
      return
    }

    this.updateGeometry()
  }

  /**
   * Return list of member ids.
   * @return {string[]}
   */
  memberIds () {
    if (this._memberIds) {
      return this._memberIds
    }

    if (typeof this.data.members === 'undefined') {
      return null
    }

    this._memberIds = []
    for (let i = 0; i < this.data.members.length; i++) {
      const member = this.data.members[i]

      this._memberIds.push(member.type.substr(0, 1) + member.ref)
    }

    return this._memberIds
  }

  member_ids () { // eslint-disable-line
    console.log('called deprecated OverpassRelation.member_ids() function - replace by memberIds()')
    return this.memberIds()
  }

  /**
   * return a leaflet feature for this object.
   * @param {object} [options] options Options will be passed to the leaflet function
   * @param {number[]} [options.shiftWorld=[0, 0]] Shift western (negative) longitudes by shiftWorld[0], eastern (positive) longitudes by shiftWorld[1] (e.g. by 360, 0 to show objects around lon=180)
   * @return {L.layer}
   */
  leafletFeature (options = {}) {
    if (!this.data.members) {
      return null
    }

    if (!('shiftWorld' in options)) {
      options.shiftWorld = [0, 0]
    }

    // no geometry? use the member features instead
    if (!this.geometry) {
      const feature = L.featureGroup()
      feature._updateCallbacks = []

      return feature
    }

    const feature = L.geoJSON(geojsonShiftWorld(this.geometry, options.shiftWorld), {
      pointToLayer: function (options, geoJsonPoint, member) {
        let feature

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

    // create an event handler on the 'update' event, so that loading member
    // features will update geometry
    this.memberObjects().forEach(
      (member, index) => {
        if (!(member.ob.properties & OverpassFrontend.GEOM)) {
          const updFun = member => {
            feature.clearLayers()
            feature.addData(this.geometry)
            feature.setStyle(options)
          }

          member.ob.once('update', updFun)
        }
      }
    )

    return feature
  }

  GeoJSON () {
    const ret = {
      type: 'Feature',
      id: this.type + '/' + this.osm_id,
      properties: this.GeoJSONProperties()
    }

    if (this.members) {
      if (this.geometry.features.length === 1) {
        ret.geometry = this.geometry.features[0].geometry
      } else {
        ret.geometry = {
          type: 'GeometryCollection',
          geometries: this.memberObjects()
            .map(member => member.ob.GeoJSON().geometry) // .geometry may be undefined
            .filter(member => member)
            .filter(member => member.type !== 'GeometryCollection' || member.geometries.length)
        }
      }
    }

    return ret
  }

  exportOSMXML (options, parentNode, callback) {
    const cacheOptions = {}
    if (this.data.timestamp) {
      cacheOptions.date = this.data.timestamp
    }

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
              const memberOb = this.overpass.cache.get(member.id, cacheOptions)

              const nd = parentNode.ownerDocument.createElement('member')
              nd.setAttribute('ref', memberOb.osm_id)
              nd.setAttribute('type', memberOb.type)
              nd.setAttribute('role', member.role)
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
    const cacheOptions = {}
    if (this.data.timestamp) {
      cacheOptions.date = this.data.timestamp
    }

    super.exportOSMJSON(conf, elements,
      (err, result) => {
        if (err) {
          return callback(err)
        }

        if (!result) { // already included
          return callback(null)
        }

        if (this.members) {
          result.members = []

          async.each(this.members,
            (member, done) => {
              const memberOb = this.overpass.cache.get(member.id, cacheOptions)

              result.members.push({
                ref: memberOb.osm_id,
                type: memberOb.type,
                role: member.role
              })

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

  intersects (bbox) {
    const cacheOptions = {}
    if (this.data.timestamp) {
      cacheOptions.date = this.data.timestamp
    }

    const result = super.intersects(bbox)

    if (result === 0 || result === 2) {
      return result
    }

    let i

    if (this.geometry) {
      let geometry = this.geometry
      let bboxShifted = bbox.toGeoJSON ? bbox.toGeoJSON() : bbox
      if (this.bounds && this.bounds.minlon > this.bounds.maxlon) {
        geometry = geojsonShiftWorld(geometry, [360, 0])
        bboxShifted = geojsonShiftWorld(bboxShifted, [360, 0])
      }

      if (turf.booleanIntersects(geometry, bboxShifted)) {
        return 2
      }

      // if there's a relation member (where Overpass does not return the
      // geometry) we can't know if the geometry intersects -> return 1
      for (i = 0; i < this.data.members.length; i++) {
        if (this.data.members[i].type === 'relation') {
          return 1
        }
      }

      // if there's no relation member and the geometry is complete we can be sure there's no intersection
      return this.properties & OverpassFrontend.GEOM ? 0 : 1
    } else if (this.members) {
      for (i in this.members) {
        const memberId = this.members[i].id
        const member = this.overpass.cache.get(memberId, cacheOptions)

        if (member) {
          if (member.intersects(bbox) === 2) {
            return 2
          }
        }
      }
    }

    return 1
  }
}

module.exports = OverpassRelation
