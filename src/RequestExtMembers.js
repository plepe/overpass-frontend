const defines = require('./defines')
const overpassOutOptions = require('./overpassOutOptions')
const each = require('lodash/forEach')
const map = require('lodash/map')
const keys = require('lodash/keys')
const BoundingBox = require('boundingbox')

class RequestExtMembers {
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

    this.master.compileQuery = this.compileQuery.bind(this, this.master.compileQuery)
    this.master.needLoad = this.needLoad.bind(this, this.master.needLoad)
    this.master.mayFinish = this.mayFinish.bind(this, this.master.mayFinish)
    this.master.preprocess = this.preprocess.bind(this, this.master.preprocess)
    this.master.willInclude = this.willInclude.bind(this, this.master.willInclude)
    this.master.minMaxEffort = this.minMaxEffort.bind(this, this.master.minMaxEffort)
    this.master.finishSubRequest = this.finishSubRequest.bind(this, this.master.finishSubRequest)
    this.master.featureCallback = this.receiveMasterObject.bind(this, this.master.featureCallback)

    this.doneFeatures = {}
    this.relations = {}
    this.currentRelations = []
    this.todo = {}
  }

  willInclude (fun, context) {
    let result = fun.call(this.master, context)

    if (!this.loadFinish) {
      return true
    }

    return result
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

  compileQuery (fun, context) {
    var subRequest = fun.call(this.master, context)

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
      query += '(.resultMembers; - .doneMembers);\n'
    }
    query += '(.resultMembers; - .extMembersNoDuplicates);\n'

    this.part = {
      properties: this.options.memberProperties,
      receiveObject: this.receiveObject.bind(this),
      featureCallback: this.options.memberCallback,
      count: 0
    }

    query += 'out ' + overpassOutOptions(this.part) + ';'
    query += '.resultMembers->.extMembersNoDuplicates;'

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
    this.loadFinish = false
    fun(err, result, index)
  }

  receiveObject (ob) {
    this.doneFeatures[ob.id] = ob
  }

  finishSubRequest (fun, subRequest) {
    fun.call(this.master, subRequest)

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
  return new RequestExtMembers(request)
}
