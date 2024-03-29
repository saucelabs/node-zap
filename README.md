

# Sauce Labs OWASP ZAP Node API [![Test Changes](https://github.com/saucelabs/node-zap/actions/workflows/test.yml/badge.svg)](https://github.com/saucelabs/node-zap/actions/workflows/test.yml)

The NodeJS implementation to access the [OWASP ZAP API](https://github.com/zaproxy/zaproxy/wiki/ApiDetails) in Sauce Labs. This is a "Labs" project and for experimental use only.

## Install

```
npm install @saucelabs/zap
```

## Usage

Sauce Labs provides OWASP Zap instances in the cloud for you to use. You only need to authenticate with your Sauce account to access the API. Currently only the `australia-southeast1` region is supported.

```js
import SauceZAP from '@saucelabs/zap'

;(async () => {
    const zaproxy = new SauceZAP({
        user: process.env.SAUCE_USERNAME,
        key: process.env.SAUCE_ACCESS_KEY,
        region: 'apac' // only supported region so far
    });

    /**
     * initiate cloud session (no other command will be accessible before)
     */
    await zaproxy.session.newSession({ commandTimeout: 1000 * 60 })

    /**
     * run ZAP commands
     */
    const { scan } = await zaproxy.spider.scan({ url: 'https://saucedemo.com' })
    // ...

    /**
     * delete session
     */
    await zaproxy.session.deleteSession()
})().catch(console.error)
```

__Note:__ you can find a complete example in [/examples/spider.ts](https://github.com/saucelabs/node-zap/blob/main/example/spider.ts)

### Attach to an Existing Session

If you already have a session running and you want to attach to it, you can do that by passing in the desired session id, e.g.:

```js
const zaproxy = new SauceZAP({
    user: process.env.SAUCE_USERNAME,
    key: process.env.SAUCE_ACCESS_KEY,
    region: 'apac',
    sessionId: 'a71199b9-6016-4abd-a582-5b14f965a413'
});

/**
 * no `newSession` call needed, you can immeditially run commands
 */
const { scan } = await zaproxy.spider.scan({ url: 'https://saucedemo.com' })
```

## API

For a full API list, see [https://www.zaproxy.org/docs/api](zaproxy.org/docs/api). The Node API methods have the same signature as the API documentation.

## Getting Help

For help using the OWASP ZAP API refer to:

  * [API Documentation](https://www.zaproxy.org/docs/api/);
  * [OWASP ZAP User Group](https://groups.google.com/group/zaproxy-users) - for asking questions;

For specific help with this Node API, contact [@christian-bromann](https://github.com/christian-bromann) (the maintainer).

## Issues

To report issues related to the OWASP ZAP Node API, bugs and enhancements requests, use the [issue tracker of the main OWASP ZAP project](https://github.com/saucelabs/node-zap/issues).
