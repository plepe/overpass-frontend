module.exports = function parseString (str) {
  let result = ''
  const chr = str[0]
  str = str.slice(1)

  while (str.length) {
    const m = str.match('^[^\\\\' + chr + ']+')
    if (m) {
      result += m[0]
      str = str.slice(m[0].length)
    } else if (str[0] === '\\') {
      result += str[1]
      str = str.slice(2)
    } else if (str[0] === chr) {
      str = str.slice(1)
      return [result, str]
    } else {
      throw new Error("Can't parse string from query: " + str)
    }
  }

  throw new Error("Can't parse string, no string end detected!")
}
