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
    let urlPath;
    try {
        urlPath = decodeURIComponent(req.url.split('?')[0]);
    } catch (e) {
        // 畸形 URL（非法 % 编码）不再导致进程崩溃
        res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<h1>400 Bad Request</h1>');
        return;
    }
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
    console.log('政策中心:  http://127.0.0.1:' + PORT + '/policy-center.html');
    console.log('');
    console.log('按 Ctrl+C 停止服务');
    console.log('');
});

// 端口被占用等服务器级错误：打印提示而不是抛出崩溃
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.log('端口 ' + PORT + ' 已被占用，服务器可能已在运行中。');
    } else {
        console.error('服务器错误:', err.message);
    }
});

// 进程级兜底：任何未捕获异常都不再让整个服务挂掉
process.on('uncaughtException', (err) => {
    console.error('[uncaughtException] 已捕获，服务继续运行:', err.message);
});
process.on('unhandledRejection', (reason) => {
    console.error('[unhandledRejection] 已捕获，服务继续运行:', reason);
});
