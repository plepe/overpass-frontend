const parseString = require('./parseString')

const operators = {
  '||': (a, b) => a || b,
  '&&': (a, b) => a && b,
  /* eslint-disable eqeqeq */
  '!=': (a, b) => a != b,
  '==': (a, b) => a == b,
  /* eslint-enable eqeqeq */
  '<': (a, b) => a < b,
  '<=': (a, b) => a <= b,
  '>': (a, b) => a > b,
  '>=': (a, b) => a >= b,
  '+': (a, b) => a + b,
  '-': (a, b) => a - b,
  '*': (a, b) => a * b,
  '/': (a, b) => a / b,
  '!': (a, b) => b ? 0 : 1,
  '—': (a, b) => -b
}
const functions = {
  '': (p, context, that) => that.exec(context, p[0]),
  count_tags: (p, context) => context.tags ? Object.keys(context.tags).length : null,
  id: (p, context) => context.osm_id,
  type: (p, context) => context.type,
  debug: (p) => {
    console.log(p[0])
    return p[0]
  },
  tag: (p, context) => context.tags && context.tags[p[0]]
}
const opPriorities = {
  '||': 7,
  '&&': 6,
  '!=': 5,
  '==': 5,
  '<': 4,
  '<=': 4,
  '>': 4,
  '>=': 4,
  '+': 3,
  '-': 3,
  '*': 2,
  '/': 2,
  '!': 1,
  '—': 0 // unary minus
}
const compileLokiOperator = {
  '==': function (left, right) {
    if (left && left.property && right && right.value) {
      return [left.property, { $eq: right.value }]
    } else if (left && left.value && right && right.property) {
      return [right.property, { $eq: left.value }]
    } else {
      return [null, null, true]
    }

    console.log(left, right)
  }
}

function next (current, def) {
  if (current) {
    if (current.right) {
      current.right = next(current.right, def)
    } else {
      current.right = def
    }
  } else {
    current = def
  }

  return current
}

function nextParam (current, def) {
  if (current.right) {
    nextParam(current.right, def)
  } else {
    current.parameters.push(def)
  }

  return current
}

function nextOp (current, op) {
  if (current && current.op && opPriorities[op] < opPriorities[current.op]) {
    current.right = { op, left: current.right || null }
  } else {
    current = { op, left: current }
  }

  return current
}

class Evaluator {
  parse (str, rek = 0) {
    this.data = null
    let mode = 0

    while (true) {
      // console.log('rek' + rek, 'mode' + mode + '|', str.substr(0, 20), '->', this.data)
      if (mode === 0) {
        const m = str.match(/^(\s*)((-?[0-9]+(\.[0-9]+)?)|(["'!-])|(t\[\s*)|([a-z_]*)\(|(,\)))/)
        if (!m) {
          throw new Error('mode 0')
        }
        if (m[3]) {
          str = str.substr(m[1].length + m[3].length)
          this.data = next(this.data, parseFloat(m[3]))
          mode = 1
        } else if (['!', '-'].includes(m[5])) { // negation or unary minus (—)
          this.data = nextOp(this.data, m[5] === '-' ? '—' : m[5])
          str = str.substr(m[1].length + m[5].length)
        } else if (m[5]) {
          let s
          [s, str] = parseString(str.substr(m[1].length))
          this.data = next(this.data, s)
          mode = 1
        } else if (m[6]) {
          mode = 10
          str = str.substr(m[1].length + m[6].length)
        } else if (m[7] !== undefined) {
          mode = 20
          str = str.substr(m[1].length + m[7].length + 1)
          this.data = next(this.data, { fun: m[7], parameters: [] })
        } else if (m[8]) {
          str = str.substr(m[1].length)
          return str
        }
      } else if (mode === 1) {
        const m1 = str.match(/^(\s*)([),].*|)$/)
        if (m1) {
          str = str.substr(m1[1].length)
          return str
        }

        const m = str.match(/^\s*([=!]=|[<>]=?|[+*-/]|&&|\|\|)/)
        if (!m) { throw new Error('mode 1') }
        this.data = nextOp(this.data, m[1])
        str = str.substr(m[0].length)
        mode = 0
      } else if (mode === 10) {
        let s
        [s, str] = parseString(str)
        this.data = next(this.data, { fun: 'tag', parameters: [s] })
        mode = 11
      } else if (mode === 11) {
        const m = str.match(/^\s*\]/)
        if (!m) { throw new Error('mode 11') }
        str = str.substr(m[0].length)
        mode = 1
      } else if (mode === 20) {
        if (!str.match(/^\s*\)/)) {
          const s = new Evaluator()
          str = s.parse(str, rek + 1)

          nextParam(this.data, s.data)
        }

        const m = str.match(/^\s*([),])/)
        if (!m) { throw new Error('20') }
        str = str.substr(m[0].length)
        mode = m[1] === ')' ? 1 : 20
      }
    }
  }

  exec (context, current = undefined) {
    if (current === undefined) {
      current = this.data
    }

    if (current === null || typeof current === 'number' || typeof current === 'string') {
      return current
    }

    if ('op' in current) {
      const left = this.exec(context, current.left)
      const right = this.exec(context, current.right)
      return operators[current.op](left, right)
    }

    if ('fun' in current) {
      const param = current.parameters.map(p => this.exec(context, p))
      return functions[current.fun](param, context, this)
    }
  }

  toString (current = undefined) {
    if (current === undefined) {
      current = this.data
    }

    if (current === null) {
      return '""'
    }

    if (typeof current === 'number') {
      return '' + current
    }

    if (typeof current === 'string') {
      return '"' + current
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"') + '"'
    }

    if ('op' in current) {
      const right = this.toString(current.right)
      if (current.left === null) {
        return (current.op === '—' ? '-' : current.op) + right
      } else {
        const left = this.toString(current.left)
        return left + current.op + right
      }
    }

    if ('fun' in current) {
      const param = current.parameters.map(p => this.toString(p))
      if (current.fun === 'tag') {
        return 't[' + param[0] + ']'
      } else {
        return current.fun + '(' + param.join(',') + ')'
      }
    }
  }

  compileLokiJS (current = undefined) {
    if (current === undefined) {
      current = this.data
    }

    if (current === null) {
      return null
    }

    if (current === null || typeof current === 'number' || typeof current === 'string') {
      return { value: current }
    }

    if ('op' in current) {
      const left = this.compileLokiJS(current.left)
      const right = this.compileLokiJS(current.right)

      return compileLokiOperator[current.op](left, right)
    }

    if ('fun' in current) {
      const param = current.parameters.map(p => this.compileLokiJS(p))

      if (current.fun === 'tag') {
        if (param[0] && param[0].value) {
          return { property: 'tags.' + param[0].value }
        }
      } else {
        //return current.fun + '(' + param.join(',') + ')'
      }
    }
  }
}

module.exports = Evaluator
