const parseString = require('./parseString')

const EvaluatorFunctions = require('./evaluator/__functions__')
const EvaluatorOperators = require('./evaluator/__operators__')
const evaluatorExport = require('./evaluatorExport')
const evaluatorHelper = require('./evaluatorHelper')
const EvaluatorValue = require('./EvaluatorValue')
const isValue = evaluatorHelper.isValue

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
  const c = new EvaluatorOperators[op](op, current, null, that)

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
          this.data = next(this.data, new EvaluatorValue(parseFloat(m[3]), this))
          mode = 1
        } else if (['!', '-'].includes(m[5])) { // negation or unary minus (—)
          this.data = nextOp(this.data, m[5] === '-' ? '—' : m[5], this)
          str = str.substr(m[1].length + m[5].length)
        } else if (m[5]) {
          let s
          [s, str] = parseString(str.substr(m[1].length))
          this.data = next(this.data, new EvaluatorValue(s, this))
          mode = 1
        } else if (m[6]) {
          mode = 10
          str = str.substr(m[1].length + m[6].length)
        } else if (m[7] !== undefined) {
          mode = 20
          str = str.substr(m[1].length + m[7].length + 1)
          this.data = next(this.data, new EvaluatorFunctions[m[7]](m[7], [], this))
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
        /* eslint-disable new-cap */
        this.data = next(this.data, new EvaluatorFunctions.tag('tag', [new EvaluatorValue(s)], this))
        /* eslint-enable new-cap */
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

    return current.eval(context)
  }

  simplify () {
    return this.data.simplify()
  }

  toString (current = undefined) {
    if (current === undefined) {
      current = this.data
    }

    /* to remove */
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
    /* /to remove */

    return current.toString()
  }

  /**
   * return null, if depends on the object
   */
  toValue () {
    return this.data.toValue()
  }

  compileLokiJS (current = undefined) {
    if (current === undefined) {
      current = this.data
    }

    if (isValue(current)) {
      return { value: current }
    }

    return current.compileLokiJS()
  }

  cacheExplode (current) {
    const loki = this.compileLokiJS(current)
    if ('value' in loki && !loki.needMatch) {
      return [loki.value]
    }

    if (isValue(current)) {
      return [current]
    } else if ('fun' in current) {
      const result = [new EvaluatorFunctions[current.fun](current.fun, [], this)]
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

  cacheDescriptors (descriptors) {
    const list = ['']
    this.data.cacheDescriptors(list)

    descriptors.forEach(d => {
      const orig = JSON.parse(JSON.stringify(d))
      list.forEach((current, i) => {
        let next = d
        if (i > 0) {
          next = JSON.parse(JSON.stringify(orig))
          descriptors.push(next)
        }
        next.filters += '(if:' + current + ')'
      })
    })
  }

  isSupersetOf (other) {
    return this.data.isSupersetOf(other.data)
  }
}

module.exports = Evaluator
