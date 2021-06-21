import SauceZap from '../build'

const urlToScan = 'https://www.saucedemo.com/'

;(async () => {
    const zaproxy = new SauceZap()
    await zaproxy.session.newSession(1000 * 60)

    const { scan } = await zaproxy.spider.scan(urlToScan)

    while (true) {
        const { status } = await zaproxy.spider.status(scan)
        if (status === '100') {
            process.stdout.cursorTo(0)
            process.stdout.write(`Scan Status: ${status}%`)
            process.stdout.write(`\n`)
            break
        }

        process.stdout.cursorTo(0)
        process.stdout.write(`Scan Status: ${status}%`)
        await new Promise((r) => setTimeout(r, 1000))
    }

    const { scan: ascan } = await zaproxy.ascan.scan(urlToScan, false, false, 'Default Policy')
    while (true) {
        const { status } = await zaproxy.ascan.status(ascan)
        if (status === '100') {
            process.stdout.cursorTo(0)
            process.stdout.write(`Analysis Status: ${status}%`)
            process.stdout.write(`\n`)
            break
        }

        process.stdout.cursorTo(0)
        process.stdout.write(`Analysis Status: ${status}%`)
        await new Promise((r) => setTimeout(r, 1000))
    }

    const { alerts } = await zaproxy.core.alerts()
    for (const alert of alerts) {
        const url = new URL(alert.url)
        console.log(`${url.pathname} (${alert.risk}): ${alert.name}`)
        console.log(`Description: ${alert.description.trim()}\n`)
        console.log(`Solution: ${alert.solution.trim()}\n\n`)
    }

    await zaproxy.session.deleteSession()
})().catch((err) => console.error(err))
