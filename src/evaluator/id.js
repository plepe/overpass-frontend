const EF = require('../EvaluatorFunction')

module.exports = class EF_id extends EF {
  eval (context) {
    return context.osm_id
  }

  compileLokiJS () {
    return { osm_id: { $exists: true } }
  }
}
