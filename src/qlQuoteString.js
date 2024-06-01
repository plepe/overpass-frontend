module.exports = function qlQuoteString (str) {
  return '"' + str.replace(/"/g, '\\"') + '"'
}
