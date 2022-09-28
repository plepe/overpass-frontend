const parseString = require('./parseString')

function next (current, def) {
  if (current) {
    current.right = def
  } else {
    current = def
  }

  return current
}

function nextOp (current, op) {
  current = { op, left: current }

  return current
}

module.exports = function parseEvaluators (str, rek = 0) {
  let current = null
  let mode = 0

  while (true) {
    // console.log('rek' + rek, 'mode' + mode + '|', str.substr(0, 20), '->', current)
    if (mode === 0) {
      const m = str.match(/^(\s*)(([0-9]+(\.[0-9]+))|(["'!])|(t\[\s*)|([a-z_]+)\()/)
      if (!m) {
        throw new Error('mode 0')
      }
      if (m[3]) {
        console.log(m[3])
      }
      if (m[5]) { // string
        let s
        [s, str] = parseString(str.substr(m[1].length))
        current = next(current, s)
        mode = 1
      }
      if (m[6]) {
        mode = 10
        str = str.substr(m[1].length + m[6].length)
      }
    } else if (mode === 1) {
      if (str.match(/^\s*$/)) {
        return current
      }

      const m = str.match(/^\s*(==)/)
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
    }
  }
}
