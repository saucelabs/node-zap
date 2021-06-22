import util from 'util'
import got from 'got'

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
    // @ts-expect-error
    await api.alert.alerts({
        baseurl: 'http://sauce'
    })

    const uri = (got as any as jest.Mock).mock.calls[0][0]
    const req = (got as any as jest.Mock).mock.calls[0][1]

    expect(uri).toBe('https://zap.apac-southeast-1.saucelabs.com/JSON/alert/view/alerts/')
    expect(req.searchParams).toEqual({ baseurl: 'http://sauce' })
})

test('should fail if param has wrong type', async () => {
    const api = new SauceLabs({ user: 'foo', key: 'bar' })
    // @ts-expect-error
    const error = await api.alert.alerts({
        baseurl: 123
    }).catch((err) => err)
    expect(error.message).toBe('Expected parameter for param \'baseurl\' from type \'string\', found \'number\'')
})

afterEach(() => {
    (got as any as jest.Mock).mockClear()
})
