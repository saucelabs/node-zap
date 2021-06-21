import fs from 'fs'
import util from 'util'
import path from 'path'
import { spawn } from 'child_process'

import got from 'got'
import tunnel from 'tunnel'
import FormData from 'form-data'
import { camelCase } from 'change-case'
import type { OpenAPIV3 } from 'openapi-types'

import {
    getAPIHost, toString, getParameters, isValidType, getRegionSubDomain
} from './utils'
import {
    PROTOCOL_MAP, DEFAULT_OPTIONS, SYMBOL_INSPECT, SYMBOL_TOSTRING,
    SYMBOL_ITERATOR, TO_STRING_TAG
} from './constants'
import { Options } from './types'

export default class SauceLabs {
    public username: string
    public region: string
    public tld: string

    private _accessKey: string
    private _api: typeof got

    constructor (private _options: Options) {
        this._options = Object.assign({}, DEFAULT_OPTIONS, _options)
        this.username = this._options.user
        this.region = this._options.region

        this._accessKey = this._options.key
        this._api = got.extend({
            username: this.username,
            password: this._accessKey,
            followRedirect: true,
            headers: {
                ...this._options.headers,
                Authorization: `Basic ${Buffer.from(`${this.username}:${this._accessKey}`).toString('base64')}`
            },
            agent: {
                https: tunnel.httpsOverHttps({
                    proxy: {
                        host: `zap.${getRegionSubDomain(this._options)}.saucelabs.com`,
                        port: 443
                    }
                }) as any
            }
        })

        return new Proxy({
            username: this.username,
            key: `XXXXXXXX-XXXX-XXXX-XXXX-XXXXXX${(this._accessKey || '').slice(-6)}`,
            region: this._options.region,
            headers: this._options.headers
        }, { get: this.get.bind(this) }) as any
    }

    get (_, propName) {
        /**
         * print to string output
         * https://nodejs.org/api/util.html#util_util_inspect_custom
         */
        /* istanbul ignore next */
        if (propName === SYMBOL_INSPECT || propName === 'inspect') {
            return () => toString(this)
        }

        /**
         * print to string tag
         * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/toStringTag
         */
        if (propName === SYMBOL_TOSTRING) {
            return TO_STRING_TAG
        }

        /**
         * return instance iterator
         * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/iterator
         */
        if (propName === SYMBOL_ITERATOR) {
            return
        }

        /**
         * allow to return publicly registered class properties
         */
        if (this[propName]) {
            return !propName.startsWith('_') ? this[propName] : undefined
        }

        if (!PROTOCOL_MAP.has(propName)) {
            /**
             * just return if propName is a symbol (Node 8 and lower)
             */
            /* istanbul ignore next */
            if (typeof propName !== 'string') {
                return
            }
            throw new Error(`Couldn't find API endpoint for command "${propName}"`)
        }

        return async (...args) => {
            const { description, method, endpoint, servers } = PROTOCOL_MAP.get(propName)
            const params = getParameters(description.parameters)
            const pathParams = params.filter(p => p.in === 'path')

            /**
             * validate required url params
             */
            let url = endpoint
            for (const [i, urlParam] of Object.entries(pathParams)) {
                const param = args[i]
                const type = (urlParam.schema as OpenAPIV3.SchemaObject).type.replace('integer', 'number')

                if (typeof param !== type) {
                    throw new Error(`Expected parameter for url param '${urlParam.name}' from type '${type}', found '${typeof param}'`)
                }

                url = url.replace(`{${urlParam.name}}`, param)
            }

            /**
             * check for body param (as last parameter as we don't expect request
             * parameters for non idempotent requests)
             */
            let bodyOption = params.find(p => p.in === 'body') || description.requestBody
                ? args[pathParams.length]
                : null

            if (bodyOption && typeof bodyOption === 'string') {
                bodyOption = JSON.parse(bodyOption)
            }

            /**
             * validate required options
             */
            const bodyMap = new Map()
            const options = args.slice(pathParams.length)[0] || {}
            for (const optionParam of params.filter(p => p.in === 'query')) {
                const schema = optionParam.schema as OpenAPIV3.SchemaObject
                const expectedType = schema.type.replace('integer', 'number')
                const optionName = camelCase(optionParam.name)
                const option = options[optionName]
                const isRequired = Boolean(optionParam.required) || (typeof optionParam.required === 'undefined' && typeof schema.default === 'undefined')
                if ((isRequired || option) && !isValidType(option, expectedType)) {
                    throw new Error(`Expected parameter for option '${optionName}' from type '${expectedType}', found '${typeof option}'`)
                }

                if (typeof option !== 'undefined') {
                    bodyMap.set(optionParam.name, option)
                }
            }

            /**
             * get request body by using the body parameter or convert the parameter
             * map into json object
             */
            const body = bodyOption || [...bodyMap.entries()].reduce((e, [k, v]) => {
                e[k] = v
                return e
            }, {})

            /**
             * make request
             */
            const uri = getAPIHost(servers[0], this._options) + url
            try {
                const response = await this._api[method](uri, {
                    ...(
                        method === 'get'
                            ? { searchParams: body }
                            : { json: body }
                    ),
                    responseType: 'json'
                })
                return response.body
            } catch (err) {
                throw new Error(`Failed calling ${propName}: ${err.message}, ${err.response && err.response.body}`)
            }
        }
    }
}
