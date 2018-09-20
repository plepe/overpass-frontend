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
    this.def = []

    let mode = 0
    let key
    let value
    let op
    let m
    while (def.length) {
      if (mode === 0) {
        m = def.match(/^(node|way|relation|rel|nwr)/)
        if (m) {
          if (m[0] === 'rel') {
            this.def.push({ type: 'relation' })
          } else if (m[0] === 'nwr') {
            // nothing
          } else {
            this.def.push({ type: m[0] })
          }
          mode = 10
          def = def.slice(m[0].length)
        } else {
          throw new Error("Can't parse query, expected type of object (e.g. 'node'): " + def)
        }
      } else if (mode === 10) {
        if (def[0] === '[') {
          def = def.slice(1)
          mode = 11
        } else {
          throw new Error("Can't parse query, expected '[': " + def)
        }
      } else if (mode === 11) {
        m = def.match(/^[a-zA-Z0-9]+/)
        if (m) {
          key = m[0]
          def = def.slice(m[0].length)
          mode = 12
        } else if (def[0] === '"' || def[0] === "'") {
          [ key, def ] = parseString(def)
          mode = 12
        } else {
          throw new Error("Can't parse query, expected key: " + def)
        }
      } else if (mode === 12) {
        m = def.match(/^(=|!=|~|!~|\^)/)
        if (m) {
          op = m[1] === '^' ? 'has' : m[1]
          mode = 13
          def = def.slice(m[1].length)
        } else if (def[0] === ']') {
          this.def.push({ key, op: 'has_key' })
          def = def.slice(1)
          mode = 10
        } else {
          throw new Error("Can't parse query, expected operator or ']': " + def)
        }
      } else if (mode === 13) {
        m = def.match(/^[a-zA-Z0-9]+/)
        if (m) {
          value = m[0]
          def = def.slice(m[0].length)
          mode = 14
        } else if (def[0] === '"' || def[0] === "'") {
          [ value, def ] = parseString(def)
          mode = 14
        } else {
          throw new Error("Can't parse query, expected value: " + def)
        }
      } else if (mode === 14) {
        if (def[0] === ']') {
          this.def.push({ key, op, value })
          mode = 10
          def = def.slice(1)
        } else {
          throw new Error("Can't parse query, expected ']': " + def)
        }
      }
    }

    return
  }

  this.def = def
}

Filter.prototype.match = function (ob) {
  return this.def.filter(test.bind(this, ob)).length === this.def.length
}

Filter.prototype.toString = function () {
  let result = ''
  let parts = this.def.filter(part => part.type)

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

  result += this.def
    .filter(part => !part.type)
    .map(compile).join('')

  return result
}

Filter.prototype.toQl = function (options = {}) {
  if (!options.inputSet) {
    options.inputSet = ''
  }

  let parts = this.def.filter(part => part.type)
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

  let filters = this.def.filter(part => !part.type)

  return '(' + types.map(type => type + options.inputSet + filters.map(compile).join('')).join(';') + ';)'
}

module.exports = Filter
