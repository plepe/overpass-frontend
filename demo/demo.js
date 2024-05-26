var map
var overpass
var downloadResult
var templateSelector
var request
var current_objects = {}
var form
var formValues = {
  file: ''
}

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
    const options = {
      properties: OverpassFrontend.ALL
    }

    compileTemplate(
      templateSelector.value,
      {
        __URL__: JSON.stringify(form.elements.url.value),
        __BBOXQUERY_PARAMS__:
        JSON.stringify(form.elements.query.value) + ',\n' +
        indent(JSON.stringify(bounds, null, '  ')) + ',\n' +
        indent(JSON.stringify(options, null, '  ')) + ',',
        __BBOX_LEAFLET__:
          JSON.stringify([[bounds.minlat, bounds.minlon], [bounds.maxlat, bounds.maxlon]])
      },
      (err, code) => {
        codeDisplay.value = code

        downloadResult.download = templateSelector.selectedOptions[0].getAttribute('data-filename')
        downloadResult.title = "Download Code Example"
        downloadResult.href = "data:text/plain;charset=UTF-8," + encodeURIComponent(code)
      }
    )
  }
}

function clear_map () {
  for (var k in current_objects) {
    map.removeLayer(current_objects[k].feature)
  }
  current_objects = {}
}

window.onload = function() {
  map = L.map('map')

  var osm_mapnik = L.tileLayer('//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
      maxZoom: 19,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }
  )
  osm_mapnik.addTo(map)

  form = document.getElementById('form')

  if (form.elements.lat.value !== '' && form.elements.lng.value !== '') {
    map.setView([form.elements.lat.value, form.elements.lng.value], form.elements.zoom.value || 18)
  } else {
    map.setView([51.505, -0.09], 18)

    const center = map.getCenter()
    form.elements.lat.value = center.lat.toFixed(5)
    form.elements.lng.value = center.lng.toFixed(5)
    form.elements.zoom.value = map.getZoom()
  }

  form.onsubmit = () => update()

  downloadResult = document.getElementById('download-result')
  templateSelector = document.getElementById('template')

  update()

  map.on('moveend', () => {
    const center = map.getCenter()
    form.elements.lat.value = center.lat.toFixed(5)
    form.elements.lng.value = center.lng.toFixed(5)
    form.elements.zoom.value = map.getZoom()

    if (overpass) {
      check_update_map()
    }
  })

  update()

  templateSelector.onchange = check_update_map
}

function update () {
  clear_map()

  map.setView([form.elements.lat.value, form.elements.lng.value], form.elements.zoom.value)

  if (form.elements.file.value !== formValues.file) {
    var reader = new FileReader()
    reader.onload = (e) => {
      overpass = new OverpassFrontend(e.target.result, {
        filename: form.elements.file.value
      })

      overpass.once('load', (data) => {
        if (data.bounds) {
          map.fitBounds(data.bounds.toLeaflet())
          check_update_map()
        }
      })
    }
    reader.readAsDataURL(form.elements.file.files[0])
  } else if (!overpass || form.elements.url.value !== formValues.url) {
    overpass = new OverpassFrontend(form.elements.url.value)
    overpass.once('load', (data) => {
      if (data.bounds) {
        map.fitBounds(data.bounds.toLeaflet())
      }
    })
  }

  formValues = {
    url: form.elements.url.value,
    file: form.elements.file.value
  }

  if (overpass) {
    check_update_map()
  }

  return false
}

function indent (str) {
  return '  ' + str.split(/\n/g).join('\n  ')
}

const templates = {}
function compileTemplate (template, replacements, callback) {
  if (!(template in templates)) {
    return fetch('code-templates/' + template)
      .then(req => req.text())
      .then(body => {
        templates[template] = body
        compileTemplate(template, replacements, callback)
      })
  }

  let result = templates[template]

  for (const k in replacements) {
    result = result.replace(k, replacements[k])
  }

  callback(null, result)
}
