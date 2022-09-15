const strsearch2regexp = require('strsearch2regexp')
const filterJoin = require('./filterJoin')

function qlesc (str) {
  return '"' + str.replace(/"/g, '\\"') + '"'
}

function compile (part) {
  if (Array.isArray(part)) {
    return part.map(compile).join('')
  }

  if (part.or) {
    return { or: part.or.map(compile) }
  }

  const keyRegexp = (part.keyRegexp ? '~' : '')

  switch (part.op) {
    case 'has_key':
      if (part.keyRegexp === 'i') {
        return '[~' + qlesc(part.key) + '~".",i]'
      } else if (keyRegexp) {
        return '[~' + qlesc(part.key) + '~"."]'
      } else {
        return '[' + keyRegexp + qlesc(part.key) + ']'
      }
    case 'not_exists':
      return '[!' + qlesc(part.key) + ']'
    case '=':
    case '!=':
    case '~':
    case '!~':
      return '[' + keyRegexp + qlesc(part.key) + part.op + qlesc(part.value) + ']'
    case '~i':
    case '!~i':
      return '[' + keyRegexp + qlesc(part.key) + part.op.substr(0, part.op.length - 1) + qlesc(part.value) + ',i]'
    case 'has':
      return '[' + keyRegexp + qlesc(part.key) + '~' + qlesc('^(.*;|)' + part.value + '(|;.*)$') + ']'
    case 'strsearch':
      return '[' + keyRegexp + qlesc(part.key) + '~' + qlesc(strsearch2regexp(part.value)) + ',i]'
    default:
      throw new Error('unknown operator')
  }
}

function test (ob, part) {
  if (Array.isArray(part)) {
    return part.every(part => test(ob, part))
  }

  if (part.type) {
    return ob.type === part.type
  }

  if (part.or) {
    return part.or.some(part => test(ob, part))
  }

  if (part.and) {
    return part.and.every(part => test(ob, part))
  }

  if (part.keyRegexp) {
    let regex
    if (part.value) {
      regex = new RegExp(part.value, part.op.match(/i$/) ? 'i' : '')
    }

    const keyRegex = new RegExp(part.key, part.keyRegexp === 'i' ? 'i' : '')

    for (const k in ob.tags) {
      if (k.match(keyRegex)) {
        if (regex) {
          if (ob.tags[k].match(regex)) {
            return true
          }
        } else {
          return true
        }
      }
    }
    return false
  }

  switch (part.op) {
    case 'has_key':
      return ob.tags && (part.key in ob.tags)
    case 'not_exists':
      return ob.tags && (!(part.key in ob.tags))
    case '=':
      return ob.tags && (part.key in ob.tags) && (ob.tags[part.key] === part.value)
    case '!=':
      return ob.tags && (!(part.key in ob.tags) || (ob.tags[part.key] !== part.value))
    case '~':
      return ob.tags && (part.key in ob.tags) && (ob.tags[part.key].match(part.value))
    case '!~':
      return ob.tags && (!(part.key in ob.tags) || (!ob.tags[part.key].match(part.value)))
    case '~i':
      return ob.tags && (part.key in ob.tags) && (ob.tags[part.key].match(new RegExp(part.value, 'i')))
    case '!~i':
      return ob.tags && (!(part.key in ob.tags) || !ob.tags[part.key].match(new RegExp(part.value, 'i')))
    case 'has':
      return ob.tags && (part.key in ob.tags) && (ob.tags[part.key].split(/;/).indexOf(part.value) !== -1)
    case 'strsearch':
      return ob.tags && (part.key in ob.tags) && (ob.tags[part.key].match(new RegExp(strsearch2regexp(part.value), 'i')))
    default:
      console.log('match: unknown operator in filter', part)
      return false
  }
}

function parseString (str) {
  let result = ''
  const chr = str[0]
  str = str.slice(1)

  while (str.length) {
    const m = str.match('^[^\\\\' + chr + ']+')
    if (m) {
      result += m[0]
      str = str.slice(m[0].length)
    } else if (str[0] === '\\') {
      result += str[1]
      str = str.slice(2)
    } else if (str[0] === chr) {
      str = str.slice(1)
      return [result, str]
    } else {
      throw new Error("Can't parse string from query: " + str)
    }
  }
}

function parse (def, rek = 0) {
  const script = []
  let current = []

  let mode = 0
  let key
  let value
  let op
  let m
  let keyRegexp = false
  let notExists = null
  while (def.length) {
    if (mode === 0) {
      keyRegexp = false
      m = def.match(/^\s*(node|way|relation|rel|nwr|\()/)
      if (m && m[1] === '(') {
        def = def.slice(m[0].length)

        let parts
        [parts, def] = parse(def, rek + 1)
        mode = 1

        script.push({ or: parts })
        current = []
      } else if (m) {
        if (m[1] === 'rel') {
          current.push({ type: 'relation' })
        } else if (m[1] === 'nwr') {
          // nothing
        } else {
          current.push({ type: m[1] })
        }
        mode = 10
        def = def.slice(m[0].length)
      } else {
        throw new Error("Can't parse query, expected type of object (e.g. 'node'): " + def)
      }
    } else if (mode === 1) {
      m = def.match(/^\s*\);?/)
      if (m) {
        def = def.slice(m[0].length)
        return [rek === 0 && script.length === 1 ? script[0] : script, def]
      } else {
        mode = 0
      }
    } else if (mode === 10) {
      const m = def.match(/^\s*(\[|;)/)
      if (m && m[1] === '[') {
        def = def.slice(m[0].length)
        mode = 11
      } else if (m && m[1] === ';') {
        def = def.slice(m[0].length)
        script.push(current)
        current = []
        mode = 1
      } else if (!m && def.match(/^\s*$/)) {
        if (current.length) {
          script.push(current)
        }
        return [rek === 0 && script.length === 1 ? script[0] : script, '']
      } else {
        throw new Error("Can't parse query, expected '[' or ';': " + def)
      }
    } else if (mode === 11) {
      m = def.match(/^(\s*)(([~!])\s*)?([a-zA-Z0-9_]+|"|')/)
      if (m && m[2]) {
        if (m[3] === '~') {
          keyRegexp = true
        } else if (m[3] === '!') {
          notExists = true
        }
      }
      if (m && (m[4] === '"' || m[4] === "'")) {
        def = def.slice(m[1].length + (m[2] || '').length)
        const x = parseString(def)
        key = x[0]
        def = x[1]
        mode = 12
      } else if (m) {
        key = m[4]
        def = def.slice(m[0].length)
        mode = 12
      } else {
        throw new Error("Can't parse query, expected key: " + def)
      }
    } else if (mode === 12) {
      m = def.match(/^\s*(=|!=|~|!~|\^|]|%)/)
      if (m && m[1] === ']') {
        const entry = { key, op: 'has_key' }
        if (keyRegexp) {
          entry.keyRegexp = true
        }
        if (notExists) {
          entry.op = 'not_exists'
        }
        current.push(entry)
        def = def.slice(m[0].length)
        mode = 10
      } else if (m) {
        if (notExists) {
          throw new Error("Can't parse query, expected ']': " + def)
        }

        op = m[1] === '^' ? 'has' : m[1] === '%' ? 'strsearch' : m[1]
        mode = 13
        def = def.slice(m[0].length)
      } else {
        throw new Error("Can't parse query, expected operator or ']': " + def)
      }
    } else if (mode === 13) {
      m = def.match(/^(\s*)([a-zA-Z0-9_]+|"|')/)
      if (m && (m[2] === '"' || m[2] === "'")) {
        def = def.slice(m[1].length)
        const x = parseString(def)
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
      m = def.match(/^\s*(,i)?\]/)
      if (m) {
        if (m[1] === ',i') {
          if (op === '~' || op === '!~') {
            op += 'i'
          } else {
            throw new Error("Can't parse query, expected ']': " + def)
          }
        }

        const entry = { key, op }
        if (value === '.') {
          entry.op = 'has_key'
        } else {
          entry.value = value
        }

        if (keyRegexp) {
          entry.keyRegexp = op.match(/^!?~i$/) ? 'i' : true
        }
        current.push(entry)
        mode = 10
        def = def.slice(m[0].length)
      } else {
        throw new Error("Can't parse query, expected ']': " + def)
      }
    }
  }

  if (current.length) {
    script.push(current)
  }

  return [rek === 0 && script.length === 1 ? script[0] : script, def]
}

function check (def) {
  if (typeof def === 'string') {
    return parse(def)[0]
  }
  if (def.and) {
    def.and = def.and.map(p => check(p))
  }
  if (def.or) {
    def.or = def.or.map(p => check(p))
  }

  return def
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
 * <li>Array search: <tt>[cuisine^kebap]</tt>: search for cuisine tags which exactly include 'kebap' (semicolon-separated values, e.g. <tt>cuisine=kebap;pizza</tt>).
 * <li>String search: <tt>[name%cafe]</tt>: search for name tags which are similar to cafe, e.g. "café". (see https://github.com/plepe/strsearch2regexp for details).
 * </ul>
 * More advanced queries are not supported.</p>
 *
 * @param {string|object} query
 */
class Filter {
  uniqId () {
    this._uniqId = (this._uniqId || 0) + 1
    return this._uniqId
  }

  constructor (def) {
    this.def = check(def)
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

    if (Array.isArray(def) && Array.isArray(def[0])) {
      // script with several statements detected. only use the last one, as previous statements
      // can't have an effect on the last statement yet.
      def = def[def.length - 1]
    }

    if (def.or) {
      return def.or.some(part => this.match(ob, part))
    }

    if (def.and) {
      return def.and.every(test.bind(this, ob))
    }

    return def.filter(test.bind(this, ob)).length === def.length
  }

  /**
   * Convert query to a string representation
   * @return {string}
   */
  toString (def) {
    return this.toQl({}, def)
  }

  /**
   * Convert query to Overpass QL
   * @param {object} [options] Additional options
   * @param {string} [options.inputSet=''] Specify input set (e.g.'.foo').
   * @param {string} [options.outputSet=''] Specify output set (e.g.'.foo').
   * @return {string}
   */
  toQl (options = {}, def) {
    if (!def) {
      def = this.def
    }

    if (!options.inputSet) {
      options.inputSet = ''
    }

    if (!options.outputSet) {
      options.outputSet = ''
    }

    if (Array.isArray(def) && Array.isArray(def[0])) {
      return def.map(d => this.toQl({}, d)).join('')
    }

    if (def.or) {
      return '(' + def.or.map(part => {
        const subOptions = {
          inputSet: options.inputSet
        }
        return this.toQl(subOptions, part)
      }).join('') + ')' + (options.outputSet ? '->' + options.outputSet : '') + ';'
    }

    if (def.and) {
      const first = def.and[0]
      const last = def.and[def.and.length - 1]
      const others = def.and.concat().slice(1, def.and.length - 1)
      const set = '.x' + this.uniqId()
      return this.toQl({ inputSet: options.inputSet, outputSet: set }, first) +
        others.map(part => this.toQl({ inputSet: set, outputSet: set }, part)).join('') +
        this.toQl({ inputSet: set, outputSet: options.outputSet }, last)
    }

    const parts = def.filter(part => part.type)
    let types

    switch (parts.length) {
      case 0:
        types = ['nwr']
        break
      case 1:
        types = [parts[0].type]
        break
      default:
        throw new Error('Filter: only one type query allowed!')
    }

    const queries = filterJoin(def
      .filter(part => !part.type)
      .map(compile))

    let result
    if (queries.length > 1) {
      result = '(' + queries.map(q => types.map(type => type + options.inputSet + q).join(';')).join(';') + ';)'
    } else if (types.length === 1) {
      result = types[0] + options.inputSet + queries[0]
    } else {
      result = '(' + types.map(type => type + options.inputSet + queries[0]).join(';') + ';)'
    }

    return result + (options.outputSet ? '->' + options.outputSet : '') + ';'
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

    if (Array.isArray(def) && Array.isArray(def[0])) {
      // script with several statements detected. only compile the last one, as previous statements
      // can't have an effect on the last statement yet.
      def = def[def.length - 1]
    }

    if (def.or) {
      let needMatch = false

      const r = {
        $or:
        def.or.map(part => {
          const r = this.toLokijs(options, part)
          if (r.needMatch) {
            needMatch = true
          }
          delete r.needMatch
          return r
        })
      }

      // if the $or has elements that are always true, remove whole $or
      if (r.$or.filter(p => Object.keys(p).length === 0).length > 0) {
        delete r.$or
      }

      if (needMatch) {
        r.needMatch = true
      }

      return r
    }

    if (def.and) {
      let needMatch = false

      const r = {
        $and:
        def.and.map(part => {
          const r = this.toLokijs(options, part)
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

    const query = {}
    let orQueries = []

    if (!Array.isArray(def)) {
      def = [def]
    }

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
      } else if (filter.op === 'not_exists') {
        k = 'tags.' + filter.key
        v = { $exists: false }
      } else if (filter.op === 'has') {
        k = 'tags.' + filter.key
        v = { $regex: '^(.*;|)' + filter.value + '(|;.*)$' }
      } else if ((filter.op === '~') || (filter.op === '~i')) {
        k = 'tags.' + filter.key
        v = { $regex: new RegExp(filter.value, (filter.op === '~i' ? 'i' : '')) }
      } else if ((filter.op === '!~') || (filter.op === '!~i')) {
        k = 'tags.' + filter.key
        v = { $not: { $regex: new RegExp(filter.value, (filter.op === '!~i' ? 'i' : '')) } }
      } else if (filter.op === 'strsearch') {
        k = 'tags.' + filter.key
        v = { $regex: new RegExp(strsearch2regexp(filter.value), 'i') }
      } else if (filter.type) {
        k = 'type'
        v = { $eq: filter.type }
      } else if (filter.or) {
        orQueries.push(filter.or.map(p => {
          const r = this.toLokijs(options, p)
          if (r.needMatch) {
            query.needMatch = true
            delete r.needMatch
          }
          return r
        }))
      } else {
        console.log('unknown filter', filter)
      }

      if (k && v) {
        if (k === 'needMatch') {
          query.needMatch = true
        } else if (k in query) {
          if (!('$and' in query[k])) {
            query[k] = { $and: [query[k]] }
          }
          query[k].$and.push(v)
        } else {
          query[k] = v
        }
      }
    })

    orQueries = orQueries.filter(q => Object.keys(q).length)
    if (orQueries.length === 1) {
      query.$or = orQueries[0]
    } else if (orQueries.length > 1) {
      query.$and = orQueries.map(q => { return { $or: q } })
    }

    return query
  }
}

module.exports = Filter
