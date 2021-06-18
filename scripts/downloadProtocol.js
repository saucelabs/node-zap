#!/usr/bin/env node

const fs = require('fs')
const got = require('got')
const path = require('path')
const yaml = require('js-yaml')

const protocolUrl = 'https://raw.githubusercontent.com/zaproxy/zap-api-docs/master/openapi.yaml'

;(async function run () {
    const apiYaml = await got(protocolUrl)
    const api = await yaml.load(apiYaml.body)
    await fs.promises.writeFile(
        path.join(__dirname, '..', 'build', 'api', 'zap.json'),
        JSON.stringify(api, null, 4),
        'utf-8'
    )
})().then(
    () => console.log('Successfully downloaded ZapProxy API'),
    (err) => console.log(`Error downloading ZapProxy API: ${err.message}`)
)
