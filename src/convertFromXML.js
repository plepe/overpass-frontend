module.exports = function convertFromXML (xml) {
  let result = {
    version: parseFloat(xml.getAttribute('version')),
    generator: xml.getAttribute('generator'),
    osm3s: {},
    elements: []
  }

  let notes = xml.getElementsByTagName('note')
  if (notes.length) {
    result.osm3s.copyright = notes[0].textContent
  }

  let metas = xml.getElementsByTagName('meta')
  if (metas.length) {
    result.osm3s['timestamp_osm_base'] = metas[0].getAttribute('osm_base')
    if (metas[0].hasAttribute('areas')) {
      result.osm3s['timestamp_areas_base'] = metas[0].getAttribute('areas')
    }
  }

  let current = xml.firstChild
  while (current) {
    let element = {}

    if (current.nodeName === 'node' || current.nodeName === 'way' || current.nodeName === 'relation') {
      element.type = current.nodeName
      element.id = parseInt(current.getAttribute('id'))
      element.changeset = parseInt(current.getAttribute('changeset'))
      element.timestamp = current.getAttribute('timestamp')
      element.user = current.getAttribute('user')
      element.uid = parseInt(current.getAttribute('uid'))
      element.version = parseInt(current.getAttribute('version'))

      if (element.type === 'node') {
        element.lat = parseFloat(current.getAttribute('lat'))
        element.lon = parseFloat(current.getAttribute('lon'))
      } else if (element.type === 'way') {
        element.nodes = []
      } else if (element.type === 'relation') {
        element.members = []
      }

      let child = current.firstChild
      while (child) {
        if (child.nodeName === 'tag') {
          if (!('tags' in element)) {
            element.tags = {}
          }

          element.tags[child.getAttribute('k')] = child.getAttribute('v')
        } else if (child.nodeName === 'member') {
          element.members.push({
            type: child.getAttribute('type'),
            ref: parseInt(child.getAttribute('ref')),
            role: child.getAttribute('role')
          })
        } else if (child.nodeName === 'nd') {
          element.nodes.push(parseInt(child.getAttribute('ref')))
        }

        child = child.nextSibling
      }

      result.elements.push(element)
    }

    current = current.nextSibling
  }

  return result
}
