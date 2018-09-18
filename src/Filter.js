function qlesc (str) {
  return '"' + str + '"'
}

function compile (part) {
  switch (part.op) {
    case 'has_key':
      return '[' + qlesc(part.key) + ']'
    case '=':
      return '[' + qlesc(part.key) + '=' + qlesc(part.value) + ']'
    case 'has':
      return '[' + qlesc(part.key) + '~' + qlesc('^(.*;|)' + part.value + '(|;.*)$') + ']'
  }
}

function test (ob, part) {
  switch (part.op) {
    case 'has_key':
      return ob.tags && (part.key in ob.tags)
    case '=':
      return ob.tags && (part.key in ob.tags) && (ob.tags[part.key] === part.value)
    case 'has':
      return ob.tags && (part.key in ob.tags) && (ob.tags[part.key].split(/;/).indexOf(part.value) !== -1)
    default:
      return false
  }
}

function Filter (def) {
  if (typeof def === 'string') {
    this.def = []

    let mode = 0
    let current = ''
    let key
    let op
    let m
    while (def.length) {
      console.log(mode, def)
      if (mode === 0) {
        switch (def[0]) {
          case '[':
            current = ''
            def = def.slice(1)
            mode = 1
            break
          default:
            throw new Error('1')
        }
      } else if (mode === 1) {
        if (m = def.match(/^[a-zA-Z0-9]+/)) {
          current += m[0]
          def = def.slice(m[0].length)
        } else if (m = def.match(/^(=|\!=|\~|\!~|\^)/)) {
          if (current === '') { throw new Error('2') }
          key = current
          current = ''
          op  = m[1] === '^' ? 'has' : m[1]
          mode = 2
          def = def.slice(m[1].length)
        } else if (def[0] === ']') {
          this.def.push({ key: current, op: 'has_key' })
          def = def.slice(1)
          mode = 0
        } else {
          throw new Error('3')
        }
      } else if (mode === 2) {
        if (m = def.match(/^[a-zA-Z0-9]+/)) {
          current += m[0]
          def = def.slice(m[0].length)
        } else if (def[0] === ']') {
          if (current === '') { throw new Error('2') }
          this.def.push({ key, op, value: current })
          mode = 0
          def = def.slice(1)
        } else {
          throw new Error('3')
        }
      }
    }

    console.log(this.def)
    return
  }

  this.def = def
}

Filter.prototype.match = function (ob) {
  return this.def.filter(test.bind(this, ob)).length === this.def.length
}

Filter.prototype.toString = function () {
  return this.def.map(compile).join('')
}

Filter.prototype.toQl = function (options = {}) {
  if (!options.inputSet) {
    options.inputSet = ''
  }

  return '(node' + options.inputSet + this.toString() + ';' +
    'way' + options.inputSet + this.toString() + ';' +
    'relation' + options.inputSet + this.toString() + ';)'
}

module.exports = Filter
