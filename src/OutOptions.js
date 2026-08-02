const OverpassFrontend = require('./defines')

const outParams = {
  ids: OverpassFrontend.ID_ONLY,
  skel: OverpassFrontend.MEMBERS,
  body: OverpassFrontend.MEMBERS | OverpassFrontend.TAGS,
  tags: OverpassFrontend.TAGS,
  meta: OverpassFrontend.MEMBERS | OverpassFrontend.TAGS | OverpassFrontend.META,
  geom: OverpassFrontend.GEOM | OverpassFrontend.MEMBERS | OverpassFrontend.TAGS,
  bb: OverpassFrontend.BBOX | OverpassFrontend.TAGS | OverpassFrontend.MEMBERS,
  center: OverpassFrontend.CENTER | OverpassFrontend.TAGS | OverpassFrontend.MEMBERS
}
const outOtherParams = {
  asc: 0, // TODO
  qt: 0, // TODO
  count: 0,
  noids: 0
}

module.exports = class OutOptions {
  /**
   * @param {string|string[]} value A value, e.g. 'body tags geom'
   */
  constructor (value, overpass) {
    if (typeof value === 'string') {
      value = value.split(' ')
    }
    this.def = { out: value }
    this.overpass = overpass
  }

  /**
   * @returns {object} returns the selected options as hash array with true as value, e.g. {body: true, tags: true, geom: true}
   */
  outOptions () {
    const result = {}
    let hasParams = false

    this.def.out.forEach(outParam => {
      if (outParam in outParams) {
        result[outParam] = true
        hasParams = true
      } else if (outParam.match(/^[0-9]+$/)) {
        ; // ignore
      } else if (outParam in outOtherParams) {
        result[outParam] = true
      } else {
        throw new Error('Invalid parameter for print: "' + outParam + '"')
      }
    })

    if (result.count) {
      result.ids = true
      hasParams = true
    }

    if (!hasParams) {
      result.body = true
    }

    return result
  }

  /**
   * @returns {Number} the required properties, e.g. 12 (GeowikiAPI.TAGS|GeowikiAPI.MEMBERS|GeowikiAPI.GEOM)
   */
  properties () {
    let result = 0
    let hasParams = false
    const otherParams = {}

    this.def.out.forEach(outParam => {
      if (outParam in outParams) {
        result |= outParams[outParam]
        hasParams = true
      } else if (outParam.match(/^[0-9]+$/)) {
        ; // ignore
      } else if (outParam in outOtherParams) {
        otherParams[outParam] = true
      } else {
        throw new Error('Invalid parameter for print: "' + outParam + '"')
      }
    })

    if (otherParams.count) {
      result |= OverpassFrontend.ID_ONLY
      hasParams = true
    }

    if (!hasParams) {
      result = OverpassFrontend.MEMBERS | OverpassFrontend.TAGS
    }

    return result
  }
}
