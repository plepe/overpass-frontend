const GeowikiAPI = require('./')

if (typeof window !== 'undefined') {
  window.GeowikiAPI = GeowikiAPI
  window.OverpassFrontend = GeowikiAPI // backwards compatibility
}
