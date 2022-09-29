const parseString = require('./parseString')

const opPriorities = {
  '==': 5,
  '+': 3,
  '-': 3,
  '*': 2,
  '/': 2,
  '!': 1
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

function nextOp (current, op) {
  if (current && current.op && opPriorities[op] < opPriorities[current.op]) {
    current.right = { op, left: current.right || null }
  } else {
    current = { op, left: current }
  }

  return current
}

module.exports = function parseEvaluators (str, rek = 0) {
  let current = null
  let mode = 0

  while (true) {
    // console.log('rek' + rek, 'mode' + mode + '|', str.substr(0, 20), '->', current)
    if (mode === 0) {
      const m = str.match(/^(\s*)((-?[0-9]+(\.[0-9]+)?)|(["'!])|(t\[\s*)|([a-z_]*)\(|(,\)))/)
      if (!m) {
        throw new Error('mode 0')
      }
      if (m[3]) {
        str = str.substr(m[1].length + m[3].length)
        current = next(current, parseFloat(m[3]))
        mode = 1
      } else if (m[5] === '!') { // negation
        current = nextOp(current, '!')
        str = str.substr(m[1].length + m[5].length)
      } else if (m[5]) {
        let s
        [s, str] = parseString(str.substr(m[1].length))
        current = next(current, s)
        mode = 1
      } else if (m[6]) {
        mode = 10
        str = str.substr(m[1].length + m[6].length)
      } else if (m[7] !== undefined) {
        mode = 20
        str = str.substr(m[1].length + m[7].length + 1)
        current = next(current, { fun: m[7], parameters: [] })
      } else if (m[8]) {
        str = str.substr(m[1].length)
        return [current, str]
      }
    } else if (mode === 1) {
      const m1 = str.match(/^(\s*)([),].*|)$/)
      if (m1) {
        str = str.substr(m1[1].length)
        return [current, str]
      }

      const m = str.match(/^\s*(==|[+*-/])/)
      if (!m) { throw new Error('mode 1') }
      current = nextOp(current, m[1])
      str = str.substr(m[0].length)
      mode = 0
    } else if (mode === 10) {
      let s
      [s, str] = parseString(str)
      current = next(current, { fun: 'tag', parameters: [s] })
      mode = 11
    } else if (mode === 11) {
      const m = str.match(/^\s*\]/)
      if (!m) { throw new Error('mode 11') }
      str = str.substr(m[0].length)
      mode = 1
    } else if (mode === 20) {
      let s
      [s, str] = parseEvaluators(str, rek + 1)
      if (current.right) {
        current.right.parameters.push(s)
      } else {
        current.parameters.push(s)
      }

      const m = str.match(/^\s*([),])/)
      if (!m) { throw new Error('20') }
      str = str.substr(m[0].length)
      mode = m[1] === ')' ? 1 : 20
    }
  }
}
