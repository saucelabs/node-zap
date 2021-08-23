import fs from 'fs'
import got from 'got'
import tar from 'tar'
import tmp from 'tmp-promise'
import tunnel from 'tunnel'
import FormData from 'form-data'
import { camelCase } from 'change-case'
import type { OpenAPIV3 } from 'openapi-types'

import { toString, getRegionSubDomain, asyncFilter } from './utils'
import {
    PROTOCOL_MAP, DEFAULT_OPTIONS, SYMBOL_INSPECT, SYMBOL_TOSTRING,
    SYMBOL_ITERATOR, TO_STRING_TAG, API_DOMAINS, SESSION_SUFFIXES
} from './constants'
import type { Options, ProtocolCommand, LoadSessionOpts } from './types'

export default class Zap {
    public user: string
    public region: string
    public sessionId?: string

    private _options: Options
    private _accessKey: string
    private _api: typeof got
    private _proxy: Zap
    private _hasSessionClosed = false

    constructor (public options?: Partial<Options>) {
        const opts = Object.assign({}, DEFAULT_OPTIONS, options || {})

        if (!opts.user || !opts.key) {
            throw new Error('"user" or "key" parameters missing')
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
        } as any, {
            get: this._get.bind(this),
            set: this._set.bind(this)
        })

        // @ts-ignore
        return this._proxy
    }

    private _set (scope: { domain: string }, propName: string, val: string): any {
        if (propName === 'sessionId') {
            this.sessionId = val
            return val
        }

        throw new Error(`Can't set property "${propName}"`)
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
         * ensure user is authenticated
         */
        if (Boolean(scope.domain) && scope.domain !== 'session' && propName !== 'newSession' && !this.sessionId) {
            throw new Error(`Couldn't call command "${propName}", reason: not authenticated! Please call \`zap.session.new({ ... })\` first to authenticate with Sauce Labs cloud.`)
        }

        /**
         * allow to return publicly registered class properties
         */
        if ((this as any)[propName]) {
            const prop = !propName.startsWith('_') ? (this as any)[propName] : undefined

            if (typeof prop === 'function') {
                return prop.bind(this)
            }

            return prop
        }

        /**
         * check if domain is being accessed
         */
        if (API_DOMAINS.has(propName)) {
            return new Proxy({ domain: propName }, { get: this._get.bind(this) })
        }

        const commandNameAsView = camelCase(`${scope.domain}-view-${propName}`)
        const commandNameAsAction = camelCase(`${scope.domain}-action-${propName}`)
        const commandNameAsOther = camelCase(`${scope.domain}-other-${propName}`)
        const commandName = PROTOCOL_MAP.has(commandNameAsView)
            ? commandNameAsView
            : PROTOCOL_MAP.has(commandNameAsOther)
                ? commandNameAsOther
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

        return async (args: Record<string, any> = {}) => {
            const { method, endpoint, parameters, responses } = PROTOCOL_MAP.get(commandName) as ProtocolCommand

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
            const uri = `https://zap.${getRegionSubDomain(this._options)}.saucelabs.com${endpoint.replace('{sessionId}', this.sessionId!)}`
            const responseTypes = Object.keys(((responses || {})['200'] as OpenAPIV3.ResponseObject || {}).content || {})
            const responseType = responseTypes.length === 0 || (responseTypes.length === 1 && responseTypes[0] === 'application/json')
                ? 'json'
                : 'buffer'
            try {
                const response = await this._api[method as 'get'](uri, {
                    ...(
                        method === 'get'
                            ? { searchParams: body }
                            : { json: body }
                    ),
                    responseType,
                    /**
                     * don't send Zap key if session is closed
                     */
                    ...(!this.sessionId || this._hasSessionClosed ? {} : {
                        headers: { 'x-zap-api-key': this.sessionId }
                    })
                }) as any

                /**
                 * attach session id to the scope
                 */
                if (response && response.body && typeof response.body.sessionId === 'string') {
                    this.sessionId = response.body.sessionId
                }

                /**
                 * remove session id if it was closes
                 */
                if (method === 'delete' && endpoint === '/session/{sessionId}') {
                    this._hasSessionClosed = true
                }

                return response.body
            } catch (err) {
                throw new Error(`Failed calling ${propName as string}: ${err.message}, ${err.response && JSON.stringify(err.response.body)}`)
            }
        }
    }

    /**
     * Load persisted session into remote session
     * @param filepath path to `*.tar.gz` file with session files
     */
    async loadSession (opts: LoadSessionOpts) {
        /**
         * create tar file if directory is given
         */
        const stat = await fs.promises.stat(opts.path)
        if (stat.isDirectory()) {
            const tmpFile = await tmp.file()
            const dirFiles = await fs.promises.readdir(opts.path)
            const files = await asyncFilter(dirFiles, async (file) => (
                SESSION_SUFFIXES.some((s) => file.endsWith(s)) &&
                (await fs.promises.stat(`${opts.path}/${file}`)).isFile()
            ))

            await tar.c({
                cwd: opts.path,
                gzip: true,
                file: tmpFile.path
            }, files)

            opts.path = tmpFile.path
        }

        const form = new FormData()
        form.append('session', fs.createReadStream(opts.path))
        form.append('name', opts.name)

        /**
         * make request
         */
        const uri = `https://zap.${getRegionSubDomain(this._options)}.saucelabs.com/session/${this.sessionId}/load`
        try {
            const response = await this._api.post(uri, {
                body: form,
                responseType: 'json'
            }) as any

            return response.body
        } catch (err) {
            throw new Error(`Failed loading session from "${opts.path}": ${err.message}`)
        }
    }
}
