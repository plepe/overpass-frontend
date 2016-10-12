var async = require('async')

function SortedCallbacks (options, featureCallback, finalCallback) {
  this.list = []
  this.lastIndex = -1
  this.featureCallback = featureCallback
  this.finalCallback = finalCallback
  this.options = options

  if (!('sort' in this.options)) {
    this.options.sort = false
  }
}

SortedCallbacks.prototype.next = function (err, feature, index) {
  this.list[index] = {
    err: err,
    feature: feature
  }

  if ((this.options.sort === false) ||
      ((this.options.sort === true) && (index === this.lastIndex + 1))) {
    async.setImmediate(function () {
      this.featureCallback(this.list[index].err, this.list[index].feature, index)
    }.bind(this))

    this.lastIndex = index
  }
}

SortedCallbacks.prototype.final = function (err) {
  async.setImmediate(function () {
    for (var i = this.lastIndex + 1; i < this.list.length; i++) {
      this.featureCallback(this.list[i].err, this.list[i].feature, i)
    }

    this.finalCallback(err)
  }.bind(this))
}

module.exports = SortedCallbacks
