module.exports = {
  '?': require('./ternary'),
  '||': require('./disjunction'),
  '&&': require('./conjunction'),
  '==': require('./comparison'),
  '!=': require('./comparison'),
  '<': require('./comparison'),
  '<=': require('./comparison'),
  '>': require('./comparison'),
  '>=': require('./comparison'),
  '+': require('./simpleMath'),
  '-': require('./simpleMath'),
  '*': require('./simpleMath'),
  '/': require('./simpleMath'),
  '!': require('./negation'),
  '—': require('./unaryMinus')
}
