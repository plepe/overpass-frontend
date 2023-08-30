const strsearch2regexp = require('strsearch2regexp')
const filterJoin = require('./filterJoin')
const OverpassFrontend = require('./defines')
const qlFunctions = require('./qlFunctions/__index__')
const parseString = require('./parseString')
const parseParentheses = require('./parseParentheses')
const qlFunction = require('./qlFunctions/qlFunction')
const compile = require('./compileFilter')
const filterPart = require('./filterPart')
require('./FilterQuery')
require('./FilterAnd')
require('./FilterOr')
require('./FilterRecurse')

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
  while (true) {
    // console.log('rek' + rek, 'mode' + mode + '|', def.substr(0, 20), '->', script, 'next:', current)
    if (mode === 0) {
      if (def.match(/^\s*$/)) {
        return [script, def]
      }

      keyRegexp = false
      m = def.match(/^\s*(node|way|relation|rel|nwr|\(|\))/)
      let m1 = def.match(/^\s*(?:\.([A-Za-z_][A-Za-z0-9_]*))?\s*(>|<)\s*(?:->\s*.([A-Za-z_][A-Za-z0-9_]*))?;?/)
      if (m && m[1] === '(') {
        def = def.slice(m[0].length)

        let parts
        [parts, def] = parse(def, rek + 1)
        mode = 1

        script.push({ or: parts })
        current = []
      } else if (m && m[1] === ')') {
        mode = 1
      } else if (m) {
        if (m[1] === 'rel') {
          current.push({ type: 'relation' })
        } else if (m[1] === 'nwr') {
          // nothing
        } else {
          current.push({ type: m[1] })
        }
        mode = 9
        def = def.slice(m[0].length)
      } else if (m1) {
        def = def.slice(m1[0].length)
        current = { recurse: m1[2] }
        if (m1[1]) {
          current.inputSet = m1[1]
        }
        if (m1[3]) {
          current.outputSet = m1[3]
        }
        script.push(current)
        current = []
      } else {
        throw new Error("Can't parse query, expected type of object (e.g. 'node'): " + def)
      }
    } else if (mode === 1) {
      m = def.match(/^\s*\)\s*(->\.([A-Za-z_][A-Za-z0-9_]*))?;?\s*/)
      if (m) {
        if (m[1]) {
          script.push({ outputSet: m[2] })
        }

        if (rek === 0) {
          return [script, def]
        } else {
          def = def.slice(m[0].length)
          return [script, def]
        }
      } else {
        mode = 0
      }
    } else if (mode === 9) {
      const m = def.match(/^\s*\.([A-Za-z_][A-Za-z0-9_]*)/)
      if (m) {
        def = def.slice(m[0].length)
        current.push({ inputSet: m[1] })
      } else {
        mode = 10
      }
    } else if (mode === 10) {
      const m = def.match(/^\s*(\[|\(|;|->)/)
      if (m && m[1] === '[') {
        def = def.slice(m[0].length)
        mode = 11
      } else if (m && m[1] === '(') {
        def = def.slice(m[0].length - 1)
        mode = 20
      } else if (m && m[1] === '->') {
        def = def.slice(m[0].length)
        mode = 15
      } else if (m && m[1] === ';') {
        def = def.slice(m[0].length)
        script.push(current)
        current = []
        notExists = null
        mode = 1
      } else if (!m && def.match(/^\s*$/)) {
        script.push(current)
        return [script, '']
      } else {
        throw new Error("Can't parse query, expected '[' or '->' or ';': " + def)
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
        notExists = null
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
    } else if (mode === 15) {
      const m = def.match(/^\s*\.([A-Za-z_][A-Za-z0-9_]*)\s*;/)
      if (m) {
        current.push({ outputSet: m[1] })
        def = def.slice(m[0].length)
        script.push(current)
        current = []
        notExists = null
        mode = 1
      }
      else {
        throw new Error("Can't parse query, expected output set and ';': " + def)
      }
    } else if (mode === 20) {
      const r = parseParentheses(def)
      const mId = r[0].match(/^\s*(\d+)\s*$/)
      const mBbox = r[0].match(/^((\s*-?\d+(.\d+)?\s*,){3}\s*-?\d+(.\d+)?\s*)$/)
      const mRecurse = r[0].match(/\s*(w|r|bn|bw|br)\s*(?:\.([A-Za-z_][A-Za-z0-9_]*)\s*)?$/)
      const m = r[0].match(/^\s*(\w+)\s*:\s*(.*)\s*$/)
      /* eslint-disable new-cap */
      if (mId) {
        def = r[1]
        current.push(new qlFunctions.id(mId[1]))
        mode = 10
      } else if (mBbox) {
        def = r[1]
        current.push(new qlFunctions.bbox(mBbox[1]))
        mode = 10
      } else if (m) {
        def = r[1]
        const fun = m[1]
        if (!qlFunctions[fun]) {
          throw new Error('Unsupported filter function: ' + fun)
        }
        current.push(new qlFunctions[fun](m[2]))
        mode = 10
      } else if (mRecurse) {
        def = r[1]
        let c = { recurse: mRecurse[1] }
        if (mRecurse[2]) {
          c.inputSet = mRecurse[2]
        }
        current.push(c)
        mode = 10
      } else {
        throw new Error("Can't parse query, expected id, bbox or function: " + def)
      }
      /* eslint-enable new-cap */
    }
  }
}

function check (def) {
  if (typeof def === 'string') {
    const result = parse(def)
    if (result[1].trim()) {
      throw new Error("Can't parse query, trailing characters: " + result[1])
    }
    return result[0]
  } else if (def === null) {
    return
  } else if (typeof def === 'object' && def instanceof Filter) {
    const result = parse(def.toString())
    if (result[1].trim()) {
      throw new Error("Can't parse query, trailing characters: " + result[1])
    }
    return result[0]
  } else if (Array.isArray(def)) {
    def = def.map(d => check(d))
  }
  if (def.and) {
    def = [{and: def.and.map(p => {
      const d = check(p)
      return Array.isArray(d[0]) || (Array.isArray(d) && (d[0].or || d[0].and)) ? d[0] : d
    })}]
  }
  if (def.or) {
    def = [{or: def.or.map(p => {
      const d = check(p)
      return Array.isArray(d[0]) || (Array.isArray(d) && (d[0].or || d[0].and)) ? d[0] : d
    })}]
  } else if (def.fun && !(def instanceof qlFunction)) {
    def = new qlFunctions[def.fun](def.value)
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

  createStatementId () {
    this._statementId = (this._statementId || 0) + 1
    return this._statementId
  }

  constructor (def) {
    if (!def) {
      this.def = []
      return
    }

    this.baseFilter = null
    this.def = check(def)
    this.statements = {}

    if (typeof def === 'string') {
      this.script = this.convertToFilterScript(this.def)
    } else {
      def = this.def
      if (!Array.isArray(def)) {
        if (!def.or && !def.and) {
          def = [[def]]
        } else {
          def = [def]
        }
      }

      def = this.expandOr(def)

      this.script = this.convertToFilterScript(def)
    }
  }

  /**
   * return the filter statement for the specified output set (or '_')
   * @param {object} [options] Options
   * @param {string} [options.set=_] Which set should the object be matched against.
   * @param {int} [options.statement] Return the statement with this id
   * @return {FilterStatement}
   */
  getStatement (options = {}) {
    if ('set' in options) {
      return this.sets[options.set]
    }

    if ('statement' in options) {
      return this.statements[options.statement]
    }

    return this.sets._
  }

  /**
   * set a filter which is applied to all queries which do not have a specified input set.
   * @param {string|Filter} filter a filter, e.g. 'nwr[x=y](1,1,2,2)'
   */
  setBaseFilter (filter) {
    this.baseFilter = new Filter(filter)
  }

  /**
   * Check if an object matches this filter
   * @param {OverpassNode|OverpassWay|OverpassRelation} ob an object from Overpass API
   * @param {object} [options] Options
   * @param {string} [options.set=_] Which set should the object be matched against.
   * @param {int} [options.statement] Return the statement with this id
   * @return {boolean}
   */
  match (ob, options = {}) {
    const statement = this.getStatement(options)
    return statement ? statement.match(ob) : false
  }

  /**
   * Convert query to a string representation
   * @return {string}
   */
  toString (def) {
    return this.toQl({ toString: true }, def)
  }

  toQuery (options = {}) {
    const statement = this.getStatement(options)
    return statement ? statement.toQuery(options) : null
  }

  /**
   * Convert query to Overpass QL
   * @param {object} [options] Additional options
   * @param {string} [options.inputSet=''] Specify input set (e.g.'.foo').
   * @param {string} [options.outputSet=''] Specify output set (e.g.'.foo').
   * @return {string}
   */
  toQl (options = {}, def) {
    let result = ''

    if (this.baseFilter) {
      result += this.baseFilter.toQl({ outputSet: '._base' })
    }

    return result + this.script.map(s => s.toQl(options)).join('')
  }

  /**
   * Compile all (recursing) parts of a query
   */
  compileQuery (options = {}) {
    const statement = this.getStatement(options)
    return statement ? statement.compileQuery(options) : { query: null }
  }

  recurse (options = {}) {
    const statement = this.getStatement(options)
    return statement ? statement.recurse() : []
  }

  /**
   * Convert query to LokiJS query for local database. If the property 'needMatch' is set on the returned object, an additional match() should be executed for each returned object, as the query can't be fully compiled (and the 'needMatch' property removed).
   * @param {object} [options] Additional options
   * @param {string} [options.set=_] For which set should the query be compiled.
   * @param {int} [options.statement] Return the statement with this id
   * @return {object}
   */
  toLokijs (options = {}) {
    const statement = this.getStatement(options)
    return statement ? statement.toLokijs(options) : { $not: true }
  }

  /**
   * Get the cache descriptors for this query
   * @param {object} [options] Options
   * @param {string} [options.set=_] Which set should the object be matched against.
   * @return [string]
   */
  cacheDescriptors (options = {}) {
    const result = this._caches(options)

    result.forEach(entry => {
      entry.id = (entry.type || 'nwr') + entry.filters + '(properties:' + entry.properties + ')'
      delete entry.type
      delete entry.filters
      delete entry.properties
    })

    return result
  }

  _caches (options = {}) {
    const statement = this.getStatement(options)
    return statement ? statement._caches(options) : []
  }

  /**
   * compare this filter with an other filter.
   * @param Filter other the other filter.
   * @return boolean true, if the current filter is equal other or a super-set of other.
   */
  isSupersetOf (other) {
    return this.def.every(entry =>
      other.def.every(otherEntry => this._isSupersetOf(entry, otherEntry)))
  }

  _isSupersetOf (def, otherDef) {
    if (def.or) {
      return def.or.some(d => this._isSupersetOf(d, otherDef))
    }
    if (def.and) {
      return def.and.every(d => this._isSupersetOf(d, otherDef))
    }

    if (otherDef.or) {
      return otherDef.or.every(d => this._isSupersetOf(def, d))
    }
    if (otherDef.and) {
      return otherDef.and.some(d => this._isSupersetOf(def, d))
    }

    // search for something, where otherPart is not equal or subset
    return !def.some(part => {
      return !otherDef.some(otherPart => {
        if (part.type && otherPart.type) {
          return part.type === otherPart.type
        }
        if (compile(otherPart, { toString: true }) === compile(part, { toString: true })) {
          return true
        }
        if (['~', '~i'].includes(part.op) && otherPart.op === '=' && part.key === otherPart.key && otherPart.value.match(RegExp(part.value, part.op === '~i' ? 'i' : ''))) {
          return true
        }
        if (['~', '~i'].includes(part.op) && part.keyRegexp && otherPart.op === '=' && otherPart.key.match(RegExp(part.key, part.keyRegexp === 'i' ? 'i' : '')) && otherPart.value.match(RegExp(part.value, part.op === '~i' ? 'i' : ''))) {
          return true
        }
        if (part.op === 'has_key' && otherPart.op && !['!=', '!~', '!~i', 'not_exists'].includes(otherPart.op) && part.key === otherPart.key) {
          return true
        }
        if (part.op === 'has_key' && part.keyRegexp && otherPart.op && !['!=', '!~', '!~i', 'not_exists'].includes(otherPart.op) && otherPart.key.match(RegExp(part.key, part.keyRegexp === 'i' ? 'i' : ''))) {
          return true
        }
        if (part instanceof qlFunction && otherPart instanceof qlFunction && part.isSupersetOf(otherPart)) {
          return true
        }
        return false
      })
    })
  }

  /**
   * @param {object} [options] Options
   * @param {string} [options.set=_] Which set should the object be matched against.
   * @returns {number} properties which are required for this filter
   */
  properties (options = {}) {
    const result = this._caches(options)

    return result.reduce((current, entry) => current | entry.properties, 0)
  }

  expandOr (def) {
    def.forEach((part, index) => {
      if (Array.isArray(part)) {
        let or = []
        let other = []

        part.forEach(q => {
          if (q.or) {
            or.push(q)
          } else {
            other.push(q)
          }
        })

        if (or.length) {
          def = def.concat()
          def[index] = { or: or.shift().or.concat() }

          or.forEach(q => {
            const current = def[index].or
            def[index].or = []

            q.or.forEach(q1 => {
              current.forEach(orp => {
                def[index].or.push(orp.concat(q1))
              })
            })
          })

          other.forEach(q => {
            def[index].or.forEach((orp, i) => {
              def[index].or[i] = def[index].or[i].concat([q])
            })
          })
        }
      }
    })

    return def
  }

  convertToFilterScript (def) {
    this.sets = {}
    let r = def.map(d => filterPart.get(d, this))

    return r
  }
}

module.exports = Filter
