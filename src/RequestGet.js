const Request = require('./Request')
const defines = require('./defines')
const BoundingBox = require('boundingbox')
const overpassOutOptions = require('./overpassOutOptions')
const RequestGetMembers = require('./RequestGetMembers')
const isGeoJSON = require('./isGeoJSON')
const isodate = require('./isodate')

/**
 * A get request (request list of map features by id)
 * @extends Request
 */
class RequestGet extends Request {
  /**
   * @param {OverpassFrontend} overpass
   * @param {data} data
   */
  constructor (overpass, data) {
    super(overpass, data)
    this.type = 'get'

    if (typeof this.ids === 'string') {
      this.ids = [this.ids]
    } else {
      this.ids = this.ids.concat()
    }

    if (typeof this.options.properties === 'undefined') {
      this.options.properties = defines.DEFAULT
    }
    if (this.overpass.options.attic) {
      this.options.properties |= defines.META
    }
    if (this.options.date) {
      this.options.date = isodate(this.options.date)
    } else {
      this.options.date = null
    }

    if (this.options.bounds) {
      if (isGeoJSON(this.options.bounds)) {
        this.geojsonBounds = this.options.bounds
      }

      this.options.bounds = new BoundingBox(this.options.bounds)
    } else if (this.options.bbox) {
      this.options.bounds = new BoundingBox(this.options.bbox)
      delete this.options.bbox
      console.error('OverpassFrontend.get(): option "bbox" is deprecated, use "bounds" instead')
    }
    // option 'split' not available for get requests -> use effort instead
    delete this.options.split

    this.done = {}
    this.todoNextCall = []

    if ('members' in this.options) {
      RequestGetMembers(this)
    }
  }

  willInclude (context) {
    if (!super.willInclude(context)) {
      return false
    }

    if (context.date === undefined) {
      context.date = this.options.date
    } else {
      if (context.date !== this.options.date) {
        return false
      }
    }

    return true
  }

  _effortForId (id) {
    if (!id) {
      return null
    }

    const type = id.substr(0, 1)
    switch (type) {
      case 'n':
        return this.overpass.options.effortNode
      case 'w':
        return this.overpass.options.effortWay
      case 'r':
        return this.overpass.options.effortRelation
    }
  }

  /**
   * how much effort can a call to this request use
   * @return {Request#minMaxEffortResult} - minimum and maximum effort
   */
  minMaxEffort () {
    const todo = this.ids.filter(x => x)

    if (todo.length === 0) {
      return { minEffort: 0, maxEffort: 0 }
    }

    const minEffort = Math.min.apply(this, todo.map(id => this._effortForId(id)))
    const maxEffort = todo.map(id => this._effortForId(id)).reduce((a, b) => a + b)

    return { minEffort, maxEffort }
  }

  /**
   * check if there are any map features which can be returned right now
   */
  preprocess () {
    this.allFound = true
    this.todoNextCall = []

    this.ids.forEach((id, i) => {
      if (id === null) { return }

      // Illegal ID
      if (id !== null && !id.match(/^[nwr][0-9]+$/)) {
        this.featureCallback(null, null, i)
        this.ids[i] = null
        return
      }

      const ob = this.overpass.cache.get(id, this.options)

      // Feature does not exist!
      if (ob) {
        let ready = true

        // for bounds option, if object is (partly) loaded, but outside call
        // featureCallback with 'false'
        if (this.options.bounds) {
          const intersects = this.geojsonBounds ? ob.intersects(this.geojsonBounds) : ob.intersects(this.options.bounds)
          if (intersects === 0 || (!ob.bounds && ob.properties | defines.BBOX)) {
            this.featureCallback(null, false, i)
            this.ids[i] = null
            return
          }
        }

        // not fully loaded
        if ((this.options.properties & ob.properties) !== this.options.properties) {
          ready = false
        }

        // if sort is set in options maybe defer calling featureCallback
        if (ready) {
          this.featureCallback(null, ob, i)
          this.ids[i] = null
          return
        }

        this.todoNextCall.push(id)
      } else if (ob === false) {
        this.featureCallback(null, null, i)
        this.ids[i] = null
        return
      } else if (ob !== undefined) {
        this.todoNextCall.push(id)
      }

      this.allFound = false
    })
  }

  /**
   * compile the query
   * @param {OverpassFrontend#Context} context - Current context
   * @return {Request#SubRequest} - the compiled query
   */
  _compileQuery (context) {
    let query = ''
    let nodeQuery = ''
    let wayQuery = ''
    let relationQuery = ''
    let BBoxQuery = ''
    let effort = 0
    let outOptions

    if (this.options.bounds) {
      BBoxQuery = '(' + this.options.bounds.toLatLonString() + ')'
    }

    this.todoNextCall.forEach(id => {
      outOptions = overpassOutOptions(this.options)

      if (effort > context.maxEffort) {
        return
      }

      if (id === null) {
        return
      }

      // don't load objects multiple times in same context
      if (id in context.todo) {
        return
      }

      if (this.options.bounds) {
        // check if we already know the bounds of the element; if yes, don't try
        // to load object if it does not intersect bounds
        const ob = this.overpass.cache.get(id, this.options)
        if (ob && ob.properties & defines.BBOX) {
          if (!ob.intersects(this.options.bounds)) {
            return
          }
        }
      }

      switch (id.substr(0, 1)) {
        case 'n':
          nodeQuery += 'node(' + id.substr(1) + ');\n'
          effort += this.overpass.options.effortNode
          break
        case 'w':
          wayQuery += 'way(' + id.substr(1) + ');\n'
          effort += this.overpass.options.effortWay
          break
        case 'r':
          relationQuery += 'relation(' + id.substr(1) + ');\n'
          effort += this.overpass.options.effortRelation
          break
      }

      context.todo[id] = true
    })

    if (nodeQuery !== '') {
      query += '((' + nodeQuery + ');)->.n;\n'
      if (BBoxQuery) {
        query += '(node.n; - node.n' + BBoxQuery + '->.n;);\nout ids bb qt;\n'
      }
    }

    if (wayQuery !== '') {
      query += '((' + wayQuery + ');)->.w;\n'
      if (BBoxQuery) {
        query += '(way.w; - way.w' + BBoxQuery + '->.w;);\nout ids bb qt;\n'
      }
    }

    if (relationQuery !== '') {
      query += '((' + relationQuery + ');)->.r;\n'
      if (BBoxQuery) {
        query += '(relation.r; - relation.r' + BBoxQuery + '->.r;);\nout ids bb qt;\n'
      }
    }

    const requestParts = []
    if (BBoxQuery && (nodeQuery !== '' || wayQuery !== '' || relationQuery !== '')) {
      // additional separator to separate objects outside bbox from inside bbox
      query += 'out count;\n'

      requestParts.push({
        properties: defines.BBOX,
        bounds: this.options.bounds,
        boundsNoMatch: true
      })
    }
    if (nodeQuery !== '') {
      query += '.n out ' + outOptions + ';\n'
    }
    if (wayQuery !== '') {
      query += '.w out ' + outOptions + ';\n'
    }
    if (relationQuery !== '') {
      query += '.r out ' + outOptions + ';\n'
    }

    if (query) {
      requestParts.push({
        properties: this.options.properties,
        receiveObject: this.receiveObject.bind(this),
        checkFeatureCallback: this.checkFeatureCallback.bind(this),
        featureCallback: this._featureCallback.bind(this, this.featureCallback)
      })
    }

    const subRequest = {
      query,
      effort: effort,
      request: this,
      parts: requestParts
    }

    return subRequest
  }

  checkFeatureCallback (ob) {
    if (this.geojsonBounds && ob.intersects(this.geojsonBounds) === 0) {
      return false
    }

    return true
  }

  _featureCallback (fun, err, ob) {
    const indexes = []
    let p

    while ((p = this.ids.indexOf(ob.id)) !== -1) {
      this.ids[p] = null
      indexes.push(p)
    }

    if (this.options.bounds && !ob.intersects(this.options.bounds)) {
      indexes.forEach(p => fun(null, false, p))
      return
    }

    indexes.forEach(p => fun(null, ob, p))
  }

  needLoad () {
    this.preprocess()

    return this.allFound
  }

  mayFinish () {
    return this.allFound
  }
}

module.exports = RequestGet
