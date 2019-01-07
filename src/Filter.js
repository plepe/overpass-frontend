function qlesc (str) {
  return '"' + str.replace(/"/g, '\\"') + '"'
}

function compile (part) {
  let keyRegexp = (part.keyRegexp ? '~' : '')

  switch (part.op) {
    case 'has_key':
      if (keyRegexp) {
        return '[~' + qlesc(part.key) + '~"."]'
      } else {
        return '[' + keyRegexp + qlesc(part.key) + ']'
      }
    case '=':
    case '!=':
    case '~':
    case '!~':
      return '[' + keyRegexp + qlesc(part.key) + part.op + qlesc(part.value) + ']'
    case 'has':
      return '[' + keyRegexp + qlesc(part.key) + '~' + qlesc('^(.*;|)' + part.value + '(|;.*)$') + ']'
  }
}

function test (ob, part) {
  if (part.type) {
    return ob.type === part.type
  }

  if (part.keyRegexp) {
    for (let k in ob.tags) {
      if (k.match(part.key)) {
        if (part.value) {
          return ob.tags[k].match(part.value)
        }

        return true
      }
    }
    return false
  }

  switch (part.op) {
    case 'has_key':
      return ob.tags && (part.key in ob.tags)
    case '=':
      return ob.tags && (part.key in ob.tags) && (ob.tags[part.key] === part.value)
    case '!=':
      return ob.tags && (part.key in ob.tags) && (ob.tags[part.key] !== part.value)
    case '~':
      return ob.tags && (part.key in ob.tags) && (ob.tags[part.key].match(part.value))
    case '!~':
      return ob.tags && (part.key in ob.tags) && (!ob.tags[part.key].match(part.value))
    case 'has':
      return ob.tags && (part.key in ob.tags) && (ob.tags[part.key].split(/;/).indexOf(part.value) !== -1)
    default:
      return false
  }
}

function parseString (str) {
  let result = ''
  let chr = str[0]
  str = str.slice(1)

  while (str.length) {
    let m = str.match('^[^\\\\' + chr + ']+')
    if (m) {
      result += m[0]
      str = str.slice(m[0].length)
    } else if (str[0] === '\\') {
      result += str[1]
      str = str.slice(2)
    } else if (str[0] === chr) {
      str = str.slice(1)
      return [ result, str ]
    } else {
      throw new Error("Can't parse string from query: " + str)
    }
  }
}

function parse (def) {
  let result = []

  let mode = 0
  let key
  let value
  let op
  let m
  let keyRegexp = false
  while (def.length) {
    if (mode === 0) {
      m = def.match(/^\s*(node|way|relation|rel|nwr|\()/)
      if (m && m[1] === '(') {
        def = def.slice(m[0].length)
        let parts = []

        do {
          let part

          [ part, def ] = parse(def)
          parts.push(part)
        } while (!def.match(/^\s*\)/))

        return [ { or: parts }, def ]
      } else if (m) {
        if (m[1] === 'rel') {
          result.push({ type: 'relation' })
        } else if (m[1] === 'nwr') {
            // nothing
        } else {
          result.push({ type: m[1] })
        }
        mode = 10
        def = def.slice(m[0].length)
      } else {
        throw new Error("Can't parse query, expected type of object (e.g. 'node'): " + def)
      }
    } else if (mode === 10) {
      let m = def.match(/^\s*(\[|;)/)
      if (m && m[1] === '[') {
        def = def.slice(m[0].length)
        mode = 11
      } else if (m && m[1] === ';') {
        def = def.slice(m[0].length)
        return [ result, def ]
      } else if (!m && def.match(/^\s*$/)) {
        return [ result, '' ]
      } else {
        throw new Error("Can't parse query, expected '[' or ';': " + def)
      }
    } else if (mode === 11) {
      m = def.match(/^(\s*)(~\s*)?([a-zA-Z0-9_]+|"|')/)
      if (m && m[2]) {
        keyRegexp = true
      }
      if (m && (m[3] === '"' || m[3] === "'")) {
        def = def.slice(m[1].length + (m[2] || '').length)
        let x = parseString(def)
        key = x[0]
        def = x[1]
        mode = 12
      } else if (m) {
        key = m[3]
        def = def.slice(m[0].length)
        mode = 12
      } else {
        throw new Error("Can't parse query, expected key: " + def)
      }
    } else if (mode === 12) {
      m = def.match(/^\s*(=|!=|~|!~|\^|])/)
      if (m && m[1] === ']') {
        let entry = { key, op: 'has_key' }
        if (keyRegexp) {
          entry.keyRegexp = true
        }
        result.push(entry)
        def = def.slice(m[0].length)
        mode = 10
      } else if (m) {
        op = m[1] === '^' ? 'has' : m[1]
        mode = 13
        def = def.slice(m[0].length)
      } else {
        throw new Error("Can't parse query, expected operator or ']': " + def)
      }
    } else if (mode === 13) {
      m = def.match(/^(\s*)([a-zA-Z0-9_]+|"|')/)
      if (m && (m[2] === '"' || m[2] === "'")) {
        def = def.slice(m[1].length)
        let x = parseString(def)
        value = x[0]
        def = x[1]
        mode = 14
      } else if (m) {
        value = m[2]
        def = def.slice(m[0].length)
        mode = 14
      } else {
        throw new Error("Can't parse query, expected value: " + def)
      }
    } else if (mode === 14) {
      m = def.match(/^\s*\]/)
      if (m) {
        let entry = { key, op, value }
        if (keyRegexp) {
          entry.keyRegexp = true
        }
        result.push(entry)
        mode = 10
        def = def.slice(m[0].length)
      } else {
        throw new Error("Can't parse query, expected ']': " + def)
      }
    }
  }

  return [ result, def ]
}

/**
 * A Filter into OSM data. A simplified version of <a href='https://wiki.openstreetmap.org/wiki/Overpass_API/Overpass_QL'>Overpass QL</a>.
 *
 * <p>Either a single query (e.g. <tt>node[amenity=restaurant];</tt>) or a combined query (e.g. <tt>(node[amenity=restaurant];way[amenity=restaurant];);</tt>).<br>
 * A single query statement consists of a type (e.g. 'node', 'way', 'relation', 'nwr' (node, way or relation)) and optional filters:<ul>
 * <li>(Not) Equals (=, !=): <tt>[amenity=restaurant]</tt> or <tt>["amenity"="restaurant"]</tt> resp. <tt>["amenity"!="restaurant"]</tt>.
 * <li>Regular Expression: <tt>[amenity~"^(restaurant|cafe)$"]</tt> resp. negated: <tt>[amenity!~"^(restaurant|cafe)$"]</tt>
 * <li>Key regular expression: <tt>[~"cycleway"~"left"]</tt> (key has to match cycleway and its value match left)
 * <li>Key (not) exists: <tt>[amenity]</tt> or <tt>["amenity"]</tt> resp. <tt>[!amenity]</tt>
 * </ul>
 * More advanced queries are not supported.</p>
 *
 * @param {string|object} query
 */
class Filter {
  constructor (def) {
    if (typeof def === 'string') {
      [ this.def ] = parse(def)
      return
    }

    this.def = def
  }

  /**
   * Check if an object matches this filter
   * @param {OverpassNode|OverpassWay|OverpassRelation} ob an object from Overpass API
   * @return {boolean}
   */
  match (ob, def) {
    if (!def) {
      def = this.def
    }

    if (def.or) {
      return def.or.some(part => this.match(ob, part))
    }

    if (def.and) {
      return def.and.every(part => this.match(ob, part))
    }

    return def.filter(test.bind(this, ob)).length === def.length
  }

  /**
   * Convert query to a string representation
   * @return {string}
   */
  toString (options = {}, def = null) {
    let result = ''

    if (!def) {
      def = this.def
      this.sets = []
    }

    if (def.or) {
      return '(' + def.or.map(part => this.toString(options, part)).join(';') + ';)' +
      (options.outputSet ? '->' + options.outputSet : '')
    }

    if (def.and) {
      let set = '.a' + this.sets.length

      return def.and.map(
        (part, index) => {
          let o = JSON.parse(JSON.stringify(options))
          if (index !== 0) {
            o.inputSet = set
          }
          if (index !== def.and.length - 1) {
            o.outputSet = set
          }

          return this.toString(o, part)
        }
      ).join(';')
    }

    let parts = def.filter(part => part.type)

    switch (parts.length) {
      case 0:
        result = 'nwr'
        break
      case 1:
        result = parts[0].type
        break
      default:
        throw new Error('Filter: only one type query allowed!')
    }

    if (options.inputSet) {
      result += options.inputSet
    }

    result += def
      .filter(part => !part.type)
      .map(compile).join('') +
    (options.outputSet ? '->' + options.outputSet : '')

    return result
  }

  /**
   * Convert query to Overpass QL
   * @param {object} [options] Additional options
   * @param {string} [options.inputSet=''] Specify input set (e.g.'.foo').
   * @return {string}
   */
  toQl (options = {}, def) {
    if (!def) {
      def = this.def
      this.sets = []
    }

    if (!options.inputSet) {
      options.inputSet = ''
    }

    if (def.or) {
      return '(' + def.or.map(part => {
        let r = this.toQl(options, part)
        return r.slice(1, -1)
      }).join('') + ')' +
      (options.outputSet ? '->' + options.outputSet : '')
    }

    if (def.and) {
      let set = '.a' + this.sets.length

      return def.and.map(
        (part, index) => {
          let o = JSON.parse(JSON.stringify(options))
          if (index !== 0) {
            o.inputSet = set
          }
          if (index !== def.and.length - 1) {
            o.outputSet = set
          }
          return this.toQl(o, part)
        }
      ).join(';')
    }

    let parts = def.filter(part => part.type)
    let types

    switch (parts.length) {
      case 0:
        types = [ 'node', 'way', 'relation' ]
        break
      case 1:
        types = [ parts[0].type ]
        break
      default:
        throw new Error('Filter: only one type query allowed!')
    }

    let filters = def.filter(part => !part.type)

    return '(' + types.map(type => type + options.inputSet + filters.map(compile).join('')).join(';') + ';)' + (options.outputSet ? '->' + options.outputSet : '')
  }

  /**
   * Convert query to LokiJS query for local database. If the property 'needMatch' is set on the returned object, an additional match() should be executed for each returned object, as the query can't be fully compiled (and the 'needMatch' property removed).
   * @param {object} [options] Additional options
   * @return {object}
   */
  toLokijs (options = {}, def) {
    if (!def) {
      def = this.def
    }

    if (def.or) {
      let needMatch = false

      let r = { $or:
        def.or.map(part => {
          let r = this.toLokijs(options, part)
          if (r.needMatch) {
            needMatch = true
          }
          delete r.needMatch
          return r
        })
      }

      if (needMatch) {
        r.needMatch = true
      }

      return r
    }

    if (def.and) {
      let needMatch = false

      let r = { $and:
        def.and.map(part => {
          let r = this.toLokijs(options, part)
          if (r.needMatch) {
            needMatch = true
          }
          delete r.needMatch
          return r
        })
      }

      if (needMatch) {
        r.needMatch = true
      }

      return r
    }

    let query = {}

    def.forEach(filter => {
      let k, v
      if (filter.keyRegexp) {
        k = 'needMatch'
        v = true
        // can't query for key regexp, skip
      } else if (filter.op === '=') {
        k = 'tags.' + filter.key
        v = { $eq: filter.value }
      } else if (filter.op === '!=') {
        k = 'tags.' + filter.key
        v = { $ne: filter.value }
      } else if (filter.op === 'has_key') {
        k = 'tags.' + filter.key
        v = { $exists: true }
      } else if (filter.op === 'has') {
        k = 'tags.' + filter.key
        v = { $regex: '^(.*;|)' + filter.value + '(|;.*)$' }
      } else if (filter.op === '~') {
        k = 'tags.' + filter.key
        v = { $regex: filter.value }
      } else if (filter.op === '!~') {
        k = 'tags.' + filter.key
        v = { $not: { $regex: filter.value } }
      } else if (filter.type) {
        k = 'type'
        v = { $eq: filter.type }
      } else {
        console.log('unknown filter', filter)
      }

      if (k && v) {
        if (k === 'needMatch') {
          query.needMatch = true
        } else if (k in query) {
          if (!('$and' in query[k])) {
            query[k] = { $and: [ query[k] ] }
          }
          query[k].$and.push(v)
        } else {
          query[k] = v
        }
      }
    })

    return query
  }
}

module.exports = Filter
