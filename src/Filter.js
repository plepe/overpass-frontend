function qlesc (str) {
  return '"' + str + '"'
}

function compile (part) {
  switch (part.op) {
    case 'has_key':
      return '[' + qlesc(part.key) + ']'
    case '=':
      return '[' + qlesc(part.key) + '=' + qlesc(part.value) + ']'
    case 'has':
      return '[' + qlesc(part.key) + '~"^(.*;)?' + part.value + '(;.*)?$"]'
  }
}

function test (ob, part) {
  switch (part.op) {
    case 'has_key':
      return ob.tags && (part.key in ob.tags)
    case '=':
      return ob.tags && (part.key in ob.tags) && (ob.tags[part.key] === part.value)
    case 'has':
      return ob.tags && (part.key in ob.tags) && (ob.tags[part.key].split(';').indexOf(part.value) !== -1)
    default:
      return false
  }
}

function Filter (def) {
  this.def = def
}

Filter.prototype.match = function (ob) {
  if (!this.def) {
    return true
  }

  return this.def.filter(test.bind(this, ob)).length === this.def.length
}

Filter.prototype.toString = function () {
  if (!this.def) {
    return ''
  }

  return this.def.map(compile).join('')
}

module.exports = Filter
