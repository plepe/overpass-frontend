function qlesc (str) {
  return '"' + str + '"'
}

function compile (part) {
  switch (part.op) {
    case 'has_key':
      return '[' + qlesc(part.key) + ']'
    case '=':
      return '[' + qlesc(part.key) + '=' + qlesc(part.value) + ']'
  }
}

function test (ob, part) {
  switch (part.op) {
    case 'has_key':
      return ob.tags && (part.key in ob.tags)
    case '=':
      return ob.tags && (part.key in ob.tags) && (ob.tags[part.key] === part.value)
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
