#!/usr/bin/env node
const ArgumentParser = require('argparse').ArgumentParser
const fs = require('fs')
const GeowikiAPI = require('.')

const defaultConfig = {
  db: 'https://overpass-api.de/api/interpreter'
}

const parser = new ArgumentParser({
  add_help: true,
  description: 'Run an Overpass QL query via geowiki-api to Overpass/Geowiki API server or a OSM file.'
})

parser.add_argument('--db', {
  help: 'Override the default database (e.g. Overpass/Geowiki API URL or OSM file)',
  default: defaultConfig.db
})

const config = { ...parser.parse_args() }

const geowikiAPI = new GeowikiAPI(config.db)

const query = fs.readFileSync(0, 'utf-8')

try {
  geowikiAPI.query(query, handleResult)
} catch (e) {
  handleResult(e)
}

function handleResult (err, result) {
  if (err) {
    console.error(err.message)
    process.exit(1)
  }

  if (typeof result === 'string') {
    fs.writeFileSync(1, result)
  } else {
    fs.writeFileSync(1, JSON.stringify(result, null, '  ') + '\n')
  }
}
