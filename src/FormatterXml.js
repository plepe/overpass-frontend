const BoundingBox = require('boundingbox')
const DOMParser = require('@xmldom/xmldom').DOMParser
const XMLSerializer = require('@xmldom/xmldom').XMLSerializer
const packageInfo = require('../version.json')

let domParser, xmlSerializer
const generator = packageInfo.name + ' ' + packageInfo.version

module.exports = class FormatterXml {
  constructor (overpass) {
    this.overpass = overpass

    if (!domParser) {
      domParser = new DOMParser({
        errorHandler: {
          error: (err) => { throw new Error('Error parsing XML file: ' + err) },
          fatalError: (err) => { throw new Error('Error parsing XML file: ' + err) }
        }
      })
      xmlSerializer = new XMLSerializer()
    }

    this.xml = domParser.parseFromString('<?xml version="1.0" encoding="UTF-8"?>\n<osm/>', 'text/xml')
    this.document = this.xml.ownerDocument

    this.osm = this.document.getElementsByTagName('osm')[0]
    this.osm.setAttribute('version', '0.6')
    this.osm.setAttribute('generator', '')

    const blank = this.document.createTextNode('\n')
    this.osm.appendChild(blank)

    this.updateMeta()
  }

  setBounds (bbox) {
    const blank = this.document.createTextNode('\n')
    this.osm.appendChild(blank)

    const bounds = new BoundingBox(bbox)
    const node = this.document.createElement('bounds')
    node.setAttribute('minlat', bounds.minlat.toFixed(7))
    node.setAttribute('minlon', bounds.minlon.toFixed(7))
    node.setAttribute('maxlat', bounds.maxlat.toFixed(7))
    node.setAttribute('maxlon', bounds.maxlon.toFixed(7))
    this.osm.appendChild(node)
  }

  pushFeature (ob, outOptions) {
    const element = ob.outXml(outOptions, this.document)
    this.osm.appendChild(element)

    const blank = this.document.createTextNode('\n')
    this.osm.appendChild(blank)
  }

  formatFeature (ob, outOptions) {
    const element = ob.outXml(outOptions, this.document)
    return xmlSerializer.serializeToString(element)
  }

  pushCount (counts) {
    const element = this.document.createElement('count')
    element.setAttribute('id', 0)

    Object.entries(counts).forEach(([type, c]) => {
      const blank = this.document.createTextNode('\n  ')
      element.appendChild(blank)

      const tag = this.document.createElement('tag')
      tag.setAttribute('k', type)
      tag.setAttribute('v', c)
      element.appendChild(tag)
    })

    let blank = this.document.createTextNode('\n')
    element.appendChild(blank)

    this.osm.appendChild(element)

    blank = this.document.createTextNode('\n')
    this.osm.appendChild(blank)
  }

  finalize () {
    this.updateMeta()

    return xmlSerializer.serializeToString(this.xml)
  }

  httpHeaders () {
    return {
      'Content-Type': 'application/osm3s+xml'
    }
  }

  updateMeta () {
    const meta = this.overpass.meta ?? {}

    Object.entries(meta).forEach(([k, v]) => {
      if (k !== 'bounds') {
        this.osm.setAttribute(k, v)
      }
    })

    this.osm.setAttribute('generator', (meta.generator ? meta.generator + ' via ' : '') + generator)
  }
}
