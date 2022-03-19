const assert = require('assert')

const loadTestData = require('./src/loadTestData')

const OverpassFrontend = require('../src/OverpassFrontend')
let overpassFrontend

describe('OverpassQL out JSON', function () {
  it('load local file', function (done) {
    this.timeout(20000)
    loadTestData((err, result) => {
      overpassFrontend = result
      done(err)
    })
  })

  it('node', function () {
    const item = overpassFrontend.cacheElements.n1853730679

    const variants = [
      [
        {},
        {
          type: 'node',
          id: 1853730679,
          tags: {
            historic: 'memorial',
            name: 'Hesser-Denkmal'
          },
          lat: 48.1985683,
          lon: 16.3385779
        }
      ],
      [
        { ids: true, tags: true },
        {
          type: 'node',
          id: 1853730679,
          tags: {
            historic: 'memorial',
            name: 'Hesser-Denkmal'
          }
        }
      ],
      [
        { ids: true },
        {
          type: 'node',
          id: 1853730679
        }
      ],
      [
        { skel: true, noids: true },
        {
          type: 'node',
          lat: 48.1985683,
          lon: 16.3385779
        }
      ],
      [
        { ids: true, meta: true },
        {
          type: 'node',
          id: 1853730679,
          tags: {
            historic: 'memorial',
            name: 'Hesser-Denkmal'
          },
          timestamp: '2014-08-28T01:19:13Z',
          version: 3,
          changeset: 25064923,
          user: 'Kevin Kofler',
          uid: 770238,
          lat: 48.1985683,
          lon: 16.3385779
        }
      ],
      [
        { ids: true, geom: true },
        {
          type: 'node',
          id: 1853730679,
          lat: 48.1985683,
          lon: 16.3385779
        }
      ],
      [
        { ids: true, bb: true },
        {
          type: 'node',
          id: 1853730679,
          lat: 48.1985683,
          lon: 16.3385779
        }
      ],
      [
        { ids: true, center: true },
        {
          type: 'node',
          id: 1853730679,
          lat: 48.1985683,
          lon: 16.3385779
        }
      ],
      [
        { ids: true, geom: true, bb: true, center: true },
        {
          type: 'node',
          id: 1853730679,
          lat: 48.1985683,
          lon: 16.3385779
        }
      ]
    ]

    variants.forEach(([options, expected]) => {
      const actual = item.qlOutJSON(options)
      assert.deepEqual(actual, expected, 'Options: ' + Object.keys(options).join(' '))
    })
  })

  it('way', function () {
    const item = overpassFrontend.cacheElements.w27950434

    const variants = [
      [
        {},
        {
          type: 'way',
          id: 27950434,
          tags: {
            foot: 'yes',
            highway: 'cycleway'
          },
          nodes: [
            252548479,
            1812895273,
            83517968
          ]
        }
      ],
      [
        { ids: true, tags: true },
        {
          type: 'way',
          id: 27950434,
          tags: {
            foot: 'yes',
            highway: 'cycleway'
          }
        }
      ],
      [
        { ids: true },
        {
          type: 'way',
          id: 27950434
        }
      ],
      [
        { skel: true, noids: true },
        {
          type: 'way',
          nodes: [
            252548479,
            1812895273,
            83517968
          ]
        }
      ],
      [
        { ids: true, meta: true },
        {
          type: 'way',
          id: 27950434,
          tags: {
            foot: 'yes',
            highway: 'cycleway'
          },
          timestamp: '2012-07-04T18:02:37Z',
          version: 3,
          changeset: 12113193,
          user: 'realadry',
          uid: 49642,
          nodes: [
            252548479,
            1812895273,
            83517968
          ]
        }

      ],
      [
        { ids: true, geom: true },
        {
          type: 'way',
          id: 27950434,
          geometry: [
            { lat: 48.1955450, lon: 16.3397883 },
            { lat: 48.1955877, lon: 16.3398894 },
            { lat: 48.1957006, lon: 16.3399682 }
          ]
        }
      ],
      [
        { ids: true, bb: true },
        {
          type: 'way',
          id: 27950434,
          bounds: {
            minlat: 48.1955450,
            maxlat: 48.1957006,
            minlon: 16.3397883,
            maxlon: 16.3399682
          }
        }
      ],
      [
        { ids: true, center: true },
        {
          type: 'way',
          id: 27950434,
          center: {
            lat: 48.1956228,
            lon: 16.339878249999998
          }
        }
      ],
      [
        { ids: true, geom: true, bb: true, center: true },
        {
          type: 'way',
          id: 27950434,
          geometry: [
            { lat: 48.1955450, lon: 16.3397883 },
            { lat: 48.1955877, lon: 16.3398894 },
            { lat: 48.1957006, lon: 16.3399682 }
          ],
          bounds: {
            minlat: 48.1955450,
            maxlat: 48.1957006,
            minlon: 16.3397883,
            maxlon: 16.3399682
          },
          center: {
            lat: 48.1956228,
            lon: 16.339878249999998
          }
        }
      ]
    ]

    variants.forEach(([options, expected]) => {
      const actual = item.qlOutJSON(options)
      assert.deepEqual(actual, expected, 'Options: ' + Object.keys(options).join(' '))
    })
  })

  it('relation', function () {
    const item = overpassFrontend.cacheElements.r1522329

    const variants = [
      [
        {},
        {
          type: 'relation',
          id: 1522329,
          tags: {
            restriction: 'no_left_turn',
            type: 'restriction'
          },
          members: [
            {
              ref: 17312861,
              type: 'node',
              role: 'via'
            },
            {
              ref: 189893586,
              type: 'way',
              role: 'from'
            },
            {
              ref: 217030746,
              type: 'way',
              role: 'to'
            }
          ]
        }
      ],
      [
        { ids: true, tags: true },
        {
          type: 'relation',
          id: 1522329,
          tags: {
            restriction: 'no_left_turn',
            type: 'restriction'
          }
        }
      ],
      [
        { ids: true },
        {
          type: 'relation',
          id: 1522329
        }
      ],
      [
        { skel: true, noids: true },
        {
          type: 'relation',
          members: [
            {
              ref: 17312861,
              type: 'node',
              role: 'via'
            },
            {
              ref: 189893586,
              type: 'way',
              role: 'from'
            },
            {
              ref: 217030746,
              type: 'way',
              role: 'to'
            }
          ]
        }
      ],
      [
        { ids: true, meta: true },
        {
          type: 'relation',
          id: 1522329,
          tags: {
            restriction: 'no_left_turn',
            type: 'restriction'
          },
          timestamp: '2013-04-11T23:27:45Z',
          version: 7,
          changeset: 15695766,
          user: 'Kevin Kofler',
          uid: 770238,
          members: [
            {
              ref: 17312861,
              type: 'node',
              role: 'via'
            },
            {
              ref: 189893586,
              type: 'way',
              role: 'from'
            },
            {
              ref: 217030746,
              type: 'way',
              role: 'to'
            }
          ]
        }
      ],
      [
        { ids: true, geom: true },
        {
          type: 'relation',
          id: 1522329,
          members: [
            {
              ref: 17312861,
              type: 'node',
              role: 'via',
              lat: 48.208421,
              lon: 16.339313
            },
            {
              ref: 189893586,
              type: 'way',
              role: 'from'
            },
            {
              ref: 217030746,
              type: 'way',
              role: 'to',
              geometry: [
                { lat: 48.2018467, lon: 16.3405052 },
                { lat: 48.2019048, lon: 16.3404962 },
                { lat: 48.2019532, lon: 16.3404887 },
                { lat: 48.2021753, lon: 16.3404418 },
                { lat: 48.2023631, lon: 16.340407 },
                { lat: 48.2025602, lon: 16.3403701 },
                { lat: 48.2027237, lon: 16.3403333 },
                { lat: 48.2028008, lon: 16.3403178 },
                { lat: 48.2029608, lon: 16.3402872 },
                { lat: 48.2031577, lon: 16.3402536 },
                { lat: 48.203267, lon: 16.3402353 },
                { lat: 48.2033719, lon: 16.3402161 },
                { lat: 48.2035675, lon: 16.3401791 },
                { lat: 48.2037539, lon: 16.3401466 },
                { lat: 48.2039532, lon: 16.3401103 },
                { lat: 48.2041535, lon: 16.3400771 },
                { lat: 48.2042633, lon: 16.3400568 },
                { lat: 48.2043259, lon: 16.3400452 },
                { lat: 48.2043978, lon: 16.3400299 },
                { lat: 48.2047, lon: 16.3399655 },
                { lat: 48.2049217, lon: 16.3399194 },
                { lat: 48.2053792, lon: 16.3398395 },
                { lat: 48.2058463, lon: 16.3397552 },
                { lat: 48.2059695, lon: 16.339732 },
                { lat: 48.2060454, lon: 16.3397177 },
                { lat: 48.2061042, lon: 16.3397069 },
                { lat: 48.2062244, lon: 16.3396848 },
                { lat: 48.2066543, lon: 16.339611 },
                { lat: 48.207072, lon: 16.3395291 },
                { lat: 48.2071589, lon: 16.3395136 },
                { lat: 48.2074626, lon: 16.3394594 },
                { lat: 48.2077486, lon: 16.339412 },
                { lat: 48.2078823, lon: 16.3393898 },
                { lat: 48.2083448, lon: 16.3393149 },
                { lat: 48.208421, lon: 16.339313 }
              ]
            }
          ]
        }
      ],
      [
        { ids: true, bb: true },
        {
          type: 'relation',
          id: 1522329,
          bounds: {
            minlon: 16.339313,
            minlat: 48.2018467,
            maxlon: 16.3405052,
            maxlat: 48.208421
          }
        }
      ],
      [
        { ids: true, center: true },
        {
          type: 'relation',
          id: 1522329,
          center: {
            lat: 48.205133849999996,
            lon: 16.3399091
          }
        }
      ],
      [
        { ids: true, geom: true, bb: true, center: true },
        {
          type: 'relation',
          id: 1522329,
          center: {
            lat: 48.205133849999996,
            lon: 16.3399091
          },
          bounds: {
            minlon: 16.339313,
            minlat: 48.2018467,
            maxlon: 16.3405052,
            maxlat: 48.208421
          },
          members: [
            {
              ref: 17312861,
              type: 'node',
              role: 'via',
              lat: 48.208421,
              lon: 16.339313
            },
            {
              ref: 189893586,
              type: 'way',
              role: 'from'
            },
            {
              ref: 217030746,
              type: 'way',
              role: 'to',
              geometry: [
                { lat: 48.2018467, lon: 16.3405052 },
                { lat: 48.2019048, lon: 16.3404962 },
                { lat: 48.2019532, lon: 16.3404887 },
                { lat: 48.2021753, lon: 16.3404418 },
                { lat: 48.2023631, lon: 16.340407 },
                { lat: 48.2025602, lon: 16.3403701 },
                { lat: 48.2027237, lon: 16.3403333 },
                { lat: 48.2028008, lon: 16.3403178 },
                { lat: 48.2029608, lon: 16.3402872 },
                { lat: 48.2031577, lon: 16.3402536 },
                { lat: 48.203267, lon: 16.3402353 },
                { lat: 48.2033719, lon: 16.3402161 },
                { lat: 48.2035675, lon: 16.3401791 },
                { lat: 48.2037539, lon: 16.3401466 },
                { lat: 48.2039532, lon: 16.3401103 },
                { lat: 48.2041535, lon: 16.3400771 },
                { lat: 48.2042633, lon: 16.3400568 },
                { lat: 48.2043259, lon: 16.3400452 },
                { lat: 48.2043978, lon: 16.3400299 },
                { lat: 48.2047, lon: 16.3399655 },
                { lat: 48.2049217, lon: 16.3399194 },
                { lat: 48.2053792, lon: 16.3398395 },
                { lat: 48.2058463, lon: 16.3397552 },
                { lat: 48.2059695, lon: 16.339732 },
                { lat: 48.2060454, lon: 16.3397177 },
                { lat: 48.2061042, lon: 16.3397069 },
                { lat: 48.2062244, lon: 16.3396848 },
                { lat: 48.2066543, lon: 16.339611 },
                { lat: 48.207072, lon: 16.3395291 },
                { lat: 48.2071589, lon: 16.3395136 },
                { lat: 48.2074626, lon: 16.3394594 },
                { lat: 48.2077486, lon: 16.339412 },
                { lat: 48.2078823, lon: 16.3393898 },
                { lat: 48.2083448, lon: 16.3393149 },
                { lat: 48.208421, lon: 16.339313 }
              ]
            }
          ]
        }
      ]
    ]

    variants.forEach(([options, expected]) => {
      const actual = item.qlOutJSON(options)
      assert.deepEqual(actual, expected, 'Options: ' + Object.keys(options).join(' '))
    })
  })
})
