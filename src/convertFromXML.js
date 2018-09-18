module.exports = function convertFromXML (xml) {
  let result = {
    elements: []
  }

  let current = xml.firstChild
  while (current) {
    let element = {}

    if (current.nodeName === 'node' || current.nodeName === 'way' || current.nodeName === 'relation') {
      element.type = current.nodeName
      element.id = current.getAttribute('id')
      element.tags = {}

      if (element.type === 'node') {
        element.lat = current.getAttribute('lat')
        element.lon = current.getAttribute('lon')
      } else if (element.type === 'way') {
        element.nodes = []
      } else if (element.type === 'relation') {
        element.members = []
      }

      let child = current.firstChild
      while (child) {
        if (child.nodeName === 'tag') {
          element.tags[child.getAttribute('k')] = child.getAttribute('v')
        } else if (child.nodeName === 'member') {
          element.members.push({
            type: child.getAttribute('type'),
            ref: child.getAttribute('ref'),
            role: child.getAttribute('role')
          })
        } else if (child.nodeName === 'nd') {
          element.nodes.push(child.getAttribute('ref'))
        }

        child = child.nextSibling
      }

      result.elements.push(element)
    }

    current = current.nextSibling
  }

  return result
}
