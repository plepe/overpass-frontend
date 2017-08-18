function qlesc (str) {
  return '"' + str + '"'
}

function compile (part) {
  if (part.op === 'has_key') {
    return '[' + qlesc(part.key) + ']'
  }
}

function Filter (def) {
  this.def = def
}

Filter.prototype.toString = function () {
  return this.def.map(compile).join('')
}

module.exports = Filter
