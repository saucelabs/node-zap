import fs from 'fs'
import SauceZap from '../build'

const urlToScan = 'https://www.saucedemo.com/'

;(async () => {
    const zaproxy = new SauceZap()

    /**
     * start Sauce Labs Zap session
     */
    await zaproxy.session.newSession({ commandTimeout: 1000 * 60 })
    const { scan } = await zaproxy.spider.scan({ url: urlToScan })
    console.log(`Scanned ${urlToScan}, results in ${scan}`)

    /**
     * close session
     */
    await zaproxy.session.deleteSession()

    /**
     * wait 20s until assets are uploaded
     * Note(Christian): this will be fixed
     */
    await new Promise((resolve) => setTimeout(resolve, 20 * 1000))

    /**
     * download zap.log
     */
    const zapLog = await zaproxy.session.getAsset({ name: 'zap.log' }) as Buffer
    console.log('Content of zap.log\n', zapLog.toString())
    await fs.promises.writeFile(__dirname + '/zap.log', zapLog)

    /**
     * download session.json
     */
    const sessionJson = await zaproxy.session.getAsset({ name: 'session.json' }) as Buffer
    console.log('Content of session.json\n', sessionJson.toString())
    await fs.promises.writeFile(__dirname + '/session.json', sessionJson)

    /**
     * download session.tar.gz
     */
    const session = await zaproxy.session.getAsset({ name: 'session.tar.gz' }) as Buffer
    await fs.promises.writeFile(__dirname + '/session.tar.gz', session)
})().catch((err) => console.error(err))
