function OverpassBounds(bounds) {
  if(bounds instanceof OverpassBounds) {
    this.bounds = bounds.bounds
    return
  }

  this.bounds = bounds;

  if(this.bounds.lat) {
    this.bounds.minlat = this.bounds.lat
    this.bounds.maxlat = this.bounds.lat
    delete(this.bounds.lat)
  }

  if(this.bounds.lon) {
    this.bounds.minlon = this.bounds.lon
    this.bounds.maxlon = this.bounds.lon
    delete(this.bounds.lon)
  }

  if(this.bounds.maxlat < this.bounds.minlat) {
    var h = this.bounds.minlat
    this.bounds.minlat = this.bounds.maxlat
    this.bounds.maxlat = h
  }

  if(this.bounds.maxlon < this.bounds.minlon) {
    var h = this.bounds.minlon
    this.bounds.minlon = this.bounds.maxlon
    this.bounds.maxlon = h
  }
}

OverpassBounds.prototype.intersects = function(other) {
  other = new OverpassBounds(other);

  if(other.bounds.maxlat < this.bounds.minlat)
    return false;

  if(other.bounds.minlat > this.bounds.maxlat)
    return false;

  if(other.bounds.maxlon < this.bounds.minlon)
    return false;

  if(other.bounds.minlon > this.bounds.maxlon)
    return false;

  return true;
}

if(typeof module != 'undefined' && module.exports)
  module.exports = OverpassBounds
