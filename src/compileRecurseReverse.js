module.exports = function compileRecurseReverse (input, output) {
  const outputSet = '._' + output.id
  const inputSet = '._' + input.id
  const revSet = '._rev' + output.id + '_' + input.id

  switch (input.type) {
    case 'r':
      return `(relation${inputSet}(bn${outputSet});relation${inputSet}(bw${outputSet});relation${inputSet}(br${outputSet});)->${revSet};\n`
    case 'w':
      return `way${inputSet}(bn${outputSet})->${revSet};\n`
    case 'bn':
      return `node${inputSet}(w${outputSet})->${revSet};\n`
    case 'bw':
      return `way${inputSet}(r${outputSet})->${revSet};\n`
    case 'br':
      return `relation${inputSet}(r${outputSet})->${revSet};\n`
    case '<':
      return `${outputSet} >;nwr._${inputSet}->${revSet};\n`
    case '>':
      return `${outputSet} <;nwr._${inputSet}->${revSet};\n`
    default:
      throw new Error('unsupported type: ' + input.type)
  }
}
