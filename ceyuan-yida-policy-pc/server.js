// 简易静态文件服务器
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const ROOT = __dirname;

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
};

const server = http.createServer((req, res) => {
    let urlPath = decodeURIComponent(req.url.split('?')[0]);
    if (urlPath === '/') urlPath = '/index.html';

    const filePath = path.join(ROOT, urlPath);

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end('<h1>404 Not Found</h1><p>文件不存在: ' + urlPath + '</p>');
            return;
        }
        const ext = path.extname(filePath).toLowerCase();
        const mime = MIME[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': mime });
        res.end(data);
    });
});

server.listen(PORT, '127.0.0.1', () => {
    console.log('=================================');
    console.log('  策源易答 本地服务器已启动');
    console.log('=================================');
    console.log('');
    console.log('主入口:   http://127.0.0.1:' + PORT + '/');
    console.log('交付管理:  http://127.0.0.1:' + PORT + '/delivery-management.html');
    console.log('政策计算器: http://127.0.0.1:' + PORT + '/policy-calculator.html');
    console.log('');
    console.log('按 Ctrl+C 停止服务');
    console.log('');
});
