#!/usr/bin/env node
const ArgumentParser = require('argparse').ArgumentParser
const http = require('http')

const GeowikiAPI = require('.')

const defaultConfig = {
  port: 8080,
  ip: '0.0.0.0',
  db: 'https://www.overpass-api.de/api/interpreter'
}

const parser = new ArgumentParser({
  add_help: true,
  description: 'Starts a geowiki-api server, either as proxy for a Overpass/Geowiki API server or from a OSM file'
})

parser.add_argument('--db', {
  help: 'Override the default database (e.g. Overpass/Geowiki API URL or OSM file; default: ' + defaultConfig.db + ').',
  default: defaultConfig.db
})

parser.add_argument('--port', '-p', {
  help: 'Port to listen on (default: ' + defaultConfig.port + ').',
  default: defaultConfig.port
})

parser.add_argument('--ip', {
  help: 'IP to listen on (default: all available IPs).',
  default: defaultConfig.ip
})

const config = { ...parser.parse_args() }

const geowikiAPI = new GeowikiAPI(config.db)

const server = http.createServer(handleRequest)

server.listen(config.port, config.ip)

function handleRequest (request, response) {
  const timeStamp = Date.now()
  const logMsg = {
    date: new Date().toISOString(),
    ip: request.socket.remoteAddress,
    method: request.method
  }
  let body = ''

  request.on('data', (data) => {
    body += data
  })

  request.on('end', () => {
    const reqUrl = new URL('http://localhost' + request.url)
    if (!body && reqUrl.searchParams.has('data')) {
      body = reqUrl.searchParams.get('data')
    }

    if (request.headers['content-type']) {
      const contentType = request.headers['content-type'].split(';')[0].toLowerCase()
      if (contentType === 'application/x-www-form-urlencoded') {
        const query = new URLSearchParams(body)
        if (query.has('data')) {
          body = query.get('data')
        }
      }
    }

    if (!body) {
      return handleResult(new Error('no query received'))
    }

    logMsg.query = body

    let overpassRequest
    try {
      overpassRequest = geowikiAPI.query(body, handleResult)
    } catch (e) {
      handleResult(e)
    }

    function handleResult (err, result) {
      logMsg.duration = Date.now() - timeStamp

      if (err) {
        logMsg.status = 400
        response.writeHead(400, {
          'Content-Type': 'text/html; charset=utf-8',
          'Access-Control-Allow-Origin': '*'
        })

        logMsg.error = err.message

        log(logMsg)
        return response.end(err.message)
      }

      const outputFormatter = overpassRequest.output

      logMsg.status = 200
      const httpHeaders = outputFormatter.httpHeaders()
      httpHeaders['Access-Control-Allow-Origin'] = '*'
      response.writeHead(200, httpHeaders)

      if (typeof result !== 'string') {
        result = JSON.stringify(result, null, '  ')
      }

      log(logMsg)
      response.end(result)
    }
  })
}

function log (msg) {
  console.log(JSON.stringify(msg))
}
