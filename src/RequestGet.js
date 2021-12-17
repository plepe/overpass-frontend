const Request = require('./Request')
const defines = require('./defines')
const BoundingBox = require('boundingbox')
const overpassOutOptions = require('./overpassOutOptions')
const RequestGetMembers = require('./RequestGetMembers')

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

    for (let i = 0; i < this.ids.length; i++) {
      if (this.ids[i] in this.overpass.cacheElements && this.overpass.cacheElements[this.ids[i]] === false) {
        delete this.overpass.cacheElements[this.ids[i]]
      }
    }

    if (this.options.bbox) {
      this.options.bbox = new BoundingBox(this.options.bbox)
    }
    // option 'split' not available for get requests -> use effort instead
    delete this.options.split

    this.done = {}

    if ('members' in this.options) {
      RequestGetMembers(this)
    }
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

    for (let i = 0; i < this.ids.length; i++) {
      const id = this.ids[i]

      if (id === null) {
        continue
      }

      if (id in this.overpass.cacheElements) {
        const ob = this.overpass.cacheElements[id]
        let ready = true

        // Feature does not exists!
        if (ob.missingObject) {
          this.featureCallback(null, null, i)
          this.ids[i] = null
          continue
        }

        // for bbox option, if object is (partly) loaded, but outside call
        // featureCallback with 'false'
        if (this.options.bbox) {
          const intersects = ob.intersects(this.options.bbox)
          if (intersects === 0 || (!ob.bounds && ob.properties | defines.BBOX)) {
            this.featureCallback(null, false, i)
            this.ids[i] = null
            continue
          }
        }

        // not fully loaded
        if ((ob !== false && ob !== null) && (this.options.properties & ob.properties) !== this.options.properties) {
          ready = false
        }

        // if sort is set in options maybe defer calling featureCallback
        if (ready) {
          this.featureCallback(null, ob, i)
          this.ids[i] = null
          continue
        }
      } else {
        // Illegal ID
        if (id !== null && !id.match(/^[nwr][0-9]+$/)) {
          this.featureCallback(null, null, i)
          this.ids[i] = null
          continue
        }
      }

      this.allFound = false
    }
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

    if (this.options.bbox) {
      BBoxQuery = '(' + this.options.bbox.toLatLonString() + ')'
    }

    for (let i = 0; i < this.ids.length; i++) {
      const id = this.ids[i]
      outOptions = overpassOutOptions(this.options)

      if (effort > context.maxEffort) {
        break
      }

      if (id === null) {
        continue
      }

      // don't load objects multiple times in same context
      if (id in context.todo) {
        continue
      }

      if (this.options.bbox) {
        // check if we already know the bbox of the element; if yes, don't try
        // to load object if it does not intersect bounds
        if (id in this.overpass.cacheElements && (this.overpass.cacheElements[id].properties & defines.BBOX)) {
          if (!this.overpass.cacheElements[id].intersects(this.options.bbox)) {
            continue
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
    }

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
        bbox: this.options.bbox,
        bboxNoMatch: true
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

  _featureCallback (fun, err, ob) {
    const indexes = []
    let p

    while ((p = this.ids.indexOf(ob.id)) !== -1) {
      this.ids[p] = null
      indexes.push(p)
    }

    if (this.options.bbox && !ob.intersects(this.options.bbox)) {
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
