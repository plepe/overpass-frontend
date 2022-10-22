const EvaluatorFunction = require('../EvaluatorFunction')
const OverpassFrontend = require('../defines')

module.exports = class EvaluatorFunctionCountTags extends EvaluatorFunction {
  constructor (fun, parameters) {
    super(fun, parameters)
    this.requestProperties = OverpassFrontend.MEMBERS
  }

  eval (context) {
    const c = {}
    let v

    switch (this.fun) {
      case 'count_members':
        return context.members.length
      case 'count_by_role':
        v = this.parameters[0].eval(context)
        return context.members.filter(m => m.role === v).length
      case 'count_distinct_members':
        context.members.forEach(m => { c[m.id] = true })
        return Object.keys(c).length
      case 'count_distinct_by_role':
        v = this.parameters[0].eval(context)
        context.members
          .filter(m => m.role === v)
          .forEach(m => { c[m.id] = true })
        return Object.keys(c).length
    }
  }
}
