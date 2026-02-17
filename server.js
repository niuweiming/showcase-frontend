const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

// MIME 类型映射
const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.webp': 'image/webp'
};

const server = http.createServer((req, res) => {
    // 处理根路径，重定向到首页
    if (req.url === '/') {
        res.writeHead(302, { 'Location': '/pages/index.html' });
        res.end();
        return;
    }

    // 构建文件路径
    let filePath = path.join(__dirname, 'public', req.url);

    // 检查文件是否存在
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            // 文件不存在，返回 404
            res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
            fs.readFile(path.join(__dirname, 'public/pages/404.html'), (err, content) => {
                if (err) {
                    res.end('<h1>404 - 页面未找到</h1>');
                } else {
                    res.end(content);
                }
            });
            return;
        }

        // 读取文件
        fs.readFile(filePath, (err, content) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end('<h1>500 - 服务器错误</h1>');
                return;
            }

            // 获取文件扩展名
            const ext = path.extname(filePath);
            const contentType = mimeTypes[ext] || 'application/octet-stream';

            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        });
    });
});

server.listen(PORT, () => {
    console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
    console.log(`📁 访问首页: http://localhost:${PORT}/pages/index.html`);
});
