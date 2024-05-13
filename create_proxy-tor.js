const fs = require('fs');

const startPort = 8000;
const endPort = 9000;
const proxyList = [];

for (let port = startPort; port <= endPort; port++) {
    const proxy = `127.0.0.1:${port}`;
    proxyList.push(proxy);
}

const proxyText = proxyList.join('\n');

fs.writeFile('proxy_tor.txt', proxyText, (err) => {
    if (err) {
        console.error('Error writing file:', err);
    } else {
        console.log('proxy_tor.txt created successfully!');
    }
});
