/* setup fake DOM on NodeJS */
if (!global.window) {
  const JSDOM = require("jsdom").JSDOM
  const dom = new JSDOM(`<!DOCTYPE html><p>Hello world</p>`)
  global.window = dom.window
  global.document = dom.window.document
  global.navigator = {
    userAgent: 'node',
    platform: ''
  }
}
/* done */
