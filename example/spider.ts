import SauceZap from '../build'

;(async () => {
    const zap = new SauceZap()
    const foo = await zap.session.newSession(1000 * 60)
    console.log(foo)

    await zap.pscan.maxAlertsPerRule()
})().catch((err) => console.error(123, err))
