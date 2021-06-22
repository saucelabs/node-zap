import type { OpenAPIV3 } from 'openapi-types'

export interface Parameters extends OpenAPIV3.ParameterObject {
    nameCamelCased: string
}

export interface ProtocolCommand {
    method: OpenAPIV3.HttpMethods
    endpoint: string
    description: OpenAPIV3.OperationObject
    parameters: Parameters[]
}

export interface Options {
    user: string
    key: string
    region: 'apac'
    headers?: Record<string, string>
}
