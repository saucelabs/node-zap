import SauceZap from '../build'

const sessionToLoad = __dirname + '/session'
const testStart = Date.now()

;(async () => {
    const zaproxy = new SauceZap()

    /**
     * start Sauce Labs Zap session
     */
    await zaproxy.session.newSession({ commandTimeout: 1000 * 60 })
    await zaproxy.session.loadSession({
        path: sessionToLoad,
        name: 'tbd'
    })

    const { alerts } = await zaproxy.alert.alerts()
    for (const alert of alerts) {
        const url = new URL(alert.url)
        console.log(`${url.pathname} (${alert.risk}): ${alert.name}`)
        console.log(`Description: ${alert.description.trim()}\n`)
        console.log(`Solution: ${alert.solution.trim()}\n\n`)
    }

    await zaproxy.session.deleteSession()
    console.log(`Successfully finished test after ${(Date.now() - testStart) / 1000}s`)
})().catch((err) => console.error(err))
