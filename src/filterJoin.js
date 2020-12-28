module.exports = function filterJoin (def) {
  let result = ['']

  if (!Array.isArray(def)) {
    def = [def]
  }

  def.forEach(
    d => {
      if (d.or) {
        const sub = d.or.map(e => filterJoin(e))

        let newResult = []
        result.forEach(r => { newResult = newResult.concat(sub.map(s => r + s)) })
        result = newResult
      } else {
        result = result.map(r => r + d)
      }
    }
  )

  return result
}
