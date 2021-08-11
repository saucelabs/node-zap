import SauceZap from '../build'

;(async () => {
    const zaproxy = new SauceZap()

    /**
     * start Sauce Labs Zap session
     */
    const { sessionId } = await zaproxy.session.newSession({ sessionTimeout: 1000 * 10 })
    console.log(`Session with id "${sessionId}" started`)

    const testStart = Date.now()
    while (true) {
        /**
         * sleep for 1s
         */
        await new Promise((resolve) => setTimeout(resolve, 1000))

        try {
            console.log(`Running tests for ${(Date.now() - testStart) / 1000}s ...`)
            await zaproxy.alert.alerts()
        } catch (e) {
            break
        }
    }

    console.log(`Session terminated after ${(Date.now() - testStart) / 1000}s`)
})().catch((err) => console.error(err))
