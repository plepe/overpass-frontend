module.exports = function boundsToLokiQuery (bounds) {
  return {
    minlat: { $lte: bounds.maxlat },
    minlon: { $lte: bounds.maxlon },
    maxlat: { $gte: bounds.minlat },
    maxlon: { $gte: bounds.minlon }
  }
}
