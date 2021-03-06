import SauceZap from '../build'

const urlToScan = 'https://www.saucedemo.com/'
const testStart = Date.now()

;(async () => {
    const zaproxy = new SauceZap()

    /**
     * start Sauce Labs Zap session
     */
    await zaproxy.session.newSession({ commandTimeout: 1000 * 60 })
    const { scan } = await zaproxy.spider.scan({ url: urlToScan })

    while (true) {
        const { status } = await zaproxy.spider.status({ scanId: parseInt(scan, 10) })
        if (status === '100') {
            process.stdout.cursorTo(0)
            process.stdout.write(`Scan Status: ${status}%`)
            process.stdout.write('\n')
            break
        }

        process.stdout.cursorTo(0)
        process.stdout.write(`Scan Status: ${status}%`)
        await new Promise((r) => setTimeout(r, 1000))
    }

    const { scan: ascan } = await zaproxy.ascan.scan({
        url: urlToScan,
        scanPolicyName: 'Default Policy'
    })
    while (true) {
        const { status } = await zaproxy.ascan.status({ scanId: parseInt(ascan, 10) })
        if (status === '100') {
            process.stdout.cursorTo(0)
            process.stdout.write(`Analysis Status: ${status}%`)
            process.stdout.write('\n')
            break
        }

        process.stdout.cursorTo(0)
        process.stdout.write(`Analysis Status: ${status}%`)
        await new Promise((r) => setTimeout(r, 1000))
    }

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
