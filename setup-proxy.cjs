const http = require('http');
const httpProxy = require('http-proxy');

const proxy = httpProxy.createProxyServer({});

const server = http.createServer((req, res) => {
  const target = 'https://example.com';
  proxy.web(req, res, {
    target,
    headers: {
      host: new URL(target).host,
    },
  });
});

const PORT = 3129;

server.listen(PORT, '::', () => {
  console.log(`Proxy server is running on port ${PORT}`);
});
