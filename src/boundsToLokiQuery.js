module.exports = function boundsToLokiQuery (bounds) {
  if (bounds.minlon <= bounds.maxlon) {
    return {
      minlat: { $lte: bounds.maxlat },
      minlon: { $lte: bounds.maxlon },
      maxlat: { $gte: bounds.minlat },
      maxlon: { $gte: bounds.minlon }
    }
  } else {
    return {
      $or: [ {
        minlat: { $lte: bounds.maxlat },
        maxlat: { $gte: bounds.minlat },
        maxlon: { $gte: bounds.minlon }
      }, {
        minlat: { $lte: bounds.maxlat },
        maxlat: { $gte: bounds.minlat },
        minlon: { $lte: bounds.maxlon }
      } ]
    }
  }
}
