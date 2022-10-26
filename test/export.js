var fs = require('fs')
var conf = JSON.parse(fs.readFileSync('test/conf.json', 'utf8'));

if (!conf.generator) {
  console.error('Set correct "generator" string in test/conf.json!')
  process.exit(0)
}

var assert = require('assert')
var async = require('async')

var OverpassFrontend = require('../src/OverpassFrontend')
var BoundingBox = require('boundingbox')
var overpassFrontend = new OverpassFrontend(conf.url)
var DOMParser = require('@xmldom/xmldom').DOMParser
var XMLSerializer = require('@xmldom/xmldom').XMLSerializer
var document = new DOMParser().parseFromString('<xml></xml>', 'text/xml').documentElement

describe('Overpass exportGeoJSON', function() {
  describe('basic', function() {
    let toTest = {
      n647991: {"type":"Feature","id":"node/647991","properties":{"@id":"node/647991","bus":"yes","highway":"bus_stop","name":"Bahnhofstraße","network":"VOR","public_transport":"stop_position","railway":"tram_stop","wheelchair":"yes","@timestamp":"2016-05-06T21:44:24Z","@version":21,"@changeset":39152658,"@user":"emergency99","@uid":1832939,"@osm3s:version":0.6,"@osm3s:generator":conf.generator,"@osm3s:timestamp_osm_base":"","@osm3s:copyright":"The data included in this document is from www.openstreetmap.org. The data is made available under ODbL."},"geometry":{"type":"Point","coordinates":[16.2623007,48.201554]}},
      w4583628: {"type":"Feature","id":"way/4583628","properties":{"@id":"way/4583628","cycleway":"opposite_lane","highway":"living_street","lanes":"1","name":"Pelzgasse","oneway":"yes","@timestamp":"2014-04-07T20:10:24Z","@version":7,"@changeset":21559724,"@user":"Girolamo","@uid":908743,"@osm3s:version":0.6,"@osm3s:generator":conf.generator,"@osm3s:timestamp_osm_base":"","@osm3s:copyright":"The data included in this document is from www.openstreetmap.org. The data is made available under ODbL."},"geometry":{"type":"LineString","coordinates":[[16.3367061,48.1978377],[16.3359649,48.1990173]]}},
      w125586430: {"type":"Feature","id":"way/125586430","properties":{"@id":"way/125586430","building":"yes","location":"indoor","name":"Unterwerk Goldschlagstraße","note":"für U6","power":"substation","substation":"traction","voltage":"20000","@timestamp":"2015-10-22T17:38:19Z","@version":3,"@changeset":34804921,"@user":"42429","@uid":42429,"@osm3s:version":0.6,"@osm3s:generator":conf.generator,"@osm3s:timestamp_osm_base":"","@osm3s:copyright":"The data included in this document is from www.openstreetmap.org. The data is made available under ODbL."},"geometry":{"type":"Polygon","coordinates":[[[16.3381123,48.1995136],[16.3382679,48.1995372],[16.3382937,48.1995411],[16.3383551,48.1993668],[16.3381763,48.1993366],[16.3381123,48.1995136]]]}},
      r1530340: {"type":"Feature","id":"relation/1530340","properties":{"@id":"relation/1530340","restriction":"only_straight_on","type":"restriction","@timestamp":"2014-04-07T20:10:03Z","@version":3,"@changeset":21559724,"@user":"Girolamo","@uid":908743,"@osm3s:version":0.6,"@osm3s:generator":conf.generator,"@osm3s:timestamp_osm_base":"","@osm3s:copyright":"The data included in this document is from www.openstreetmap.org. The data is made available under ODbL."},"geometry":{"type":"GeometryCollection","geometries":[{"type":"Point","coordinates":[16.3382648,48.1982148]},{"type":"LineString","coordinates":[[16.3390104,48.1983967],[16.3387535,48.1983357],[16.3386136,48.1983024],[16.3384619,48.1982664],[16.3384203,48.198255],[16.3383811,48.1982449],[16.3382648,48.1982148]]},{"type":"LineString","coordinates":[[16.3377541,48.1980324],[16.338119,48.1981383],[16.3382648,48.1982148]]}]}},
      r2334391: {"type":"Feature","id":"relation/2334391","properties":{"@id":"relation/2334391","building":"yes","type":"multipolygon","@timestamp":"2012-08-06T03:08:07Z","@version":1,"@changeset":12628312,"@user":"KaiRo","@uid":17047,"@osm3s:version":0.6,"@osm3s:generator":conf.generator,"@osm3s:timestamp_osm_base":"","@osm3s:copyright":"The data included in this document is from www.openstreetmap.org. The data is made available under ODbL."},"geometry":{"type":"Polygon","coordinates":[[[16.3386374,48.1997241],[16.3387568,48.1994112],[16.3391364,48.1994774],[16.3394272,48.1995281],[16.3393112,48.1998359],[16.3391813,48.1998143],[16.3391895,48.1997874],[16.3391645,48.1997837],[16.3391556,48.19981],[16.3386374,48.1997241]],[[16.3390834,48.199634],[16.3388933,48.199601],[16.3388735,48.1996538],[16.3388471,48.1996494],[16.3388325,48.1996972],[16.3390013,48.1997271],[16.3389943,48.1997462],[16.3390377,48.1997532],[16.3390834,48.199634]]]}}
    }

    for (var id in toTest) {
      it(id, function (id, expected, done) {
        overpassFrontend.get(id,
          {
            properties: OverpassFrontend.ID_ONLY
          },
          (err, result) => {
            result.exportGeoJSON(
              {
              },
              (err, result) => {
                assert.deepEqual(result, expected)

                done()
              }
            )
          },
          (err) => {
          }
        )
      }.bind(this, id, toTest[id]))
    }
  })
})

describe('Overpass exportOSMXML', function() {
  describe('basic', function() {
    let toTest = {
      n647991: '<osm><node id="647991" version="21" timestamp="2016-05-06T21:44:24Z" changeset="39152658" uid="1832939" user="emergency99" lat="48.201554" lon="16.2623007"><tag k="bus" v="yes"/><tag k="highway" v="bus_stop"/><tag k="name" v="Bahnhofstraße"/><tag k="network" v="VOR"/><tag k="public_transport" v="stop_position"/><tag k="railway" v="tram_stop"/><tag k="wheelchair" v="yes"/></node></osm>',
      w4583628: '<osm><way id="4583628" version="7" timestamp="2014-04-07T20:10:24Z" changeset="21559724" uid="908743" user="Girolamo"><tag k="cycleway" v="opposite_lane"/><tag k="highway" v="living_street"/><tag k="lanes" v="1"/><tag k="name" v="Pelzgasse"/><tag k="oneway" v="yes"/><nd ref="16617007"/><nd ref="31257545"/></way><node id="16617007" version="11" timestamp="2015-07-04T19:38:39Z" changeset="32413423" uid="298560" user="evod" lat="48.1978377" lon="16.3367061"><tag k="highway" v="traffic_signals"/></node><node id="31257545" version="5" timestamp="2014-12-13T18:46:59Z" changeset="27448959" uid="298560" user="evod" lat="48.1990173" lon="16.3359649"/></osm>',
      w125586430: '<osm><way id="125586430" version="3" timestamp="2015-10-22T17:38:19Z" changeset="34804921" uid="42429" user="42429"><tag k="building" v="yes"/><tag k="location" v="indoor"/><tag k="name" v="Unterwerk Goldschlagstraße"/><tag k="note" v="für U6"/><tag k="power" v="substation"/><tag k="substation" v="traction"/><tag k="voltage" v="20000"/><nd ref="1394529557"/><nd ref="1853730873"/><nd ref="1394529559"/><nd ref="1394529555"/><nd ref="1394529554"/><nd ref="1394529557"/></way><node id="1394529557" version="2" timestamp="2012-08-06T03:08:11Z" changeset="12628312" uid="17047" user="KaiRo" lat="48.1995136" lon="16.3381123"/><node id="1853730873" version="1" timestamp="2012-08-06T03:07:51Z" changeset="12628312" uid="17047" user="KaiRo" lat="48.1995372" lon="16.3382679"/><node id="1394529559" version="2" timestamp="2012-08-06T03:08:11Z" changeset="12628312" uid="17047" user="KaiRo" lat="48.1995411" lon="16.3382937"/><node id="1394529555" version="2" timestamp="2012-08-06T03:08:11Z" changeset="12628312" uid="17047" user="KaiRo" lat="48.1993668" lon="16.3383551"/><node id="1394529554" version="2" timestamp="2012-08-06T03:08:11Z" changeset="12628312" uid="17047" user="KaiRo" lat="48.1993366" lon="16.3381763"/></osm>',
      r1530340: '<osm><relation id="1530340" version="3" timestamp="2014-04-07T20:10:03Z" changeset="21559724" uid="908743" user="Girolamo"><tag k="restriction" v="only_straight_on"/><tag k="type" v="restriction"/><member ref="378462" type="node" role="via"/><member ref="4583442" type="way" role="to"/><member ref="272668388" type="way" role="from"/></relation><node id="378462" version="8" timestamp="2012-08-06T03:08:12Z" changeset="12628312" uid="17047" user="KaiRo" lat="48.1982148" lon="16.3382648"><tag k="highway" v="traffic_signals"/></node><way id="4583442" version="13" timestamp="2014-08-23T18:33:19Z" changeset="24962130" uid="770238" user="Kevin Kofler"><tag k="fixme" v="yes"/><tag k="highway" v="secondary"/><tag k="lanes" v="7"/><tag k="lanes:backward" v="3"/><tag k="lanes:forward" v="4"/><tag k="lit" v="yes"/><tag k="maxspeed" v="50"/><tag k="name" v="Neubaugürtel"/><tag k="ref" v="B224"/><tag k="turn:lanes:backward" v="left|left|left"/><tag k="turn:lanes:forward" v="left|left|through|through"/><nd ref="378459"/><nd ref="3037431688"/><nd ref="3037431653"/><nd ref="2208875391"/><nd ref="270328331"/><nd ref="2213568001"/><nd ref="378462"/></way><way id="272668388" version="1" timestamp="2014-04-07T20:10:02Z" changeset="21559724" uid="908743" user="Girolamo"><tag k="highway" v="secondary"/><tag k="lanes" v="2"/><tag k="lit" v="yes"/><tag k="maxspeed" v="50"/><tag k="name" v="Felberstraße"/><tag k="oneway" v="yes"/><tag k="ref" v="B224"/><tag k="turn:lanes" v="through|through"/><nd ref="451666730"/><nd ref="1965238268"/><nd ref="378462"/></way><node id="378459" version="6" timestamp="2012-08-06T03:08:12Z" changeset="12628312" uid="17047" user="KaiRo" lat="48.1983967" lon="16.3390104"><tag k="highway" v="traffic_signals"/></node><node id="3037431688" version="1" timestamp="2014-08-23T18:33:19Z" changeset="24962130" uid="770238" user="Kevin Kofler" lat="48.1983357" lon="16.3387535"/><node id="3037431653" version="1" timestamp="2014-08-23T18:33:18Z" changeset="24962130" uid="770238" user="Kevin Kofler" lat="48.1983024" lon="16.3386136"/><node id="2208875391" version="1" timestamp="2013-03-18T20:11:20Z" changeset="15412757" uid="129531" user="almich" lat="48.1982664" lon="16.3384619"/><node id="270328331" version="7" timestamp="2013-03-18T20:11:25Z" changeset="15412757" uid="129531" user="almich" lat="48.198255" lon="16.3384203"/><node id="2213568001" version="1" timestamp="2013-03-21T20:09:33Z" changeset="15447432" uid="46912" user="ircecho" lat="48.1982449" lon="16.3383811"/><node id="451666730" version="3" timestamp="2014-04-07T20:10:26Z" changeset="21559724" uid="908743" user="Girolamo" lat="48.1980324" lon="16.3377541"/><node id="1965238268" version="3" timestamp="2015-07-04T19:38:39Z" changeset="32413423" uid="298560" user="evod" lat="48.1981383" lon="16.338119"><tag k="crossing" v="traffic_signals"/><tag k="highway" v="crossing"/></node></osm>',
      r2334391: '<osm><relation id="2334391" version="1" timestamp="2012-08-06T03:08:07Z" changeset="12628312" uid="17047" user="KaiRo"><tag k="building" v="yes"/><tag k="type" v="multipolygon"/><member ref="174711722" type="way" role="outer"/><member ref="174711721" type="way" role="inner"/></relation><way id="174711722" version="1" timestamp="2012-08-06T03:08:07Z" changeset="12628312" uid="17047" user="KaiRo"><nd ref="1853730919"/><nd ref="1853730863"/><nd ref="1853730867"/><nd ref="1853730872"/><nd ref="1853730957"/><nd ref="1853730951"/><nd ref="1853730947"/><nd ref="1853730945"/><nd ref="1853730950"/><nd ref="1853730919"/></way><way id="174711721" version="1" timestamp="2012-08-06T03:08:07Z" changeset="12628312" uid="17047" user="KaiRo"><nd ref="1853730891"/><nd ref="1853730882"/><nd ref="1853730902"/><nd ref="1853730898"/><nd ref="1853730911"/><nd ref="1853730920"/><nd ref="1853730931"/><nd ref="1853730932"/><nd ref="1853730891"/></way><node id="1853730919" version="1" timestamp="2012-08-06T03:07:53Z" changeset="12628312" uid="17047" user="KaiRo" lat="48.1997241" lon="16.3386374"/><node id="1853730863" version="1" timestamp="2012-08-06T03:07:51Z" changeset="12628312" uid="17047" user="KaiRo" lat="48.1994112" lon="16.3387568"/><node id="1853730867" version="1" timestamp="2012-08-06T03:07:51Z" changeset="12628312" uid="17047" user="KaiRo" lat="48.1994774" lon="16.3391364"/><node id="1853730872" version="1" timestamp="2012-08-06T03:07:51Z" changeset="12628312" uid="17047" user="KaiRo" lat="48.1995281" lon="16.3394272"/><node id="1853730957" version="1" timestamp="2012-08-06T03:07:55Z" changeset="12628312" uid="17047" user="KaiRo" lat="48.1998359" lon="16.3393112"/><node id="1853730951" version="1" timestamp="2012-08-06T03:07:54Z" changeset="12628312" uid="17047" user="KaiRo" lat="48.1998143" lon="16.3391813"/><node id="1853730947" version="1" timestamp="2012-08-06T03:07:54Z" changeset="12628312" uid="17047" user="KaiRo" lat="48.1997874" lon="16.3391895"/><node id="1853730945" version="1" timestamp="2012-08-06T03:07:54Z" changeset="12628312" uid="17047" user="KaiRo" lat="48.1997837" lon="16.3391645"/><node id="1853730950" version="1" timestamp="2012-08-06T03:07:54Z" changeset="12628312" uid="17047" user="KaiRo" lat="48.19981" lon="16.3391556"/><node id="1853730891" version="1" timestamp="2012-08-06T03:07:52Z" changeset="12628312" uid="17047" user="KaiRo" lat="48.199634" lon="16.3390834"/><node id="1853730882" version="1" timestamp="2012-08-06T03:07:52Z" changeset="12628312" uid="17047" user="KaiRo" lat="48.199601" lon="16.3388933"/><node id="1853730902" version="1" timestamp="2012-08-06T03:07:52Z" changeset="12628312" uid="17047" user="KaiRo" lat="48.1996538" lon="16.3388735"/><node id="1853730898" version="1" timestamp="2012-08-06T03:07:52Z" changeset="12628312" uid="17047" user="KaiRo" lat="48.1996494" lon="16.3388471"/><node id="1853730911" version="1" timestamp="2012-08-06T03:07:53Z" changeset="12628312" uid="17047" user="KaiRo" lat="48.1996972" lon="16.3388325"/><node id="1853730920" version="1" timestamp="2012-08-06T03:07:53Z" changeset="12628312" uid="17047" user="KaiRo" lat="48.1997271" lon="16.3390013"/><node id="1853730931" version="1" timestamp="2012-08-06T03:07:53Z" changeset="12628312" uid="17047" user="KaiRo" lat="48.1997462" lon="16.3389943"/><node id="1853730932" version="1" timestamp="2012-08-06T03:07:53Z" changeset="12628312" uid="17047" user="KaiRo" lat="48.1997532" lon="16.3390377"/></osm>'
    }

    for (var id in toTest) {
      it(id, function (id, expected, done) {
        overpassFrontend.get(id,
          {
            properties: OverpassFrontend.ID_ONLY
          },
          (err, result) => {
            let osm = document.ownerDocument.createElement('osm')

            result.exportOSMXML(
              {
              },
              osm,
              (err, result) => {
                let serializer = new XMLSerializer()
                let text = serializer.serializeToString(osm)

                assert.deepEqual(text, expected)

                done()
              }
            )
          },
          (err) => {
          }
        )
      }.bind(this, id, toTest[id]))
    }
  })
})

describe('Overpass exportOSMJSON', function() {
  describe('basic', function() {
    let toTest = {
      n647991: {"n647991":{"type":"node","id":647991,"version":21,"timestamp":"2016-05-06T21:44:24Z","changeset":39152658,"uid":1832939,"user":"emergency99","tags":{"bus":"yes","highway":"bus_stop","name":"Bahnhofstraße","network":"VOR","public_transport":"stop_position","railway":"tram_stop","wheelchair":"yes"},"lat": 48.201554,"lon": 16.2623007}},
      w4583628: {"w4583628":{"type":"way","id":4583628,"version":7,"timestamp":"2014-04-07T20:10:24Z","changeset":21559724,"uid":908743,"user":"Girolamo","tags":{"cycleway":"opposite_lane","highway":"living_street","lanes":"1","name":"Pelzgasse","oneway":"yes"},"nodes":[16617007,31257545]},"n16617007":{"type":"node","id":16617007,"version":11,"timestamp":"2015-07-04T19:38:39Z","changeset":32413423,"uid":298560,"user":"evod","tags":{"highway":"traffic_signals"},"lat":48.1978377,"lon":16.3367061},"n31257545":{"type":"node","id":31257545,"version":5,"timestamp":"2014-12-13T18:46:59Z","changeset":27448959,"uid":298560,"user":"evod","lat":48.1990173,"lon":16.3359649}},
      w125586430: {"w125586430":{"type":"way","id":125586430,"version":3,"timestamp":"2015-10-22T17:38:19Z","changeset":34804921,"uid":42429,"user":"42429","tags":{"building":"yes","location":"indoor","name":"Unterwerk Goldschlagstraße","note":"für U6","power":"substation","substation":"traction","voltage":"20000"},"nodes":[1394529557,1853730873,1394529559,1394529555,1394529554,1394529557]},"n1394529557":{"type":"node","id":1394529557,"version":2,"timestamp":"2012-08-06T03:08:11Z","changeset":12628312,"uid":17047,"user":"KaiRo","lat":48.1995136,"lon":16.3381123},"n1853730873":{"type":"node","id":1853730873,"version":1,"timestamp":"2012-08-06T03:07:51Z","changeset":12628312,"uid":17047,"user":"KaiRo","lat":48.1995372,"lon":16.3382679},"n1394529559":{"type":"node","id":1394529559,"version":2,"timestamp":"2012-08-06T03:08:11Z","changeset":12628312,"uid":17047,"user":"KaiRo","lat":48.1995411,"lon":16.3382937},"n1394529555":{"type":"node","id":1394529555,"version":2,"timestamp":"2012-08-06T03:08:11Z","changeset":12628312,"uid":17047,"user":"KaiRo","lat":48.1993668,"lon":16.3383551},"n1394529554":{"type":"node","id":1394529554,"version":2,"timestamp":"2012-08-06T03:08:11Z","changeset":12628312,"uid":17047,"user":"KaiRo","lat":48.1993366,"lon":16.3381763}},
      r1530340: {"r1530340":{"type":"relation","id":1530340,"version":3,"timestamp":"2014-04-07T20:10:03Z","changeset":21559724,"uid":908743,"user":"Girolamo","tags":{"restriction":"only_straight_on","type":"restriction"},"members":[{"ref":378462,"type":"node","role":"via"},{"ref":4583442,"type":"way","role":"to"},{"ref":272668388,"type":"way","role":"from"}]},"n378462":{"type":"node","id":378462,"version":8,"timestamp":"2012-08-06T03:08:12Z","changeset":12628312,"uid":17047,"user":"KaiRo","tags":{"highway":"traffic_signals"},"lat":48.1982148,"lon":16.3382648},"w4583442":{"type":"way","id":4583442,"version":13,"timestamp":"2014-08-23T18:33:19Z","changeset":24962130,"uid":770238,"user":"Kevin Kofler","tags":{"fixme":"yes","highway":"secondary","lanes":"7","lanes:backward":"3","lanes:forward":"4","lit":"yes","maxspeed":"50","name":"Neubaugürtel","ref":"B224","turn:lanes:backward":"left|left|left","turn:lanes:forward":"left|left|through|through"},"nodes":[378459,3037431688,3037431653,2208875391,270328331,2213568001,378462]},"n378459":{"type":"node","id":378459,"version":6,"timestamp":"2012-08-06T03:08:12Z","changeset":12628312,"uid":17047,"user":"KaiRo","tags":{"highway":"traffic_signals"},"lat":48.1983967,"lon":16.3390104},"n3037431688":{"type":"node","id":3037431688,"version":1,"timestamp":"2014-08-23T18:33:19Z","changeset":24962130,"uid":770238,"user":"Kevin Kofler","lat":48.1983357,"lon":16.3387535},"n3037431653":{"type":"node","id":3037431653,"version":1,"timestamp":"2014-08-23T18:33:18Z","changeset":24962130,"uid":770238,"user":"Kevin Kofler","lat":48.1983024,"lon":16.3386136},"n2208875391":{"type":"node","id":2208875391,"version":1,"timestamp":"2013-03-18T20:11:20Z","changeset":15412757,"uid":129531,"user":"almich","lat":48.1982664,"lon":16.3384619},"n270328331":{"type":"node","id":270328331,"version":7,"timestamp":"2013-03-18T20:11:25Z","changeset":15412757,"uid":129531,"user":"almich","lat":48.198255,"lon":16.3384203},"n2213568001":{"type":"node","id":2213568001,"version":1,"timestamp":"2013-03-21T20:09:33Z","changeset":15447432,"uid":46912,"user":"ircecho","lat":48.1982449,"lon":16.3383811},"w272668388":{"type":"way","id":272668388,"version":1,"timestamp":"2014-04-07T20:10:02Z","changeset":21559724,"uid":908743,"user":"Girolamo","tags":{"highway":"secondary","lanes":"2","lit":"yes","maxspeed":"50","name":"Felberstraße","oneway":"yes","ref":"B224","turn:lanes":"through|through"},"nodes":[451666730,1965238268,378462]},"n451666730":{"type":"node","id":451666730,"version":3,"timestamp":"2014-04-07T20:10:26Z","changeset":21559724,"uid":908743,"user":"Girolamo","lat":48.1980324,"lon":16.3377541},"n1965238268":{"type":"node","id":1965238268,"version":3,"timestamp":"2015-07-04T19:38:39Z","changeset":32413423,"uid":298560,"user":"evod","tags":{"crossing":"traffic_signals","highway":"crossing"},"lat":48.1981383,"lon":16.338119}},
      r2334391: {"r2334391":{"type":"relation","id":2334391,"version":1,"timestamp":"2012-08-06T03:08:07Z","changeset":12628312,"uid":17047,"user":"KaiRo","tags":{"building":"yes","type":"multipolygon"},"members":[{"ref":174711722,"type":"way","role":"outer"},{"ref":174711721,"type":"way","role":"inner"}]},"w174711722":{"type":"way","id":174711722,"version":1,"timestamp":"2012-08-06T03:08:07Z","changeset":12628312,"uid":17047,"user":"KaiRo","nodes":[1853730919,1853730863,1853730867,1853730872,1853730957,1853730951,1853730947,1853730945,1853730950,1853730919]},"n1853730919":{"type":"node","id":1853730919,"version":1,"timestamp":"2012-08-06T03:07:53Z","changeset":12628312,"uid":17047,"user":"KaiRo","lat":48.1997241,"lon":16.3386374},"n1853730863":{"type":"node","id":1853730863,"version":1,"timestamp":"2012-08-06T03:07:51Z","changeset":12628312,"uid":17047,"user":"KaiRo","lat":48.1994112,"lon":16.3387568},"n1853730867":{"type":"node","id":1853730867,"version":1,"timestamp":"2012-08-06T03:07:51Z","changeset":12628312,"uid":17047,"user":"KaiRo","lat":48.1994774,"lon":16.3391364},"n1853730872":{"type":"node","id":1853730872,"version":1,"timestamp":"2012-08-06T03:07:51Z","changeset":12628312,"uid":17047,"user":"KaiRo","lat":48.1995281,"lon":16.3394272},"n1853730957":{"type":"node","id":1853730957,"version":1,"timestamp":"2012-08-06T03:07:55Z","changeset":12628312,"uid":17047,"user":"KaiRo","lat":48.1998359,"lon":16.3393112},"n1853730951":{"type":"node","id":1853730951,"version":1,"timestamp":"2012-08-06T03:07:54Z","changeset":12628312,"uid":17047,"user":"KaiRo","lat":48.1998143,"lon":16.3391813},"n1853730947":{"type":"node","id":1853730947,"version":1,"timestamp":"2012-08-06T03:07:54Z","changeset":12628312,"uid":17047,"user":"KaiRo","lat":48.1997874,"lon":16.3391895},"n1853730945":{"type":"node","id":1853730945,"version":1,"timestamp":"2012-08-06T03:07:54Z","changeset":12628312,"uid":17047,"user":"KaiRo","lat":48.1997837,"lon":16.3391645},"n1853730950":{"type":"node","id":1853730950,"version":1,"timestamp":"2012-08-06T03:07:54Z","changeset":12628312,"uid":17047,"user":"KaiRo","lat":48.19981,"lon":16.3391556},"w174711721":{"type":"way","id":174711721,"version":1,"timestamp":"2012-08-06T03:08:07Z","changeset":12628312,"uid":17047,"user":"KaiRo","nodes":[1853730891,1853730882,1853730902,1853730898,1853730911,1853730920,1853730931,1853730932,1853730891]},"n1853730891":{"type":"node","id":1853730891,"version":1,"timestamp":"2012-08-06T03:07:52Z","changeset":12628312,"uid":17047,"user":"KaiRo","lat":48.199634,"lon":16.3390834},"n1853730882":{"type":"node","id":1853730882,"version":1,"timestamp":"2012-08-06T03:07:52Z","changeset":12628312,"uid":17047,"user":"KaiRo","lat":48.199601,"lon":16.3388933},"n1853730902":{"type":"node","id":1853730902,"version":1,"timestamp":"2012-08-06T03:07:52Z","changeset":12628312,"uid":17047,"user":"KaiRo","lat":48.1996538,"lon":16.3388735},"n1853730898":{"type":"node","id":1853730898,"version":1,"timestamp":"2012-08-06T03:07:52Z","changeset":12628312,"uid":17047,"user":"KaiRo","lat":48.1996494,"lon":16.3388471},"n1853730911":{"type":"node","id":1853730911,"version":1,"timestamp":"2012-08-06T03:07:53Z","changeset":12628312,"uid":17047,"user":"KaiRo","lat":48.1996972,"lon":16.3388325},"n1853730920":{"type":"node","id":1853730920,"version":1,"timestamp":"2012-08-06T03:07:53Z","changeset":12628312,"uid":17047,"user":"KaiRo","lat":48.1997271,"lon":16.3390013},"n1853730931":{"type":"node","id":1853730931,"version":1,"timestamp":"2012-08-06T03:07:53Z","changeset":12628312,"uid":17047,"user":"KaiRo","lat":48.1997462,"lon":16.3389943},"n1853730932":{"type":"node","id":1853730932,"version":1,"timestamp":"2012-08-06T03:07:53Z","changeset":12628312,"uid":17047,"user":"KaiRo","lat":48.1997532,"lon":16.3390377}}
    }

    for (var id in toTest) {
      it(id, function (id, expected, done) {
        overpassFrontend.get(id,
          {
            properties: OverpassFrontend.ID_ONLY
          },
          (err, result) => {
            let elements = {}

            result.exportOSMJSON(
              {
              },
              elements,
              (err, result) => {
                assert.deepEqual(elements, expected)

                done()
              }
            )
          },
          (err) => {
          }
        )
      }.bind(this, id, toTest[id]))
    }
  })
})
