import got from 'got'
import tunnel from 'tunnel'
import { camelCase } from 'change-case'
import type { OpenAPIV3 } from 'openapi-types'

import { toString, getRegionSubDomain } from './utils'
import {
    PROTOCOL_MAP, DEFAULT_OPTIONS, SYMBOL_INSPECT, SYMBOL_TOSTRING,
    SYMBOL_ITERATOR, TO_STRING_TAG, API_DOMAINS
} from './constants'
import { Options, ProtocolCommand } from './types'

export default class Zap {
    public user: string
    public region: string
    public sessionId?: string

    private _options: Options
    private _accessKey: string
    private _api: typeof got
    private _proxy: Zap

    constructor (public options?: Partial<Options>) {
        const opts = Object.assign({}, DEFAULT_OPTIONS, options || {})

        if (!opts.user || !opts.key) {
            throw new Error('"user" and "key" parameters')
        }

        this._options = opts as Options
        this.region = opts.region
        this.user = opts.user

        this._accessKey = this._options.key
        this._api = got.extend({
            headers: opts.headers,
            username: opts.user,
            password: opts.key,
            agent: {
                http: tunnel.httpsOverHttps({
                    proxy: {
                        host: `zap.${getRegionSubDomain(this._options)}.saucelabs.com`,
                        port: 443
                    }
                })
            }
        })

        this._proxy = new Proxy({
            user: this.user,
            key: `XXXXXXXX-XXXX-XXXX-XXXX-XXXXXX${(this._accessKey || '').slice(-6)}`,
            region: this._options.region,
            headers: this._options.headers
        } as any, { get: this._get.bind(this) })

        // @ts-ignore
        return this._proxy
    }

    private _get (scope: { domain: string }, propName: string | symbol): any {
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
        if (propName === SYMBOL_ITERATOR || typeof propName !== 'string') {
            return
        }

        /**
         * allow to return publicly registered class properties
         */
        if ((this as any)[propName]) {
            return !propName.startsWith('_') ? (this as any)[propName] : undefined
        }

        /**
         * check if domain is being accessed
         */
        if (API_DOMAINS.has(propName)) {
            return new Proxy({ domain: propName }, { get: this._get.bind(this) })
        }

        const commandNameAsView = `${scope.domain}View${propName.slice(0, 1).toUpperCase()}${propName.slice(1)}`
        const commandNameAsAction = `${scope.domain}Action${propName.slice(0, 1).toUpperCase()}${propName.slice(1)}`
        const commandName = PROTOCOL_MAP.has(commandNameAsView)
            ? commandNameAsView
            : PROTOCOL_MAP.has(commandNameAsAction)
                ? commandNameAsAction
                : scope.domain === 'session' ? propName : null
        if (!commandName) {
            /**
             * just return if propName is a symbol (Node 8 and lower)
             */
            /* istanbul ignore next */
            if (typeof propName !== 'string') {
                return
            }
            throw new Error(`Couldn't find API endpoint for command "${propName}"`)
        }

        /**
         * ensure user is authenticated
         */
        // if (scope.domain !== 'session' && !this.sessionId) {
        //     throw new Error(`Couldn't call command "${propName}", reason: not authenticated! Please call \`zap.session.new({ ... })\` first to authenticate with Sauce Labs cloud.`)
        // }

        return async (args: Record<string, any>) => {
            const { method, endpoint, parameters } = PROTOCOL_MAP.get(commandName) as ProtocolCommand

            /**
             * validate parameters
             */
            const bodyMap = new Map()
            for (const param of parameters) {
                const userParam = args[param.nameCamelCased]
                const type = (param.schema as OpenAPIV3.SchemaObject).type!.replace('integer', 'number')

                /**
                 * skip param if not set
                 */
                if (typeof userParam === 'undefined') {
                    if (param.required) {
                        throw new Error(`Missing required parameter "${param.name}" for command "${commandName}"`)
                    }

                    continue
                }

                if (typeof userParam !== type) {
                    throw new Error(`Expected parameter for param '${param.name}' from type '${type}', found '${typeof userParam}'`)
                }

                bodyMap.set(param.name, userParam)
            }

            /**
             * get request body by using the body parameter or convert the parameter
             * map into json object
             */
            const body = [...bodyMap.entries()].reduce((e: any, [k, v]) => {
                e[k] = v
                return e
            }, {})

            /**
             * make request
             */
            const uri = `https://zap.${getRegionSubDomain(this._options)}.saucelabs.com${endpoint}`
            try {
                const response = await this._api[method as 'get'](uri, {
                    ...(
                        method === 'get'
                            ? { searchParams: body }
                            : { json: body }
                    ),
                    responseType: 'json',
                    ...(!this.sessionId ? {} : {
                        headers: { 'x-zap-api-key': this.sessionId }
                    })
                }) as any

                /**
                 * attach session id to the scope
                 */
                if (typeof response.body.sessionId) {
                    this.sessionId = response.body.sessionId
                }

                return response.body
            } catch (err) {
                throw new Error(`Failed calling ${propName as string}: ${err.message}, ${err.response && err.response.body}`)
            }
        }
    }
}
