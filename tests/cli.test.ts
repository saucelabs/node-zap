import yargs from 'yargs'

import { run } from '../src/cli'
import { Options } from '../src/types'

process.env.SAUCE_USERNAME = 'some.user'
process.env.SAUCE_ACCESS_KEY = 'some.access.key'

jest.mock('../src/index', () => {
    class SauceLabsMock {
        public alert: { alert: jest.Mock }
        constructor (public options?: Partial<Options>) {
            this.options = options
            this.alert = {
                alert: jest.fn().mockResolvedValue('alert response')
            }
        }
    }

    return SauceLabsMock
})

test.only('should be able to execute a command', async () => {
    run()
    expect(yargs.usage).toBeCalledTimes(1)
    expect(yargs.epilog).toBeCalledTimes(1)
    expect(yargs.demandCommand).toBeCalledTimes(1)
    expect(yargs.help).toBeCalledTimes(1)
    expect(yargs.option).toBeCalledWith('user', {
        alias: 'u',
        name: 'user',
        description: 'your Sauce Labs username'
    })

    const [command, description, handler, cb] = (yargs.command as jest.Mock).mock.calls[0]
    expect(command).toContain('alertViewAlert [id]')
    expect(description).toContain('Gets the alert with the given ID')

    handler(yargs)
    expect(yargs.positional)
        .toBeCalledWith('id', { describe: '', type: 'integer' })
    expect(yargs.positional).toBeCalledWith('id', {
        describe: '',
        type: 'integer'
    })

    const params = { id: 42 }
    const api = await cb(params)
    expect(api.alert.alert).toBeCalledWith({ id: 42 })
})
