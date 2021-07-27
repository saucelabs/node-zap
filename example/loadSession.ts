import SauceZap from '../build'

/**
 * run `npx ts-node ./example/getAsset.ts` before to get this
 * asset file, session id was: 6989f9e6-7c5c-4208-8585-d57cfadc3158
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
        name: '6989f9e6-7c5c-4208-8585-d57cfadc3158'
    })

    /**
     * receive alerts that were already computed
     */
    const { alerts } = await zaproxy.alert.alerts()
    console.log(alerts)

    await zaproxy.session.deleteSession()
    console.log(`Successfully finished test after ${(Date.now() - testStart) / 1000}s`)
})().catch((err) => console.error(err))
