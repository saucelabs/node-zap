import util from 'util'
import got from 'got'
import tar from 'tar'
// @ts-expect-error
import { instances } from 'form-data'

import SauceLabs from '../src'

test('should be inspectable', () => {
    const api = new SauceLabs({ user: 'foo', key: 'bar' })
    /**
     * we can't use snapshotting here as the result varies
     * between different node versions
     */
    expect(util.inspect(api)).toContain(`{
  user: 'foo',
  key: 'XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXbar',
  region: 'apac'`)
})

test('should have to string tag', () => {
    expect(Object.prototype.toString.call(
        new SauceLabs({ user: 'foo', key: 'bar' })
    )).toBe('[object ZapProxy API Client]')
})

test('should fail if no user or key found', () => {
    expect.assertions(1)
    try {
        new SauceLabs({ user: undefined })
    } catch (err) {
        expect(err.message).toContain('parameters missing')
    }
})

test('should not provide an iterator', () => {
    const api = new SauceLabs({ user: 'foo', key: 'bar' })
    expect(() => [...api as any]).toThrow('is not iterable')
})

test('should return public properties', () => {
    const api = new SauceLabs({ user: 'foo', key: 'bar' })
    expect(api.region).toBe('apac')
    expect(api['_accessKey']).toBe(undefined)
})

test('should return nothing if Symbol was accessed', () => {
    const sym = Symbol('foo')
    const api = new SauceLabs({ user: 'foo', key: 'bar' })
    expect(typeof api[sym]).toBe('undefined')
})

test('should grab username and access key from env variable', () => {
    jest.resetModules()
    process.env.SAUCE_USERNAME = 'barfoo'
    process.env.SAUCE_ACCESS_KEY = 'foobar'
    const SauceLabsNew = require('../src').default
    const api = new SauceLabsNew()
    expect(util.inspect(api))
        .toContain('user: \'barfoo\'')
    expect(util.inspect(api))
        .toContain('key: \'XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXfoobar\'')
})

test('should throw if API command is unknown', () => {
    const api = new SauceLabs({ user: 'foo', key: 'bar' })
    // @ts-expect-error
    expect(() => api.doSomethingCool(123, { foo: 'bar' }))
        .toThrow('Couldn\'t find API endpoint for command "doSomethingCool"')
})

test('should allow to call an API method with param in url', async () => {
    const api = new SauceLabs({ user: 'foo', key: 'bar' })
    api.sessionId = 'foobar'

    // @ts-expect-error
    await api.alert.alerts()
    expect((got as any as jest.Mock).mock.calls[0][0])
        .toBe('https://zap.apac-southeast-1.saucelabs.com/JSON/alert/view/alerts/')
})

test('should allow to call an API method with param as option', async () => {
    const api = new SauceLabs({ user: 'foo', key: 'bar' })
    api.sessionId = 'foobar'

    // @ts-expect-error
    await api.alert.alerts({
        baseurl: 'http://sauce'
    })

    const uri = (got as any as jest.Mock).mock.calls[0][0]
    const req = (got as any as jest.Mock).mock.calls[0][1]

    expect(uri).toBe('https://zap.apac-southeast-1.saucelabs.com/JSON/alert/view/alerts/')
    expect(req.searchParams).toEqual({ baseurl: 'http://sauce' })
    expect(req.responseType).toEqual('json')
})

test('should set responseType to buffer if protocol hints multiple response types', async () => {
    const api = new SauceLabs({ user: 'foo', key: 'bar' })
    api.sessionId = 'foobar'

    // @ts-expect-error
    await api.session.getAsset({
        name: 'http://sauce'
    })

    const req = (got as any as jest.Mock).mock.calls[0][1]
    expect(req.responseType).toEqual('buffer')
})

test('should fail if param has wrong type', async () => {
    const api = new SauceLabs({ user: 'foo', key: 'bar' })
    api.sessionId = 'foobar'

    // @ts-expect-error
    const error = await api.alert.alerts({
        baseurl: 123
    }).catch((err) => err)
    expect(error.message).toBe('Expected parameter for param \'baseurl\' from type \'string\', found \'number\'')
})

test('should throw if you try to set a different property than sessionId', () => {
    const api = new SauceLabs({ user: 'foo', key: 'bar' })
    expect(() => {
        // @ts-expect-error
        api.foobar = 'barfoo'
    }).toThrow(/Can't set property "foobar"/)
})

test('can upload *.tar.gz files', async () => {
    const api = new SauceLabs({ user: 'foo', key: 'bar' })
    api.sessionId = 'foobar'

    // @ts-expect-error
    await api.session.loadSession({
        path: __filename,
        name: 'barfoo'
    })

    const formData = instances.pop()
    expect(formData.append).toBeCalledWith('session', expect.any(Object))
    expect(formData.append).toBeCalledWith('name', 'barfoo')

    const uri = (got as any as jest.Mock).mock.calls[0][0]
    expect(uri).toBe('https://zap.apac-southeast-1.saucelabs.com/session/foobar/load')
})

test('can upload session directories', async () => {
    const api = new SauceLabs({ user: 'foo', key: 'bar' })
    api.sessionId = 'foobar'

    // @ts-expect-error
    await api.session.loadSession({
        path: __dirname + '/__fixtures__',
        name: 'barfoo'
    })

    expect(tar.c).toBeCalledWith({
        cwd: __dirname + '/__fixtures__',
        gzip: true,
        file: expect.any(String)
    }, [
        '6989f9e6-7c5c-4208-8585-d57cfadc3158.session',
        '6989f9e6-7c5c-4208-8585-d57cfadc3158.session.data',
        '6989f9e6-7c5c-4208-8585-d57cfadc3158.session.lck',
        '6989f9e6-7c5c-4208-8585-d57cfadc3158.session.log',
        '6989f9e6-7c5c-4208-8585-d57cfadc3158.session.properties',
        '6989f9e6-7c5c-4208-8585-d57cfadc3158.session.script'
    ])

    const formData = instances.pop()
    expect(formData.append).toBeCalledWith('session', expect.any(Object))
    expect(formData.append).toBeCalledWith('name', 'barfoo')

    const uri = (got as any as jest.Mock).mock.calls[0][0]
    expect(uri).toBe('https://zap.apac-southeast-1.saucelabs.com/session/foobar/load')
})

// /**
//      * Load persisted session into remote session
//      * @param filepath path to `*.tar.gz` file with session files
//      */
//  async loadSession (opts: LoadSessionOpts) {
//     /**
//      * create tar file if directory is given
//      */
//     const stat = await fs.promises.stat(opts.path)
//     if (stat.isDirectory()) {
//         const tmpFile = await tmp.file()
//         const dirFiles = await fs.promises.readdir(opts.path)
//         const files = await Promise.all(
//             dirFiles.filter(async (file) => (
//                 SESSION_SUFFIXES.some((s) => file.endsWith(s)) &&
//                 (await fs.promises.stat(`${opts.path}/${file}`)).isFile()
//             ))
//         )
//         await tar.c({
//             cwd: opts.path,
//             gzip: true,
//             file: tmpFile.path
//         }, files)

//         opts.path = tmpFile.path
//     }

//     const form = new FormData()
//     form.append('session', fs.createReadStream(opts.path))
//     form.append('name', opts.name)

//     /**
//      * make request
//      */
//     const uri = `https://zap.${getRegionSubDomain(this._options)}.saucelabs.com/session/${this.sessionId}/load`
//     try {
//         const response = await this._api.post(uri, {
//             body: form,
//             responseType: 'json'
//         }) as any

//         return response.body
//     } catch (err) {
//         throw new Error(`Failed loading session from "${opts.path}": ${err.message}`)
//     }
// }

afterEach(() => {
    (got as any as jest.Mock).mockClear()
})
