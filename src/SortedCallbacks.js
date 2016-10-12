var async = require('async')

function SortedCallbacks (options, featureCallback, finalCallback) {
  this.list = []
  this.featureCallback = featureCallback
  this.finalCallback = finalCallback
}

SortedCallbacks.prototype.next = function (err, feature, index) {
  this.list[index] = {
    err: err,
    feature: feature
  }
}

SortedCallbacks.prototype.final = function (err) {
  async.setImmediate(function () {
    for (var i = 0; i < this.list.length; i++) {
      this.featureCallback(this.list[i].err, this.list[i].feature, i)
    }

    this.finalCallback(err)
  }.bind(this))
}

module.exports = SortedCallbacks
