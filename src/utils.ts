import type { OpenAPIV3 } from 'openapi-types'

import { TO_STRING_TAG, PARAMETERS_MAP } from './constants'
import type { Options } from './types'
import type APIBinding from './index'

/**
 * Translate region shorthandle option into the full region
 * @param  {object}  options  client options
 * @return {string}           full region
 */
export function getRegionSubDomain (options: { region?: string } = {}) {
    let region = options.region || 'us-west-1'

    if (options.region === 'us') region = 'us-west-1'
    if (options.region === 'eu') region = 'eu-central-1'
    if (options.region === 'apac') region = 'apac-southeast-1'
    return region
}

/**
 * get sauce API url
 * @param  {string}  servers   OpenAPI spec servers property
 * @param  {string}  basePath  OpenAPI spec base path
 * @param  {object}  options   client options
 * @return {string}            endpoint base url (e.g. `https://us-east1.headless.saucelabs.com`)
 */
export function getAPIHost (servers: OpenAPIV3.ServerObject[], options: Options) {
    const server = servers[0] as OpenAPIV3.ServerObject
    let host = server.url

    for (const [option, value] of Object.entries(server.variables || {})) {
        /**
         * check if option is valid
         */
        if (value.enum && !value.enum.includes(value.default)) {
            throw new Error(`Option "${option}" contains invalid value ("${value.default}"), allowed are: ${value.enum.join(', ')}`)
        }

        host = host.replace(`{${option}}`, value.default)
    }

    return host
}

/**
 * toString method for proxy instance
 * @param  {object} scope  actual API instance
 * @return {string}        to string output
 */
export function toString (scope: APIBinding) {
    return `${TO_STRING_TAG} {
  username: '${scope.user}',
  key: 'XXXXXXXX-XXXX-XXXX-XXXX-XXXXXX${scope['_accessKey'].slice(-6)}',
  region: '${scope['_options'].region}'
}`
}

/**
 * get sorted list of parameters with full description
 * @param  {Array}    [parameters=[]]  parameter defined in endpoint
 * @return {[Object]}                  full description of parameters
 */
export function getParameters (parameters: (OpenAPIV3.ReferenceObject | OpenAPIV3.ParameterObject)[] = []) {
    const params: OpenAPIV3.ParameterObject[] = parameters.map(
        (urlParameter) => (urlParameter as OpenAPIV3.ReferenceObject).$ref
            ? PARAMETERS_MAP.get((urlParameter as OpenAPIV3.ReferenceObject).$ref.split('/').slice(-1)[0]) as OpenAPIV3.ParameterObject
            : urlParameter as OpenAPIV3.ParameterObject)

    return params.sort((a, b) => {
        if (a && b && a.required && b.required) {
            return 0
        }
        if (a && b && a.required && !b.required) {
            return -1
        }
        return 1
    })
}

/**
 * type check for endpoint parameters
 * @param  {*}      option        given command parameters
 * @param  {String} expectedType  expected parameter type
 * @return {Boolean}              true if typecheck was ok
 */
export function isValidType (option: any, expectedType: string) {
    if (expectedType === 'array') {
        return Array.isArray(option)
    }
    return typeof option === expectedType
}
