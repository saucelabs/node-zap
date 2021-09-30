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

export interface Options {
    /**
     * Your Sauce Labs username
     */
    user: string
    /**
     * Your Sauce Labs access key
     */
    key: string
    /**
     * Region to run the test in (currently only APAC)
     */
    region: 'apac'
    /**
     * Provide a session id if you want to attach yourself
     * to a running session
     */
    sessionId?: string
    /**
     * Custom headers (optional)
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
