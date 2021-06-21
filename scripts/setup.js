#!/usr/bin/env node

const fs = require('fs')
const got = require('got')
const ejs = require('ejs')
const path = require('path')
const yaml = require('js-yaml')
const camelcase = require('camelcase')

const protocolUrls = {
    zap: 'https://raw.githubusercontent.com/zaproxy/zap-api-docs/master/openapi.yaml',
    sauce: 'https://raw.githubusercontent.com/saucelabs/node-zap/main/protocol/sauce.yaml?token=AAFSRSKJN2RP4QYEOAL6IITA3HM7A'
}

const regions = ['apac']

async function download ([protocolName, protocolUrl]) {
    const apiYaml = await got(protocolUrl)
    const api = await yaml.load(apiYaml.body)
    const apiDir = path.join(__dirname, '..', 'build', 'api')

    if (!fs.promises.access(apiDir)) {
        await fs.promises.mkdir(apiDir)
    }

    await fs.promises.writeFile(
        path.join(apiDir, `${protocolName}.json`),
        JSON.stringify(api, null, 4),
        'utf-8'
    )

    return { api, name: protocolName }
}

async function genTypes (params) {
    const apis = await params
    const template = await fs.promises.readFile(path.join(__dirname, 'templates', 'types.ejs.d.ts'))

    const domains = {}
    const allPaths = Object.values(apis).reduce((res, api) => ({ ...res, ...api.paths }), {})
    for (const path of Object.values(allPaths)) {
        const commands = Object.entries(path)
            .filter(([method, command]) => method !== 'parameters')
            .map(([method, command]) => command)
        for (const command of commands) {
            const domain = command.tags[0]
            const operation = camelcase(command.operationId.replace(domain, '').replace(/(View|Action)/, ''))

            if (!domains[domain]) {
                domains[domain] = []
            }

            domains[domain].push({
                ...command,
                operation,
                parameters: path.parameters || []
            })
        }
    }

    const typeDefinition = ejs.render(template.toString(), { domains, regions })
    const typeFilePath = path.join(__dirname, '..', 'build', 'index.d.ts')
    await fs.promises.writeFile(typeFilePath, typeDefinition, 'utf-8')
}

async function merge (promiseObj, params) {
    const { api, name } = await params
    return promiseObj.then((obj) => {
        obj[name] = api
        return obj
    })
}

Object.entries(protocolUrls)
    .map(download)
    .reduce(merge, Promise.resolve({}))
    .then(genTypes)
    .then(
        () => console.log('Successfully downloaded ZapProxy API'),
        (err) => console.log(`Error downloading ZapProxy API: ${err.stack}`)
    )
