var Overpass = require('./Overpass')

function OverpassObject() {
  this.data = {};
  this.properties = 0;
}

OverpassObject.prototype.update_data = function(data, request) {
  console.log(request)
  if(typeof this.id == 'undefined') {
    this.id = data.type.substr(0, 1) + data.id;
    this.type = data.type;
    this.osm_id = data.id;
  }

  for(var k in data)
    this.data[k] = data[k];

  if(data.bounds) {
//    this.bounds = L.latLngBounds(
//      L.latLng(data.bounds.minlat, data.bounds.minlon),
//      L.latLng(data.bounds.maxlat, data.bounds.maxlon)
//    );
    //this.center = this.bounds.getCenter();
  }
  else if(data.center) {
    // this.bounds = L.latLng(data.center.lat, data.center.lon);
  }

  if(request.options.bbox) {
    if(!this.bounds || request.options.bbox.intersects(this.bounds))
      this.properties = this.properties | request.options.properties;
    else
      this.properties = this.properties | Overpass.BBOX | Overpass.CENTER;
  }
  else {
    this.properties = this.properties | request.options.properties;
  }

  if(request.options.properties & Overpass.TAGS) {
    if(typeof data.tags == 'undefined')
      this.tags = {};
    else
      this.tags = data.tags;
  }
  this.errors = [];

  if(data.timestamp) {
    this.meta = {
      timestamp: data.timestamp,
      version: data.version,
      changeset: data.changeset,
      user: data.user,
      uid: data.uid
    };
  }

  if(data.tags) {
    this.tags = data.tags;
  }
}

OverpassObject.prototype.title = function() {
  if(!this.tags)
    return this.id;

  return this.tags.name || this.tags.operator || this.tags.ref;
}

module.exports = OverpassObject
