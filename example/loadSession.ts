import SauceZap from '../build'

/**
 * In order to run this example, run:
 *   - the asset example `npx ts-node ./example/getAsset.ts` first
 *   - unpack the `session.tar.gz`
 *   - copy the session id from the session file names into the `name` parameter
 *   - run this example
 */
const sessionToLoad = __dirname + '/session'
const testStart = Date.now()

;(async () => {
    const zaproxy = new SauceZap()

    /**
     * start Sauce Labs Zap session
     */
    await zaproxy.session.newSession({ commandTimeout: 1000 * 60 })

    /**
     * load session
     */
    await zaproxy.session.loadSession({
        path: sessionToLoad,
        name: 'ac6f4970-c380-47b8-a9b9-a1dc038b1f76'
    })

    /**
     * receive alerts that were already computed
     */
    const { alerts } = await zaproxy.alert.alerts()
    console.log(alerts)

    await zaproxy.session.deleteSession()
    console.log(`Successfully finished test after ${(Date.now() - testStart) / 1000}s`)
})().catch((err) => console.error(err))
