const qlFunction = require('./qlFunction')
const parseString = require('../parseString')

module.exports = class user extends qlFunction {
  constructor (str) {
    super()

    this.value = []
    let cont = true
    while (cont) {
      cont = false
      const m = str.match(/^(\s*)(([\w\d]+)\s*(,)?|"|')/)

      if (m) {
        if (['"', "'"].includes(m[2])) {
          let p
          str = str.substr(m[1].length)
          ;[p, str] = parseString(str)
          this.value.push(p)
          const m1 = str.match(/^\s*,/)
          if (m1) {
            str = str.substr(m1[0].length)
            cont = true
          }
        } else {
          this.value.push(m[3])
          str = str.substr(m[1].length + m[2].length)
          cont = !!m[4]
        }
      }
    }

    if (!str.match(/^\s*$/)) {
      throw new Error("Can't parse user query: " + str)
    }
  }

  test (ob) {
    if (!ob.meta) {
      return
    }

    return this.value.includes(ob.meta.user)
  }

  toString () {
    return '(user:' + this.value.map(v => '"' + v + '"').join(',') + ')'
  }

  compileLokiJS () {
    if (this.value.length === 1) {
      return ['osmMeta.user', { $eq: this.value[0] }]
    } else {
      return ['osmMeta.user', { $in: this.value }]
    }
  }

  isSupersetOf (other) {
    if (other instanceof user) {
      return !other.value.filter(id => !this.value.includes(id)).length
    }
  }
}
