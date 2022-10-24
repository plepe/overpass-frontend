const EvaluatorFunction = require('../EvaluatorFunction')
const OverpassFrontend = require('../defines')

module.exports = class EvaluatorFunctionMeta extends EvaluatorFunction {
  constructor (fun, parameters) {
    super(fun, parameters)
    if (['id', 'type'].includes(this.fun)) {
      this.requestProperties = OverpassFrontend.ID_ONLY
    } else {
      this.requestProperties = OverpassFrontend.META
    }
  }

  eval (context) {
    switch (this.fun) {
      case 'id': return context.osm_id
      case 'type': return context.type
      case 'version': return context.meta && context.meta.version
      case 'timestamp': return context.meta && context.meta.timestamp
      case 'changeset': return context.meta && context.meta.changeset
      case 'uid': return context.meta && context.meta.uid
      case 'user': return context.meta && context.meta.user
    }
  }

  compileLokiJS () {
    switch (this.fun) {
      case 'id': return { osm_id: { $exists: true } }
      case 'type': return { type: { $exists: true } }
      case 'version': return { 'osmMeta.version': { $exists: true } }
      case 'timestamp': return { 'osmMeta.timestamp': { $exists: true } }
      case 'changeset': return { 'osmMeta.changeset': { $exists: true } }
      case 'uid': return { 'osmMeta.uid': { $exists: true } }
      case 'user': return { 'osmMeta.user': { $exists: true } }
    }
  }
}
