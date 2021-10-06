import SauceZap from '../build'

const testStart = Date.now()
let zaproxy: SauceZap

;(async () => {
    zaproxy = new SauceZap()

    /**
     * start Sauce Labs Zap session
     */
    await zaproxy.session.newSession({
        loadFromSessionId: 'a701a9668f664e09b1d8ba9e6378f259',
        commandTimeout: 1000 * 60 * 60
    })

    /**
     * show urls from pcap files
     */
    const urls = await zaproxy.core.childNodes()
    console.log(JSON.stringify(urls, null, 4))

    await zaproxy.session.deleteSession()
    console.log(`Successfully finished test after ${(Date.now() - testStart) / 1000}s`)

})().catch(async (err) => {
    console.error(err)

    for (let i = 0; i < 1000; ++i) {
        const res = zaproxy.core.loadSession({
            name: 'a701a9668f664e09b1d8ba9e6378f259.session'
        }).then((a) => a, (e) => e)
        console.log(res)
    }
})
