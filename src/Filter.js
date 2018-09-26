function qlesc (str) {
  return '"' + str.replace(/"/g, '\\"') + '"'
}

function compile (part) {
  switch (part.op) {
    case 'has_key':
      return '[' + qlesc(part.key) + ']'
    case '=':
    case '!=':
    case '~':
    case '!~':
      return '[' + qlesc(part.key) + part.op + qlesc(part.value) + ']'
    case 'has':
      return '[' + qlesc(part.key) + '~' + qlesc('^(.*;|)' + part.value + '(|;.*)$') + ']'
  }
}

function test (ob, part) {
  if (part.type) {
    return ob.type === part.type
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

function Filter (def) {
  if (typeof def === 'string') {
    let dummy
    [ this.def , dummy ] = parse(def)
    return
  }

  this.def = def
}

function parse (def) {
    result = []

    let mode = 0
    let key
    let value
    let op
    let m
    while (def.length) {
      if (mode === 0) {
        m = def.match(/^\s*(node|way|relation|rel|nwr|\()/)
        if (m && m[1] === '(') {
          def = def.slice(m[0].length)
          let parts = []

          do {
            let cont = false
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
        m = def.match(/^(\s*)([a-zA-Z0-9_]+|"|')/)
        if (m[2] === '"' || m[2] === "'") {
          def = def.slice(m[1].length)
          let x = parseString(def)
          key = x[0]
          def = x[1]
          mode = 12
        } else if (m) {
          key = m[2]
          def = def.slice(m[0].length)
          mode = 12
        } else {
          throw new Error("Can't parse query, expected key: " + def)
        }
      } else if (mode === 12) {
        m = def.match(/^\s*(=|!=|~|!~|\^|])/)
        if (m && m[1] === ']') {
          result.push({ key, op: 'has_key' })
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
          result.push({ key, op, value })
          mode = 10
          def = def.slice(m[0].length)
        } else {
          throw new Error("Can't parse query, expected ']': " + def)
        }
      }
    }

    return [ result, def ]
}

Filter.prototype.match = function (ob, def) {
  if (!def) {
    def = this.def
  }

  if (def.or) {
    return def.or.some(part => this.match(ob, part))
  }

  return def.filter(test.bind(this, ob)).length === def.length
}

Filter.prototype.toString = function (def) {
  let result = ''

  if (!def) {
    def = this.def
  }

  if (def.or) {
    return '(' + def.or.map(part => this.toString(part)) . join(';') + ';)'
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

  result += def
    .filter(part => !part.type)
    .map(compile).join('')

  return result
}

Filter.prototype.toQl = function (options = {}, def) {
  if (!def) {
    def = this.def
  }

  if (!options.inputSet) {
    options.inputSet = ''
  }

  if (def.or) {
    return '(' + def.or.map(part => {
      let r = this.toQl(options, part)
      return r.slice(1, -1)
    }).join('') + ')'
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

  return '(' + types.map(type => type + options.inputSet + filters.map(compile).join('')).join(';') + ';)'
}

module.exports = Filter
