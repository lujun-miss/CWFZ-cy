// 研知π 无形资产 - 最小静态服务（用于本地验证）
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = 8080;
const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js':   'application/javascript; charset=utf-8',
    '.css':  'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png':  'image/png',
    '.jpg':  'image/jpeg',
    '.svg':  'image/svg+xml',
    '.ico':  'image/x-icon'
};

const server = http.createServer(function (req, res) {
    var url = decodeURIComponent(req.url.split('?')[0].split('#')[0]);
    if (url === '/' || url === '') url = '/index.html';
    var filePath = path.join(ROOT, url);
    // 防止越权访问
    if (filePath.indexOf(ROOT) !== 0) {
        res.writeHead(403); res.end('Forbidden'); return;
    }
    fs.readFile(filePath, function (err, data) {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('404 Not Found: ' + url);
            return;
        }
        var ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
        res.end(data);
    });
});

server.listen(PORT, '127.0.0.1', function () {
    console.log('研知π 静态服务已启动: http://127.0.0.1:' + PORT);
    console.log('  - 主框架:         http://127.0.0.1:' + PORT + '/index.html');
});
