#!/usr/bin/env node

const fs = require('fs')
const got = require('got')
const ejs = require('ejs')
const path = require('path')
const yaml = require('js-yaml')
const { camelCase } = require('change-case')

const protocolUrls = {
    zap: 'https://raw.githubusercontent.com/zaproxy/zap-api-docs/master/openapi.yaml',
    zapExtensions: 'https://raw.githubusercontent.com/saucelabs/node-zap/main/protocol/zapExtensions.yaml',
    sauce: 'https://raw.githubusercontent.com/saucelabs/node-zap/main/protocol/sauce.yaml'
}

const regions = ['apac']

async function download ([protocolName, protocolUrl]) {
    const apiDir = path.join(__dirname, '..', 'build', 'api')

    const hasAccess = await fs.promises.access(apiDir).then(() => true, () => false)
    if (!hasAccess) {
        await fs.promises.mkdir(apiDir, { recursive: true })
    }

    let api
    if (protocolName === 'sauce' && process.env.NODE_ENV === 'dev') {
        const localProtocol = path.join(__dirname, '..', 'protocol', 'sauce.yaml')
        const apiYaml = await fs.promises.readFile(localProtocol, 'utf-8')
        api = await yaml.load(apiYaml.toString())
    } else {
        const apiYaml = await got(protocolUrl)
        api = await yaml.load(apiYaml.body)
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
            .filter(([method]) => method !== 'parameters')
            .map(([, command]) => command)
        for (const command of commands) {
            const domain = command.tags[0]
            const operation = camelCase(command.operationId.replace(domain, '').replace(/(View|Action|Other)/, ''))
            const parameters = [
                ...(path.parameters || []),
                ...(command.parameters || [])
            ].map((param) => {
                param.nameCamelCased = camelCase(param.name)
                return param
            })

            if (!domains[domain]) {
                domains[domain] = []
            }

            domains[domain].push({
                ...command,
                operation,
                parameters
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
