const defines = require('./defines')
const overpassOutOptions = require('./overpassOutOptions')
const each = require('lodash/forEach')
const map = require('lodash/map')
const keys = require('lodash/keys')
const BoundingBox = require('boundingbox')
const isGeoJSON = require('./isGeoJSON')
const Request = require('./Request')

class RequestGetMembers extends Request {
  constructor (request) {
    super(request.overpass, {})
    this.master = request
    this.options = this.master.options

    this.options.properties |= defines.MEMBERS
    this.options.memberProperties = this.options.memberProperties || defines.DEFAULT
    this.options.memberProperties |= defines.BBOX

    if (this.options.memberBounds) {
      if (isGeoJSON(this.options.memberBounds)) {
        this.bounds = this.options.memberBounds
      } else {
        this.bounds = new BoundingBox(this.options.memberBounds)
      }
    }

    this.master._compileQuery = this._compileQuery.bind(this, this.master._compileQuery)
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
    const result = fun.call(this.master, context)

    if (this.loadFinish) {
      return false
    }

    if (!result) {
      return false
    }

    if (!('extMembersList' in context)) {
      context.extMembersList = this.relations
      context.extMembersRequests = [this]
      context.extMembersPriority = this.master.priority
      return true
    } else if (this.master.priority <= context.extMembersPriority) {
      keys(this.relations).forEach(id => {
        context.extMembersList[id] = this.relations[id]
      })
      context.extMembersRequests.push(this)
      return false
    }
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
      const ob = this.overpass.cache.get(id, this.options)
      if (ob !== undefined) {
        if (this.bounds && !ob.intersects(this.bounds)) {
          return
        }

        if ((this.options.memberProperties & ob.properties) === this.options.memberProperties) {
          this.receiveObject(ob)
          this.options.memberCallback(null, ob)
        }
      }
    })
  }

  _compileQuery (fun, context) {
    const subRequest = fun.call(this.master, context)

    if (keys(this.relations).length === 0) {
      return subRequest
    }

    let query = '(\n'
    query += map(context.extMembersList, ob => {
      if (ob.type === 'relation') {
        return 'relation(' + ob.osm_id + ');\n'
      }
      return ''
    }).join('')
    query += ')->.result;'
    this.currentRelations = keys(this.relations)

    let BBoxString = ''
    if (this.bounds) {
      BBoxString = '(' + new BoundingBox(this.bounds).toLatLonString() + ')'
    }

    query += '(\n' +
       '  node(r.result)' + BBoxString + ';\n' +
       '  way(r.result)' + BBoxString + ';\n' +
       '  relation(r.result)' + BBoxString + ';\n' +
       ')->.resultMembers;\n'

    let queryRemoveDoneFeatures = ''
    let countRemoveDoneFeatures = 0
    const listedDoneFeatures = {}
    context.extMembersRequests.forEach(request => {
      for (const id in request.doneFeatures) {
        if (id in listedDoneFeatures) {
          continue
        }

        const ob = request.doneFeatures[id]

        if (countRemoveDoneFeatures % 1000 === 999) {
          query += '(' + queryRemoveDoneFeatures + ')->.doneMembers;\n'
          queryRemoveDoneFeatures = '.doneMembers;'
        }

        queryRemoveDoneFeatures += ob.type + '(' + ob.osm_id + ');'
        countRemoveDoneFeatures++
        listedDoneFeatures[id] = true
      }

      request.loadFinish = true
    })

    if (countRemoveDoneFeatures) {
      query += '(' + queryRemoveDoneFeatures + ')->.doneMembers;\n'
      query += '(.resultMembers; - .doneMembers;)->.resultMembers;\n'
    }

    this.part = {
      properties: this.options.memberProperties,
      receiveObject: this.receiveObject.bind(this),
      checkFeatureCallback: this.checkFeatureCallback.bind(this),
      featureCallback: this.options.memberCallback,
      count: 0
    }

    query += '.resultMembers out ' + overpassOutOptions(this.part) + ';'

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
    super.receiveObject(ob)
    this.doneFeatures[ob.id] = ob
  }

  checkFeatureCallback (ob) {
    if (this.bounds && ob.intersects(this.bounds) === 0) {
      return false
    }

    return true
  }

  finishSubRequest (fun, subRequest) {
    fun.call(this.master, subRequest)

    if (keys(this.relations).length !== this.currentRelations.length) {
      this.loadFinish = false
    }
  }

  needLoad (fun) {
    const result = fun.call(this.master)

    if (result === true) {
      return true
    }

    return !this.loadFinish
  }

  mayFinish (fun) {
    const result = fun.call(this.master)

    if (result === false) {
      return false
    }

    return this.loadFinish
  }
}

module.exports = function (request) {
  return new RequestGetMembers(request)
}
