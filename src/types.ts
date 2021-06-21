import type { OpenAPIV3 } from 'openapi-types'

export interface ProtocolCommand {
    method: string
    endpoint: string
    description: OpenAPIV3.OperationObject
    servers: OpenAPIV3.ServerObject[]
}

export interface Options {
    user: string
    key: string
    region: 'apac'
    headers?: Record<string, string>
}
