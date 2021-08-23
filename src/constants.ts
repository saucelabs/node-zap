import { camelCase } from 'change-case'
import os from 'os'
import type { OpenAPIV3 } from 'openapi-types'

import type { ProtocolCommand, Parameters } from './types'

const { version } = require('../package.json')

export const BINDING_VERSION_NOTE = `node-zap v${version}`

const protocols: OpenAPIV3.Document[] = [
    require('../build/api/zap.json'),
    require('../build/api/sauce.json')
]

export const API_DOMAINS = new Set()
const protocolFlattened: Map<string, ProtocolCommand> = new Map()
for (const { paths, servers, info, components } of protocols) {
    if (!servers) {
        throw new Error(`No "servers" property found in API ${info.title}`)
    }

    for (const [endpoint, methods] of Object.entries(paths as OpenAPIV3.PathsObject<OpenAPIV3.OperationObject>)) {
        for (const [method, description] of Object.entries(methods as Record<OpenAPIV3.HttpMethods, OpenAPIV3.OperationObject>)) {
            if (method === 'parameters') {
                continue
            }

            const commandParams: OpenAPIV3.ParameterObject[] = []
            let params = [
                ...(methods?.parameters || []),
                ...(description.parameters || [])
            ]

            for (const param of params) {
                /**
                 * parameter is referenced, e.g. #/components/parameters/FooBar
                 */
                const refParam = (param as OpenAPIV3.ReferenceObject).$ref
                if (refParam && components?.parameters) {
                    const paramName = refParam.split('/').pop()
                    if (paramName) {
                        commandParams.push(components.parameters[paramName] as OpenAPIV3.ParameterObject)
                    }
                }

                commandParams.push(param as OpenAPIV3.ParameterObject)
            }


            if (!description.operationId) {
                throw new Error(`No "operationId" found in endpoint ${endpoint}`)
            }

            if (!description.tags || !description.tags![0]) {
                throw new Error(`Expected command "${description.operationId}" to be tagged with its domain`)
            }

            API_DOMAINS.add(description.tags![0])
            let commandName = camelCase(description.operationId)
            /**
             * mark commands as depcrecated in the command names
             */
            if (description.deprecated) {
                commandName += 'Deprecated'
            }

            /**
             * ensure we don't double register commands
             */
            /* istanbul ignore if */
            if (protocolFlattened.has(commandName)) {
                throw new Error(`command ${commandName} already registered`)
            }

            const sanitizedParams = commandParams
                .map((param) => {
                    const newParam: Parameters = {
                        nameCamelCased: camelCase(param.name),
                        ...param
                    }
                    return newParam
                })
            protocolFlattened.set(
                commandName,
                {
                    method: method as OpenAPIV3.HttpMethods,
                    endpoint,
                    description,
                    parameters: sanitizedParams,
                    responses: description.responses as OpenAPIV3.ResponsesObject
                }
            )
        }
    }
}

export const PROTOCOL_MAP = protocolFlattened
export const DEFAULT_OPTIONS = {
    user: process.env.SAUCE_USERNAME,
    key: process.env.SAUCE_ACCESS_KEY,
    region: 'apac',
    headers: { 'User-Agent': `zap/v${version} (nodejs ${os.platform()})` },
} as const

export const SYMBOL_INSPECT = Symbol.for('nodejs.util.inspect.custom')
export const SYMBOL_TOSTRING = Symbol.toStringTag
export const SYMBOL_ITERATOR = Symbol.iterator
export const TO_STRING_TAG = 'ZapProxy API Client'

export const USAGE = `ZapProxy Sauce Labs API CLI

Usage: zap <command> [options]`

export const EPILOG = `Copyright ${(new Date()).getUTCFullYear()} © Sauce Labs`

export const CLI_PARAMS = [{
    alias: 'h',
    name: 'help',
    description: 'prints help menu'
}, {
    alias: 'u',
    name: 'user',
    description: 'your Sauce Labs username'
}, {
    alias: 'k',
    name: 'key',
    description: 'your Sauce Labs user key'
}, {
    alias: 'r',
    name: 'region',
    default: DEFAULT_OPTIONS.region,
    description: 'your Sauce Labs datacenter region, the following regions are available: `us-west-1` (short `us`), `eu-central-1` (short `eu`)'
}]

export const SESSION_SUFFIXES = [
    '.session',
    '.session.data',
    '.session.lck',
    '.session.log',
    '.session.properties',
    '.session.script'
]

export const REPORT_COMMANDS = [
    'xmlreport',
    'htmlreport',
    'mdreport'
]
