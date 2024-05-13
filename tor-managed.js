const { exec } = require('child_process');

const totalTORnodes = 100;

function createTorNode(nodeNumber) {
    exec(`multitor --init ${nodeNumber} --socks5 127.0.0.1:8000 --proxy-list proxy_tor.txt`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error ${nodeNumber}: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`Error ${nodeNumber}: ${stderr}`);
            return;
        }
        console.log(`Node ${nodeNumber} created: ${stdout}`);
    });
}

for (let i = 1; i <= totalTORnodes; i++) {
    createTorNode(i);
}

function handleNodeFailure(nodeNumber) {
    console.log(`Node ${nodeNumber} disconnected. Re-creating...`);
    exec(`multitor --stop ${nodeNumber}`, () => {
        createTorNode(nodeNumber);
    });
}

for (let i = 1; i <= totalTORnodes; i++) {
    setInterval(() => {
        exec(`curl --socks5-hostname 127.0.0.1:9${i} https://www.google.com -m 5`, (error, stdout, stderr) => {
            if (error || stderr) {
                handleNodeFailure(i);
            }
        });
    }, 5000);
}
