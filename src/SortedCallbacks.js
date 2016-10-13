var async = require('async')
var weightSort = require('weight-sort')

function SortedCallbacks (options, featureCallback, finalCallback) {
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
}

SortedCallbacks.prototype.next = function (err, feature, index) {
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

SortedCallbacks.prototype.final = function (err) {
  if (this.options.sort === 'BBoxDiagonalLength') {
    for (var i = 0; i < this.list.length; i++) {
      var feature = this.list[i].feature

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
    for (var i = this.lastIndex + 1; i < this.list.length; i++) {
      this.featureCallback(this.list[i].err, this.list[i].feature, i)
    }

    this.finalCallback(err)
  }.bind(this))
}

module.exports = SortedCallbacks
