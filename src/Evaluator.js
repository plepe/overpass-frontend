const parseString = require('./parseString')

const evaluatorFunctions = require('./evaluator/__functions__')
const evaluatorOperators = require('./evaluator/__operators__')
const evaluatorExport = require('./evaluatorExport')
const evaluatorHelper = require('./evaluatorHelper')
const isNumber = evaluatorHelper.isNumber
const isValue = evaluatorHelper.isValue

const opIsSupersetOfLeft = {
  '==' (currentValue, otherOp, otherValue) {
    switch (otherOp) {
      case '==':
        /* eslint-disable eqeqeq */
        return currentValue == otherValue
  /* eslint-enable eqeqeq */
    }
  },
  '!=' (currentValue, otherOp, otherValue) {
    return false
  },
  '<' (currentValue, otherOp, otherValue) {
    switch (otherOp) {
      case '<':
      case '<=':
        return currentValue > otherValue
    }
  },
  '<=' (currentValue, otherOp, otherValue) {
    switch (otherOp) {
      case '<':
      case '<=':
      case '==':
        return currentValue >= otherValue
    }
  },
  '>' (currentValue, otherOp, otherValue) {
    switch (otherOp) {
      case '>':
      case '>=':
        return currentValue < otherValue
    }
  },
  '>=' (currentValue, otherOp, otherValue) {
    switch (otherOp) {
      case '>':
      case '>=':
      case '==':
        return currentValue <= otherValue
    }
  }
}
const opIsSupersetOfRight = {
  '==' (currentValue, otherOp, otherValue) {
    switch (otherOp) {
      case '==':
        /* eslint-disable eqeqeq */
        return currentValue == otherValue
  /* eslint-enable eqeqeq */
    }
  },
  '!=' (currentValue, otherOp, otherValue) {
    return false
  },
  '<' (currentValue, otherOp, otherValue) {
    switch (otherOp) {
      case '<':
      case '<=':
        return currentValue < otherValue
    }
  },
  '<=' (currentValue, otherOp, otherValue) {
    switch (otherOp) {
      case '<':
      case '<=':
      case '==':
        return currentValue <= otherValue
    }
  },
  '>' (currentValue, otherOp, otherValue) {
    switch (otherOp) {
      case '>':
      case '>=':
        return currentValue > otherValue
    }
  },
  '>=' (currentValue, otherOp, otherValue) {
    switch (otherOp) {
      case '>':
      case '>=':
      case '==':
        return currentValue >= otherValue
    }
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

function nextOp (current, op, that) {
  const c = new evaluatorOperators[op](op, current, null, that)

  if (current && current.op && c.priority() < current.priority()) {
    c.left = current.right || null
    current.right = c
  } else {
    current = c
  }

  return current
}

class Evaluator {
  toJSON () {
    return evaluatorExport(this.data)
  }

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
          this.data = nextOp(this.data, m[5] === '-' ? '—' : m[5], this)
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
          this.data = next(this.data, new evaluatorFunctions[m[7]](m[7], [], this))
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
        this.data = nextOp(this.data, m[1], this)
        str = str.substr(m[0].length)
        mode = 0
      } else if (mode === 10) {
        let s
        [s, str] = parseString(str)
        this.data = next(this.data, new evaluatorFunctions.tag('tag', [s], this))
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
      return current.eval(context)
    }

    if ('fun' in current) {
      const param = current.parameters.map(p => this.exec(context, p))
      if (!(current.fun in evaluatorFunctions)) {
        console.error('No such evaluator function:', current.fun)
      } else {
        return current.eval(context)
      }
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

    if (typeof current === 'boolean') {
      return current ? '1' : '0'
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

    if (isValue(current)) {
      return { value: current }
    }

    if ('op' in current || 'fun' in current) {
      return current.compileLokiJS()
    }
  }

  cacheExplode (current) {
    const loki = this.compileLokiJS(current)
    if ('value' in loki && !loki.needMatch) {
      return [loki.value]
    }

    if (isValue(current)) {
      return [current]
    } else if ('fun' in current) {
      const result = [new evaluatorFunctions[current.fun](current.fun, [], this)]
      current.parameters.forEach(p => {
        const pn = this.cacheExplode(p)
        result.forEach(r => {
          const orig = JSON.parse(JSON.stringify(r))
          pn.forEach((n, i) => {
            if (i === 0) {
              r.parameters.push(n)
            } else {
              const next = JSON.parse(JSON.stringify(orig))
              next.parameters.push(n)
              result.push(next)
            }
          })
        })
      })
      return result
    } else if (current.op === '||') {
      const result = []
      const left = this.cacheExplode(current.left)
      const right = this.cacheExplode(current.right)
      result.push(...left)
      result.push(...right)
      return result
    } else if (current.op === '&&') {
      const result = []
      const left = this.cacheExplode(current.left)
      const right = this.cacheExplode(current.right)
      left.forEach(l => {
        right.forEach(r => {
          const entry = { fun: 'and', parameters: [] }
          entry.parameters.push(...(l.fun === 'and' ? l.parameters : [l]))
          entry.parameters.push(...(r.fun === 'and' ? r.parameters : [r]))
          result.push(entry)
        })
      })
      return result
    } else if (current.op) {
      const result = []
      const left = this.cacheExplode(current.left)
      const right = this.cacheExplode(current.right)
      left.forEach(l => {
        right.forEach(r => {
          result.push({ op: current.op, left: l, right: r })
        })
      })
      return result
    }
  }

  cacheDescriptors (descriptors, current = undefined) {
    const list = this.cacheExplode(this.data)

    if (current === undefined) {
      current = this.data
    }

    descriptors.forEach(d => {
      const orig = JSON.parse(JSON.stringify(d))
      list.forEach((current, i) => {
        let next = d
        if (i > 0) {
          next = JSON.parse(JSON.stringify(orig))
          descriptors.push(next)
        }

        if (isValue(current)) {
          if (!current) {
            next.invalid = true
          }
        } else if (current.fun === 'and') {
          next.filters += current.parameters.map(c => '(if:' + this.toString(c) + ')').join('')
        } else {
          next.filters += '(if:' + this.toString(current) + ')'
        }
      })
    })
  }

  isSupersetOf (other) {
    return this._isSupersetOf(this.data, other.data)
  }

  _isSupersetOf (current, other) {
    if (JSON.stringify(current) === JSON.stringify(other)) {
      return true
    }

    if (current.op === '||') {
      return this._isSupersetOf(current.left, other) || this._isSupersetOf(current.right, other)
    } else if (current.op === '&&') {
      return this._isSupersetOf(current.left, other) && this._isSupersetOf(current.right, other)
    } else if (current.fun === 'and') {
      return current.parameters.every(p => this._isSupersetOf(p, other))
    }

    if (other.op === '||') {
      return this._isSupersetOf(current, other.left) && this._isSupersetOf(current, other.right)
    } else if (other.op === '&&') {
      return this._isSupersetOf(current, other.left) || this._isSupersetOf(current, other.right)
    } else if (current.fun === 'and') {
      return current.parameters.some(p => this._isSupersetOf(p, other))
    }

    if (current.op) {
      const left = this.compileLokiJS(current.left)
      const right = this.compileLokiJS(current.right)
      const otherLeft = this.compileLokiJS(other.left)
      const otherRight = this.compileLokiJS(other.right)

      if (current.left && current.left.fun && other.left && other.left.fun && JSON.stringify(current.left) === JSON.stringify(other.left) && 'value' in right && 'value' in otherRight) {
        return current.op in opIsSupersetOfLeft && opIsSupersetOfLeft[current.op](right.value, other.op, otherRight.value)
      }

      if (current.right && current.right.fun && other.right && other.right.fun && JSON.stringify(current.right) === JSON.stringify(other.right) && 'value' in left && 'value' in otherLeft) {
        return current.op in opIsSupersetOfRight && opIsSupersetOfRight[current.op](left.value, other.op, otherLeft.value)
      }
    }
  }
}

module.exports = Evaluator
