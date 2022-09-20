module.exports = {
  parse (str) {
    return str.split(/,/g).map(v => parseInt(v))
  },

  test (value, ob) {
    return value.includes(ob.osm_id)
  },

  compileQL (value) {
    return '(id:' + value.join(',') + ')'
  },

  compileLokiJS (value) {
    if (value.length === 1) {
      return [ 'osm_id', { $eq: value[0] } ]
    } else {
      return [ 'osm_id', { $in: value } ]
    }
  },

  cacheInfo (options, value) {
    if (options.ids) {
      value = options.ids.filter(n => value.includes(n))
    }

    options.ids = value.sort()
  },

  isSupersetOf (value, otherValue) {
    return !otherValue.filter(id => !value.includes(id)).length
  }
}
