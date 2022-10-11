const parseString = require('./parseString')

const EvaluatorFunctions = require('./evaluator/__functions__')
const EvaluatorOperators = require('./evaluator/__operators__')
const evaluatorExport = require('./evaluatorExport')
const EvaluatorValue = require('./EvaluatorValue')

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
  const c = new EvaluatorOperators[op](op, current, null)

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
          this.data = next(this.data, new EvaluatorValue(parseFloat(m[3])))
          mode = 1
        } else if (['!', '-'].includes(m[5])) { // negation or unary minus (—)
          this.data = nextOp(this.data, m[5] === '-' ? '—' : m[5])
          str = str.substr(m[1].length + m[5].length)
        } else if (m[5]) {
          let s
          [s, str] = parseString(str.substr(m[1].length))
          this.data = next(this.data, new EvaluatorValue(s))
          mode = 1
        } else if (m[6]) {
          mode = 10
          str = str.substr(m[1].length + m[6].length)
        } else if (m[7] !== undefined) {
          mode = 20
          str = str.substr(m[1].length + m[7].length + 1)
          this.data = next(this.data, new EvaluatorFunctions[m[7]](m[7], []))
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
        /* eslint-disable new-cap */
        this.data = next(this.data, new EvaluatorFunctions.tag('tag', [new EvaluatorValue(s)]))
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

  exec (context) {
    return this.data.eval(context)
  }

  simplify () {
    return this.data.simplify()
  }

  toString () {
    return this.data.toString()
  }

  /**
   * return null, if depends on the object
   */
  toValue () {
    return this.data.toValue()
  }

  compileLokiJS (current = undefined) {
    return this.data.compileLokiJS()
  }

  cacheDescriptors (descriptors) {
    if (!this.simplified) {
      this.simplified = this.simplify()
    }

    if ('value' in this.simplified) {
      descriptors.forEach(d => {
        if (!this.simplified.value) {
          d.invalid = true
        }
      })
      return
    }

    const list = [{ filters: '', properties: 0 }]
    this.simplified.cacheDescriptors(list)

    descriptors.forEach(d => {
      const orig = JSON.parse(JSON.stringify(d))
      list.forEach((current, i) => {
        let next = d
        if (i > 0) {
          next = JSON.parse(JSON.stringify(orig))
          descriptors.push(next)
        }
        next.filters += '(if:' + current.filters + ')'
        next.properties |= current.properties
      })
    })
  }

  isSupersetOf (other) {
    return this.data.isSupersetOf(other.data)
  }
}

module.exports = Evaluator
