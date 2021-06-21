#!/usr/bin/env node

const fs = require('fs')
const got = require('got')
const path = require('path')
const yaml = require('js-yaml')

const protocolUrls = {
    zap: 'https://raw.githubusercontent.com/zaproxy/zap-api-docs/master/openapi.yaml',
    sauce: 'https://raw.githubusercontent.com/saucelabs/node-zap/main/protocol/sauce.yaml?token=AAFSRSPP5G42STBK6C2L5ALA3GEHQ'
}

async function download ([protocolName, protocolUrl]) {
    const apiYaml = await got(protocolUrl)
    const api = await yaml.load(apiYaml.body)
    await fs.promises.writeFile(
        path.join(__dirname, '..', 'build', 'api', `${protocolName}.json`),
        JSON.stringify(api, null, 4),
        'utf-8'
    )
}

Promise.all(Object.entries(protocolUrls).map(download)).then(
    () => console.log('Successfully downloaded ZapProxy API'),
    (err) => console.log(`Error downloading ZapProxy API: ${err.message}`)
)
