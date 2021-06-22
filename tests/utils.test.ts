import { toString, getRegionSubDomain } from '../src/utils'

test('toString', () => {
    // @ts-ignore
    expect(toString({
        user: 'foobar',
        _accessKey: '50fc1a11-3231-4240-9707-8f34682b17b0',
        _options: {
            region: 'apac' as 'apac',
            user: 'foobar',
            key: '50fc1a11-3231-4240-9707-8f34682b17b0',
        }
    })).toBe(`ZapProxy API Client {
  username: 'foobar',
  key: 'XXXXXXXX-XXXX-XXXX-XXXX-XXXXXX2b17b0',
  region: 'apac'
}`)
})

test('getRegionSubDomain', () => {
    expect(getRegionSubDomain()).toBe('us-west-1')
    expect(getRegionSubDomain({ region: 'eu' })).toBe('eu-central-1')
    expect(getRegionSubDomain({ region: 'us' })).toBe('us-west-1')
    expect(getRegionSubDomain({ region: 'apac' })).toBe('apac-southeast-1')
})
