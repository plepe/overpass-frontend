const async = require('async')
const weightSort = require('weight-sort')
const OverpassFrontend = require('./defines')

class SortedCallbacks {
  constructor (options, featureCallback, finalCallback) {
    this.list = []
    this.lastIndex = -1
    this.featureCallback = featureCallback
    this.finalCallback = finalCallback
    this.options = options

    if (!('sort' in this.options) || this.options.sort === false) {
      this.options.sort = null
    }
    if (!('sortDir' in this.options)) {
      this.options.sortDir = 'asc'
    }
    if (this.options.sort === true) {
      this.options.sort = 'index'
    }

    if (this.options.sort === 'BBoxDiagonalLength') {
      this.options.properties |= OverpassFrontend.BBOX
    }
  }

  next (err, feature, index) {
    if (typeof index === 'undefined') {
      index = this.list.length
    }

    this.list[index] = {
      err: err,
      feature: feature,
      index: index
    }

    if ((this.options.sort === null) ||
        (this.options.sort === 'index' && this.options.sortDir === 'asc' && index === this.lastIndex + 1)) {
      async.setImmediate(function () {
        this.featureCallback(this.list[index].err, this.list[index].feature, index)
      }.bind(this))

      this.lastIndex = index
    }
  }

  final (err) {
    if (this.options.sort === 'BBoxDiagonalLength') {
      for (let i = 0; i < this.list.length; i++) {
        const feature = this.list[i].feature

        if (feature && feature.bounds) {
          this.list[i].weight = feature.bounds.diagonalLength()
        }
      }

      this.list = weightSort(this.list)
    }

    if (this.options.sortDir === 'desc') {
      this.list.reverse()
    }

    async.setImmediate(function () {
      if (this.options.sort !== null) {
        for (let i = this.lastIndex + 1; i < this.list.length; i++) {
          // if a request got aborted, the entry in list is missing
          if (this.list[i]) {
            this.featureCallback(this.list[i].err, this.list[i].feature, i)
          }
        }
      }

      this.finalCallback(err)
    }.bind(this))
  }
}

module.exports = SortedCallbacks
