function qlesc (str) {
  return '"' + str + '"'
}

function compile (part) {
  if (part.op === 'has_key') {
    return '[' + qlesc(part.key) + ']'
  }
}

function test (ob, part) {
  switch (part.op) {
    case 'has_key':
      return ob.tags && (part.key in ob.tags)
    default:
      return false
  }
}

function Filter (def) {
  this.def = def
}

Filter.prototype.match = function (ob) {
  return !!this.def.filter(test.bind(this, ob)).length
}

Filter.prototype.toString = function () {
  return this.def.map(compile).join('')
}

module.exports = Filter
