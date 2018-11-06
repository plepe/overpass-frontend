const defines = require('./defines')
const overpassOutOptions = require('./overpassOutOptions')
const each = require('lodash/forEach')
const map = require('lodash/map')
const keys = require('lodash/keys')
const BoundingBox = require('boundingbox')
const SortedCallbacks = require('./SortedCallbacks')

class RequestBBoxMembers {
  constructor (request) {
    this.master = request
    this.options = this.master.options
    this.overpass = this.master.overpass

    this.options.properties |= defines.MEMBERS
    this.options.memberProperties = this.options.memberProperties || defines.DEFAULT
    this.options.memberProperties |= defines.BBOX

    if (this.options.memberBounds) {
      this.bounds = new BoundingBox(this.options.memberBounds)
    }

    this.master._compileQuery = this._compileQuery.bind(this, this.master._compileQuery)
    this.master.needLoad = this.needLoad.bind(this, this.master.needLoad)
    this.master.mayFinish = this.mayFinish.bind(this, this.master.mayFinish)
    this.master.preprocess = this.preprocess.bind(this, this.master.preprocess)
    this.master.minMaxEffort = this.minMaxEffort.bind(this, this.master.minMaxEffort)
    this.master.finishSubRequest = this.finishSubRequest.bind(this, this.master.finishSubRequest)
    this.master.featureCallback = this.receiveMasterObject.bind(this, this.master.featureCallback)

    this.doneFeatures = {}
    this.relations = {}
    this.currentRelations = []
    this.todo = {}
    this.loadFinish = true

    var callbacks = new SortedCallbacks(this.options, this.options.memberCallback, this.finalCallback)
    this.options.memberCallback = callbacks.next.bind(callbacks)
    this.finalCallback = callbacks.final.bind(callbacks)
  }

  minMaxEffort (fun) {
    let { minEffort, maxEffort } = fun.call(this.master)

    if (!this.loadFinish) {
      minEffort += 64
      maxEffort = null
    }

    return { minEffort, maxEffort }
  }

  preprocess (fun) {
    fun.call(this.master)

    this.todo = {}
    each(this.relations, ob => {
      each(ob.members, member => {
        if (!(member.id in this.doneFeatures)) {
          this.todo[member.id] = undefined
        }
      })
    })

    each(this.todo, (value, id) => {
      if (id in this.overpass.cacheElements) {
        var ob = this.overpass.cacheElements[id]

        if (this.bounds && !ob.intersects(this.bounds)) {
          return
        }

        if ((this.options.memberProperties & ob.properties) === this.options.memberProperties) {
          this.doneFeatures[id] = ob

          this.options.memberCallback(null, ob)
        }
      }
    })

    return
  }

  _compileQuery (fun, context) {
    var subRequest = fun.call(this.master, context)

    if (this.master.onlyPartlyKnown) {
      each(this.master.onlyPartlyKnown, rel => this.relations[rel.id] = rel)
    }

    if (keys(this.relations).length === 0) {
      return subRequest
    }

    let query = '(\n'
    query += map(this.relations, ob => {
      if (ob.type === 'relation') {
        return 'relation(' + ob.osm_id + ');\n'
      }
      return ''
    }).join('')
    query += ')->.result;'
    this.currentRelations = keys(this.relations)

    let BBoxString = ''
    if (this.bounds) {
      BBoxString = '(' + this.bounds.toLatLonString() + ')'
    }

    query += '(\n' +
       '  node(r.result)' + BBoxString + ';\n' +
       '  way(r.result)' + BBoxString + ';\n' +
       '  relation(r.result)' + BBoxString + ';\n' +
       ')->.resultMembers;\n'

    var queryRemoveDoneFeatures = ''
    var countRemoveDoneFeatures = 0
    for (var id in this.doneFeatures) {
      var ob = this.doneFeatures[id]

      if (countRemoveDoneFeatures % 1000 === 999) {
        query += '(' + queryRemoveDoneFeatures + ')->.doneMembers;\n'
        queryRemoveDoneFeatures = '.doneMembers;'
      }

      queryRemoveDoneFeatures += ob.type + '(' + ob.osm_id + ');'
      countRemoveDoneFeatures++
    }

    if (countRemoveDoneFeatures) {
      query += '(' + queryRemoveDoneFeatures + ')->.doneMembers;\n'
      query += '(.resultMembers; - .doneMembers;)->.resultMembers;\n'
    }

    this.part = {
      properties: this.options.memberProperties,
      receiveObject: this.receiveObject.bind(this),
      featureCallback: this.options.memberCallback,
      count: 0
    }

    query += '.resultMembers out ' + overpassOutOptions(this.part) + ';'

    this.loadFinish = true

    if (subRequest.parts.length) {
      subRequest.query += '\nout count;\n'
    }
    subRequest.query += query
    subRequest.parts.push(this.part)

    return subRequest
  }

  receiveMasterObject (fun, err, result, index) {
    this.relations[result.id] = result

    // when all members have their memberProperties, we don't need to load
    if (result.memberFeatures.filter(member => !(member.properties & this.options.memberProperties)).length !== 0) {
      if (!this.options.memberBounds) {
        this.loadFinish = false
      } else {
        if (!result.knownMemberArea || !result.knownMemberArea.check(this.options.memberBounds)) {
          this.loadFinish = false
        }
      }
    }

    fun(err, result, index)
  }

  receiveObject (ob) {
    this.doneFeatures[ob.id] = ob
  }

  finishSubRequest (fun, subRequest) {
    fun.call(this.master, subRequest)

    if (this.options.memberBounds) {
      each(this.relations, relation =>
        relation.knownMemberArea.add(this.options.memberBounds)
      )
    }

    if (keys(this.relations).length !== this.currentRelations.length) {
      this.loadFinish = false
    }
  }

  needLoad (fun) {
    var result = fun.call(this.master)

    if (result === true) {
      return true
    }

    return !this.loadFinish
  }

  mayFinish (fun) {
    var result = fun.call(this.master)

    if (result === false) {
      return false
    }

    return this.loadFinish
  }
}

module.exports = function (request) {
  return new RequestBBoxMembers(request)
}
