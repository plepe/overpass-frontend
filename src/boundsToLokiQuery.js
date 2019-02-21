module.exports = function boundsToLokiQuery (bounds, overpass) {
  if (bounds.minlon <= bounds.maxlon) {
    if (overpass.hasStretchLon180) {
      return {
        minlat: { $lte: bounds.maxlat },
        maxlat: { $gte: bounds.minlat },
        $or: [ {
          minlon: { $lte: bounds.maxlon },
          maxlon: { $gte: bounds.minlon }
        }, {
          minlon: { $lte: bounds.maxlon },
          stretchLon180: { $eq: true }
        }, {
          maxlon: { $gte: bounds.minlon },
          stretchLon180: { $eq: true }
        } ]
      }
    } else {
      return {
        minlat: { $lte: bounds.maxlat },
        minlon: { $lte: bounds.maxlon },
        maxlat: { $gte: bounds.minlat },
        maxlon: { $gte: bounds.minlon }
      }
    }
  } else {
    let result = {
      minlat: { $lte: bounds.maxlat },
      maxlat: { $gte: bounds.minlat },
      $or: [ {
        minlon: { $gte: 0 },
        maxlon: { $gte: bounds.minlon }
      }, {
        minlon: { $lte: bounds.maxlon },
        maxlon: { $lte: 0 }
      } ]
    }

    if (overpass.hasStretchLon180) {
      result.$or.push({
        stretchLon180: { $eq: true }
      })
    }

    return result
  }
}
