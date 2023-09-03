const turf = require('./turf')

module.exports = function cacheMerge (a, b) {
  const r = {}
  for (const k in a) {
    r[k] = a[k]
  }
  r.filters += b.filters
  r.properties |= b.properties

  if (b.type) {
    if (a.type && a.type !== b.type) {
      r.type = '-'
    } else {
      r.type = b.type
    }
  }

  if (b.ids) {
    r.ids = b.ids
    if (a.ids) {
      r.ids = b.ids.filter(n => a.ids.includes(n))
    }
  }

  if (b.invalid) {
    r.invalid = true
  }

  if (b.recurse) {
    r.recurse = (r.recurse ?? []).concat(b.recurse)
  }

  if (b.bounds && a.bounds) {
    const mergeBounds = turf.intersect(a.bounds, b.bounds)
    if (mergeBounds) {
      r.bounds = mergeBounds.geometry
    } else {
      r.invalid = true
      delete r.bounds
    }
  } else if (b.bounds) {
    r.bounds = b.bounds
  }

  return r
}
