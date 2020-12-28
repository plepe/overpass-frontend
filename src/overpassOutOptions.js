const defines = require('./defines')

function overpassOutOptions (options, optionsOverride) {
  let outOptions = ''

  if ('split' in options && options.split > 0) {
    outOptions += options.split + ' '
  } else if ('effortSplit' in options) {
    outOptions += options.effortSplit + ' '
  }

  if (options.properties & defines.META) {
    outOptions += 'meta '
  } else if (options.properties & defines.TAGS) {
    if (options.properties & defines.MEMBERS) {
      outOptions += 'body '
    } else {
      outOptions += 'tags '
    }
  } else if (options.properties & defines.MEMBERS) {
    outOptions += 'skel '
  } else {
    outOptions += 'ids '
  }

  if (options.properties & defines.GEOM) {
    outOptions += 'geom '
  } else if (options.properties & defines.BBOX) {
    outOptions += 'bb '
  } else if (options.properties & defines.CENTER) {
    outOptions += 'center '
  }

  outOptions += 'qt'

  return outOptions
}

module.exports = overpassOutOptions
