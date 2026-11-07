// 本地预览代理：把 localhost:3003 转发到已部署的线上站点，
// 方便在 Browser 面板里检查真实线上页面（仅开发验证用）。
const http = require('http');

const TARGET_HOST = '59.110.232.243';
const TARGET_PORT = 80;

const server = http.createServer((req, res) => {
  const headers = { ...req.headers, host: TARGET_HOST };
  // 本地预览的 Origin 与生产域名不同，转发时替换为已配置的生产 Origin。
  if (headers.origin) headers.origin = 'https://playmate.zorazora.cn';
  const proxyReq = http.request(
    { host: TARGET_HOST, port: TARGET_PORT, method: req.method, path: req.url, headers },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
      proxyRes.pipe(res);
    },
  );
  proxyReq.on('error', (err) => {
    res.writeHead(502, { 'content-type': 'text/plain; charset=utf-8' });
    res.end(`preview proxy error: ${err.message}`);
  });
  req.pipe(proxyReq);
});

server.listen(3003, '127.0.0.1', () => {
  console.log('preview proxy on http://127.0.0.1:3003');
});
