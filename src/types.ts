import type { OpenAPIV3 } from 'openapi-types'

export interface Parameters extends OpenAPIV3.ParameterObject {
    nameCamelCased: string
}

export interface ProtocolCommand {
    method: OpenAPIV3.HttpMethods
    endpoint: string
    description: OpenAPIV3.OperationObject
    parameters: Parameters[]
    responses: OpenAPIV3.ResponsesObject
}

export type SupportedRegions = 'apac' | 'apac-southeast-1'

export interface Options {
    /**
     * Your Sauce Labs username. Can also be set via `SAUCE_USERNAME` environment
     * variable.
     */
    user: string
    /**
     * Your Sauce Labs access key. Can also be set via `SAUCE_ACCESS_KEY` environment
     * variable.
     */
    key: string
    /**
     * Your Sauce Labs datacenter region. The following regions are available:
     *
     * - us-west-1 (short 'us') - not yet available
     * - eu-central-1 (short 'eu') - not yet available
     * - apac-southeast-1 (short 'apac')
     *
     * @default `apac`
     */
    region: SupportedRegions
    /**
     * Provide a session id if you want to attach yourself
     * to a running session (in which case you don't need to call `newSession`).
     */
    sessionId?: string
    /**
     * custom headers
     */
    headers?: Record<string, string>
}

export interface LoadSessionOpts {
    /**
     * path to either:
     *  - a directory
     *  - a *.tar.gz
     * containing session files
     */
    path: string
    /**
     * name of the session
     */
    name: string
}
