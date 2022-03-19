const Filter = require('./Filter')

function parse (text) {
  let mode = 0
  const result = []

  while (text.length) {
    // console.log(mode, text)
    if (mode === 0) {
      const m1 = text.match(/^\s*\(/)
      const m2 = text.match(/^\s*\)/)
      const m3 = text.match(/^\s*(\.([A-Za-z_])\w*\s+)?(out)([\w\s]*);/)

      if (m1) {
      // union statement
        text = text.substr(m1[0].length)
        const r = parse(text)
        result.push({ type: 'union', statements: r[0] })
        text = r[1]
        mode = 1
      } else if (m2) {
      // union end statement
        text = text.substr(m2[0].length)
        return [result, text]
      } else if (m3) {
      // out statement
        const statement = {
          type: m3[3],
          input: m3[2] || '_',
          parameters: {}
        }

        m3[4].split(/\s+/g).forEach(p => {
          if (p === '') {
            // nop
          } else if (p.match(/^\d+$/)) {
            statement.count = parseInt(p)
          } else {
            statement.parameters[p] = true
          }
        })

        text = text.substr(m3[0].length)
        result.push(statement)
      } else {
      // query
        const f = Filter.parse(text)
        result.push({ type: 'query', query: f[0] })
        text = f[1]
        mode = 1
      }
    } else if (mode === 1) {
      const m1 = text.match(/^(->\.([A-Za-z]\w*))?\s*;/)
      if (m1) {
        result[result.length - 1].output = m1[2] || '_'
        text = text.substr(m1[0].length)
        mode = 0
      } else {
        console.error("Error parsing mode=" + mode + ":", text)
      }
    }
  }

  return [result, text]
}

class OverpassQL {
  constructor (script, overpass) {
    this.script = script
    this.overpass = overpass

    if (typeof script === 'string') {
      this.script = parse(script)[0]
    }
  }
}

OverpassQL.parse = function (text) {
  return parse(text)[0]
}

module.exports = OverpassQL
