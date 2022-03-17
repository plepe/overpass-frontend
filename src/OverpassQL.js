const Filter = require('./Filter')

function parse (text) {
  const result = []

  while (text.length) {
    const m1 = text.match(/^\s*\(/)
    const m2 = text.match(/^\s*\)\s*;/)
    const m3 = text.match(/^\s*(out)(.*);/)

    if (m1) {
    // union statement
      text = text.substr(m1[0].length)
      const r = parse(text)
      result.push({ type: 'union', statements: r[0] })
      text = r[1]
    } else if (m2) {
    // union end statement
      text = text.substr(m2[0].length)
      return [result, text]
    } else if (m3) {
    // out statement
      text = text.substr(m3[0].length)
      result.push({ type: m3[1], parameters: m3[2] })
    } else {
    // query
      const f = Filter.parse(text)
      result.push({ type: 'query', query: f[0] })
      text = f[1]
    }
  }

  return [result, text]
}

module.exports = {
  parse (text) {
    return parse(text)[0]
  }
}
