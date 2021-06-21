import yargs from 'yargs'

import { USAGE, CLI_PARAMS, EPILOG, PROTOCOL_MAP, DEFAULT_OPTIONS, BINDING_VERSION_NOTE } from './constants'
import { getParameters } from './utils'
import SauceLabs from '.'
import { OpenAPIV3 } from 'openapi-types'

export const run = () => {
    let argv = yargs.usage(USAGE)
        .epilog(EPILOG)
        .demandCommand()
        .commandDir('commands')
        .help()
        .version(BINDING_VERSION_NOTE)

    for (const [commandName, options] of PROTOCOL_MAP) {
        const params = getParameters(options.description.parameters as OpenAPIV3.ReferenceObject[])
        const command = `${commandName} ${params.map((p) => (
            p.required ? `<${p.name}>` : `[${p.name}]`
        )).join(' ')}`

        const description = (
            options.description.summary ||
            options.description.description ||
            'Unknown description'
        )
        yargs.command(command.trim(), description, (yargs) => {
            for (const param of params) {
                const schema = param.schema as OpenAPIV3.SchemaObject
                const paramDescription = {
                    describe: param.description,
                    type: schema.type
                } as any

                if (typeof schema.default !== 'undefined') {
                    paramDescription.default = schema.default
                }

                yargs.positional(param.name, paramDescription)
            }
        }, async (argv) => {
            const { user, key, region } = Object.assign({}, DEFAULT_OPTIONS, argv)

            if (!user || !key) {
                console.error('"user" and "key" parameters required')
                return process.exit(1)
            }

            const api = new SauceLabs({ user, key, region }) as any
            const requiredParams = params.filter((p) => p.required).map((p) => argv[p.name])

            try {
                const result = await api[commandName](...requiredParams, argv)

                if (typeof result === 'object') {
                    // eslint-disable-next-line no-console
                    return console.log(JSON.stringify(result, null, 4))
                }

                // eslint-disable-next-line no-console
                console.log(result)
            } catch (error) {
                // eslint-disable-next-line no-console
                console.error(error)
                return process.exit(1)
            }

            /**
             * only return for testing purposes
             */
            if (process.env.JEST_WORKER_ID) {
                return api
            }
        })
    }

    /**
     * populate cli arguments
     */
    for (const param of CLI_PARAMS) {
        argv = argv.option(param.name, param)
    }

    return argv.argv
}
