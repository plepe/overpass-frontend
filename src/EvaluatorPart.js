module.exports = class EvaluatorPart {
  constructor (master) {
    this.master = master
  }

  compileLokiJS () {
    return { needMatch: true }
  }

  isSupersetOf (other) {
    if (JSON.stringify(this) === JSON.stringify(other)) {
      return true
    }

    if (other.op === '||') {
      return this.isSupersetOf(other.left) && this.isSupersetOf(other.right)
    } else if (other.op === '&&') {
      return this.isSupersetOf(other.left) || this.isSupersetOf(other.right)
    } else if (other.fun === 'and') {
      return other.parameters.some(p => this.isSupersetOf(p))
    }
  }

  simplify () {
    return this
  }

  cacheDescriptors (descriptors) {
    descriptors.forEach((d, i) => {
      descriptors[i] += this.toString()
    })
  }
}
