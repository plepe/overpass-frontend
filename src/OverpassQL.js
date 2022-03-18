const Filter = require('./Filter')

function parse (text) {
  let mode = 0
  const result = []

  while (text.length) {
    console.log(mode, text)
    if (mode === 0) {
      const m1 = text.match(/^\s*\(/)
      const m2 = text.match(/^\s*\)/)
      const m3 = text.match(/^\s*(\.([A-Za-z_])\w*\s+)?(out)(.*);/)

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
        text = text.substr(m3[0].length)
        result.push({ type: m3[3], input: m3[2] || '_', parameters: m3[4] })
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

module.exports = {
  parse (text) {
    return parse(text)[0]
  }
}
