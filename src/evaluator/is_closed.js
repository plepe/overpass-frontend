const EF = require('../EvaluatorFunction')

module.exports = class EF_is_closed extends EF {
  eval (context) {
    if (context.type !== 'way') {
      return 0
    }

    if (context.members) {
      return context.members[0].id === context.members[context.members.length - 1].id ? 1 : 0
    }

    if (context.geometry) {
      return (context.geometry[0].lat === context.geometry[context.geometry.length - 1].lat &&
        context.geometry[0].lon === context.geometry[context.geometry.length - 1].lon)
        ? 1
        : 0
    }
  }
}
