module.exports = function boundsToLokiQuery (bounds) {
  if (bounds.minlon <= bounds.maxlon) {
    return {
      $or: [ {
        minlat: { $lte: bounds.maxlat },
        minlon: { $lte: bounds.maxlon },
        maxlat: { $gte: bounds.minlat },
        maxlon: { $gte: bounds.minlon }
      }, {
        minlat: { $lte: bounds.maxlat },
        maxlat: { $gte: bounds.minlat },
        minlon: { $lte: bounds.maxlon },
        stretchLon180: { $eq: true }
      }, {
        minlat: { $lte: bounds.maxlat },
        maxlat: { $gte: bounds.minlat },
        maxlon: { $gte: bounds.minlon },
        stretchLon180: { $eq: true }
      } ]
    }
  } else {
    return {
      $or: [ {
        minlat: { $lte: bounds.maxlat },
        maxlat: { $gte: bounds.minlat },
        minlon: { $gte: 0 },
        maxlon: { $gte: bounds.minlon }
      }, {
        minlat: { $lte: bounds.maxlat },
        maxlat: { $gte: bounds.minlat },
        minlon: { $lte: bounds.maxlon },
        maxlon: { $lte: 0 }
      }, {
        minlat: { $lte: bounds.maxlat },
        maxlat: { $gte: bounds.minlat },
        stretchLon180: { $eq: true }
      } ]
    }
  }
}
