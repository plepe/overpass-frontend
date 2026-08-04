/* global L:false */

const async = require('async')
const BoundingBox = require('boundingbox')
const osmtogeojson = require('osmtogeojson')
const geojson2elements = require('./geojson2elements')
const OverpassObject = require('./OverpassObject')
const GeowikiAPI = require('./defines')
const geojsonShiftWorld = require('./geojsonShiftWorld')
const turf = require('./turf')

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
      this.properties |= GeowikiAPI.BBOX | GeowikiAPI.CENTER
    }

    if (data.center) {
      this.center = data.center
      this.properties |= GeowikiAPI.CENTER
    }

    // DB may save the geometry in 'geometry' if the member's
    // geometries can not be re-constructed (e.g. merge lines of multipolygons)
    if (data.geometry) {
      if (data.geometry.type) {
        // is this GeoJSON?
        this.databaseGeometry = data.geometry
      } else {
        // no, it is OSMJSON with separated geometry
        const object = {
          id: this.osm_id,
          type: 'relation',
          tags: this.tags,
          members: data.geometry
        }

        let fakeId = 1
        data.geometry.forEach(geom => {
          if (!geom.ref) {
            geom.ref = fakeId++
          }
          if (!geom.role && this.tags.type === 'multipolygon') {
            geom.role = 'outer'
          }
        })

        this.databaseGeometry = osmtogeojson({ elements: [object] }).features[0]
      }

      this.properties |= GeowikiAPI.GEOM

      // dataset with separated geometries detected -> switch output to 'separateGeometry' mode
      this.overpass.options.separateGeometry = true
    }

    if (data.members) {
      this.members = []
      this.properties |= GeowikiAPI.MEMBERS

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

          const ob = JSON.parse(JSON.stringify(member))
          ob.id = ob.ref
          delete ob.ref
          delete ob.role
          let memberProperties = GeowikiAPI.ID_ONLY

          if ((member.type === 'node' && 'lat' in member) ||
              (member.type === 'way' && 'geometry' in member)) {
            memberProperties |= GeowikiAPI.GEOM
          }

          const memberOb = this.overpass.createOrUpdateOSMObject(ob, { properties: memberProperties })

          // call notifyMemberOf only once per member
          if (!membersKnown) {
            memberOb.notifyMemberOf(this, member.role, sequence)
          }

          return memberOb
        }
      )

      this.updateGeometry()
    }
  }

  updateGeometry () {
    if (!this.members) {
      return
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

        if (!(member.id in this.overpass.cacheElements)) {
          allKnown = false
          return data
        }

        const ob = this.overpass.cacheElements[member.id]

        if ((ob.properties & GeowikiAPI.GEOM) === 0) {
          allKnown = false
        }

        if (ob.type === 'node') {
          if (ob.geometry) {
            data.lat = ob.geometry.lat
            data.lon = ob.geometry.lon
          }

          if (data.lat === undefined) {
            return undefined
          }
        } else if (ob.type === 'way') {
          data.geometry = ob.geometry

          if (!data.geometry || !data.geometry.length) {
            return undefined
          }
        }

        return data
      }).filter(d => d)
    }]

    this.geometry = osmtogeojson({ elements })
    if (allKnown) {
      this.properties = this.properties | GeowikiAPI.GEOM
    }

    this.members.forEach(
      (member, index) => {
        if (member.type !== 'way') {
          return
        }

        const memberOb = this.overpass.cacheElements[member.id]
        if (!memberOb.members || member.type !== 'way') {
          return
        }

        const firstMemberId = memberOb.members[0].id
        const lastMemberId = memberOb.members[memberOb.members.length - 1].id
        const revMemberOf = memberOb.memberOf.filter(memberOf => memberOf.sequence === index && memberOf.id === this.id)[0]

        if (index > 0) {
          const prevMember = this.overpass.cacheElements[this.members[index - 1].id]
          if (prevMember.type === 'way' && prevMember.members) {
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
          const nextMember = this.overpass.cacheElements[this.members[index + 1].id]
          if (nextMember.type === 'way' && nextMember.members) {
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

    if (!(this.properties & GeowikiAPI.BBOX)) {
      this.members.forEach(member => {
        const ob = this.overpass.cacheElements[member.id]
        if (ob.bounds) {
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
        this.properties = this.properties | GeowikiAPI.BBOX | GeowikiAPI.CENTER
      }
    }

    if (!allKnown && this.databaseGeometry) {
      this.geometry = this.databaseGeometry

      if (!this.bounds) {
        this.bounds = new BoundingBox(this.geometry)
      }

      if (!this.center) {
        this.center = this.bounds.getCenter()
      }

      this.properties = this.properties | GeowikiAPI.BBOX | GeowikiAPI.CENTER
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
   * @return {null|string} [role] only return members with the specified role (null -> all members)
   * @return {string[]}
   */
  memberIds (role = null) {
    if (typeof this.data.members === 'undefined') {
      return null
    }

    const result = []
    for (let i = 0; i < this.data.members.length; i++) {
      const member = this.data.members[i]

      if (role === null || member.role === role) {
        result.push(member.type.substr(0, 1) + member.ref)
      }
    }

    return result
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
    this.memberFeatures.forEach(
      (member, index) => {
        if (!(member.properties & GeowikiAPI.GEOM)) {
          const updFun = member => {
            feature.clearLayers()
            feature.addData(this.geometry)
            feature.setStyle(options)
          }

          member.once('update', updFun)
        }
      }
    )

    return feature
  }

  GeoJSON (options = { meta: true, geom: true }) {
    const ret = super.GeoJSON(options)

    if (options.bb && this.bounds) {
      ret.bbox = [this.bounds.minlon, this.bounds.minlat, this.bounds.maxlon, this.bounds.maxlat]
    }

    if (options.center && this.bounds) {
      ret.geometry = {
        type: 'Point',
        coordinates: [
          parseFloat(this.center.lon.toFixed(7)),
          parseFloat(this.center.lat.toFixed(7))
        ]
      }
    }

    if (options.geom && this.members) {
      if (this.geometry.features.length === 1) {
        ret.geometry = this.geometry.features[0].geometry
      } else {
        ret.geometry = {
          type: 'GeometryCollection',
          geometries: this.memberFeatures
            .map(member => member.GeoJSON().geometry) // .geometry may be undefined
            .filter(member => member)
            .filter(member => member.type !== 'GeometryCollection' || member.geometries.length)
        }
      }
    } else if (options.geom && this.geometry) {
      // TODO
    }

    if (this.members && ((!options.ids && !options.tags) || options.body || options.skel)) {
      ret.properties['@members'] = this.members.map(m => {
        return { type: m.type, ref: m.ref, role: m.role }
      })
    }

    return ret
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
              const memberOb = this.overpass.cacheElements[member.id]

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
      return this.properties & GeowikiAPI.GEOM ? 0 : 1
    } else if (this.members) {
      for (i in this.members) {
        const memberId = this.members[i].id
        const member = this.overpass.cacheElements[memberId]

        if (member) {
          if (member.intersects(bbox) === 2) {
            return 2
          }
        }
      }
    }

    return 1
  }

  outJson (options) {
    const result = super.outJson(options)

    if ((options.bb || options.geom) && this.bounds) {
      result.bounds = { ...this.bounds }
    }

    if (options.center && this.bounds) {
      result.center = this.bounds.getCenter()
    }

    if (this.members && ((!options.ids && !options.tags) || options.body || options.skel)) {
      result.members = this.members.map(member => {
        return {
          ref: member.ref,
          type: member.type,
          role: member.role
        }
      })
    }

    if ((options.geom && !options.separateGeometry) && ((!options.ids && !options.tags) || options.body || options.skel)) {
      this.members.forEach((member, i) => {
        if (member.type === 'node') {
          if (this.memberFeatures[i].geometry) {
            result.members[i].lat = this.memberFeatures[i].geometry.lat
            result.members[i].lon = this.memberFeatures[i].geometry.lon
          }
        } else if (member.type === 'way') {
          if (this.memberFeatures[i].geometry && this.memberFeatures[i].geometry.length) {
            result.members[i].geometry = this.memberFeatures[i].geometry
          } else {
            result.members[i].geometry = []
          }
        }
      })
    }

    if ((options.geom && options.separateGeometry) && ((!options.ids && !options.tags) || options.body || options.skel)) {
      if (this.geometry) {
        result.geometry = geometryFromGeoJSON(this.geometry)
      } else {
        result.geometry = {}
      }
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

    if (this.members && ((!options.ids && !options.tags) || options.body || options.skel)) {
      this.members.forEach((member, i) => {
        const blank = document.createTextNode('\n  ')
        result.appendChild(blank)

        const node = document.createElement('member')
        node.setAttribute('type', member.type)
        node.setAttribute('ref', member.ref)
        node.setAttribute('role', member.role)

        if (options.geom && this.geometry && !options.separateGeometry) {
          xmlAddGeometry(node, member, this.memberFeatures[i])
        }

        result.appendChild(node)
      })
    }

    if (options.geom && this.geometry && options.separateGeometry) {
      const geometry = geometryFromGeoJSON(this.geometry)

      geometry.forEach((member, i) => {
        const blank = document.createTextNode('\n  ')
        result.appendChild(blank)

        const node = document.createElement('geometry')
        node.setAttribute('type', member.type)
        if (member.role) {
          node.setAttribute('role', member.role)
        }

        xmlAddGeometry(node, member, member)
        result.appendChild(node)
      })
    }
  }
}

function geometryFromGeoJSON (geometry) {
  const elements = []
  geojson2elements(geometry, elements, {})
  let result = []

  elements.forEach(el => {
    if (el.type === 'relation') {
      el.members.forEach(m => {
        delete m.ref
      })
      result = result.concat(el.members)
    } else {
      delete el.id
      delete el.tags
      result.push(el)
    }
  })

  return result
}

function xmlAddGeometry (node, member, memberFeature) {
  const document = node.ownerDocument
  let found = false

  if (member.type === 'node') {
    if (memberFeature.geometry) {
      node.setAttribute('lat', memberFeature.geometry.lat.toFixed(7))
      node.setAttribute('lon', memberFeature.geometry.lon.toFixed(7))
      found = true
    }
  } else if (member.type === 'way' && memberFeature.geometry) {
    memberFeature.geometry.forEach(g => {
      const blank = document.createTextNode('\n    ')
      node.appendChild(blank)

      const nd = document.createElement('nd')
      nd.setAttribute('lat', g.lat.toFixed(7))
      nd.setAttribute('lon', g.lon.toFixed(7))
      node.appendChild(nd)
    })

    if (memberFeature.geometry.length) {
      const blank = document.createTextNode('\n  ')
      node.appendChild(blank)
    }

    found = true
  }

  return found
}

module.exports = OverpassRelation
