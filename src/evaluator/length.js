const turf = require('../turf')
const EvaluatorFunction = require('../EvaluatorFunction')

module.exports = class EvaluatorFunctionLength extends EvaluatorFunction {
  eval (context) {
    if ('geomLength' in context.dbData) {
      return context.dbData.geomLength
    } else {
      const g = context.GeoJSON()
      if (g && g.geometry) {
        const geomLength = turf.length(g, { units: 'kilometers' }) * 1000
        context.dbSet({ geomLength })
        return geomLength
      }
    }
    return null
  }

  compileLokiJS (param) {
    return { needMatch: true }
  }
}
