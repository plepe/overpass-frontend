var map
var overpass
var request
var current_objects = {}
var form
var formValues = {}

function check_update_map () {
  var bounds = new BoundingBox(map.getBounds())

  // Hide loaded but non-visible objects
  for (var k in current_objects) {
    var ob = current_objects[k]

    if (!ob.intersects(bounds)) {
      map.removeLayer(ob.feature)
      delete(current_objects[k])
    }
  }

  // Abort current requests (in case they are long-lasting - we don't need them
  // anyway). Data which is being submitted will still be loaded to the cache.
  if (request) {
    request.abort()
  }

  // Query all trees in the current view
  request = overpass.BBoxQuery(form.elements.query.value, bounds,
    {
      properties: OverpassFrontend.ALL
    },
    function (err, ob) {
      if (!ob.feature) {
        ob.feature = ob.leafletFeature({
          nodeFeature: 'CircleMarker',
          color: 'red',
          fillColor: 'red',
          fillOpacity: 0.1,
          weight: 2,
          radius: 6
        })
        ob.feature.bindPopup('<pre>' + JSON.stringify(ob.GeoJSON(), null, '  ').replace(/\&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</pre>')
      }
      
      ob.feature.addTo(map)
      current_objects[ob.id] = ob
    },
    function (err) {
    }
  )

  const codeDisplay = document.getElementById('result')
  if (codeDisplay) {
    let code = 'const OverpassFrontend = require(\'overpass-frontend\')\n'
    code += 'const overpassFrontend = new OverpassFrontend(' + JSON.stringify(form.elements.url.value) + ')\n\n'

    const options = {
      properties: OverpassFrontend.ALL
    }
    code += 'const request = overpassFrontend.BBoxQuery(\n' +
      indent(JSON.stringify(form.elements.query.value)) + ',\n' +
      indent(JSON.stringify(bounds, null, '  ')) + ',\n' +
      indent(JSON.stringify(options, null, '  ')) + ',\n' +
      '  (err, feature) => console.log(feature.id, feature.tags),\n' +
      '  (err) => console.error(err)\n)'


    codeDisplay.value = code
  }
}

function clear_map () {
  for (var k in current_objects) {
    map.removeLayer(current_objects[k].feature)
  }
  current_objects = {}
}

window.onload = function() {
  map = L.map('map').setView([51.505, -0.09], 18)

  var osm_mapnik = L.tileLayer('//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
      maxZoom: 19,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }
  )
  osm_mapnik.addTo(map)

  form = document.getElementById('form')
  form.onsubmit = () => update()
  update()

  map.on('moveend', check_update_map)
  check_update_map()
}

function update () {
  clear_map()

  if (!overpass || form.elements.url.value !== formValues.url) {
    overpass = new OverpassFrontend(form.elements.url.value)
    overpass.once('load', (data) => {
      if (data.bounds) {
        map.fitBounds(data.bounds.toLeaflet())
      }
    })
  }

  formValues = {
    url: form.elements.url.value
  }

  check_update_map()
  return false
}

function indent (str) {
  return '  ' + str.split(/\n/g).join('\n  ')
}

