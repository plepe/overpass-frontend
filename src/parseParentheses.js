const parseString = require('./parseString')

module.exports = function parseParentheses (str) {
  const openingChrs = '([{'
  const closingChrs = ')]}'
  const stringChrs = '\'"'
  let result = ''
  const chr = str[0]
  str = str.slice(1)

  if (!openingChrs.includes(chr)) {
    throw new Error('parseParentheses(): ' + chr + ' is not a valid opening character')
  }
  const closingChr = closingChrs[openingChrs.indexOf(chr)]

  const regexp = new RegExp('^([^([{\'"\\' + closingChr + ']*)([([{\'"\\' + closingChr + '])')

  do {
    const m = str.match(regexp)
    if (m) {
      if (m[2] === closingChr) {
        result += m[1]
        str = str.slice(m[0].length)
        return [result, str]
      } else if (openingChrs.includes(m[2])) {
        result += m[1]
        str = str.slice(m[1].length)
        const r = parseParentheses(str)
        result += m[2] + r[0] + closingChrs[openingChrs.indexOf(m[2])]
        str = r[1]
      } else if (stringChrs.includes(m[2])) {
        result += m[1]
        str = str.slice(m[1].length)
        const r = parseString(str)
        result += m[2] + r[0] + m[2]
        str = r[1]
      } else {
        throw new Error('haeh?')
      }
    } else {
      throw new Error("Can't parse string from query: " + str)
    }
  } while (str.length)

  throw new Error("Can't parse string, no string end detected!")
}
