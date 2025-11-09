const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const publicPath = path.join(__dirname, 'public');
const tasksFile = path.join(__dirname, 'data', 'tasks.json');

// 确保 data 目录存在
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// 初始化 tasks.json 文件（如果不存在）
if (!fs.existsSync(tasksFile)) {
    fs.writeFileSync(tasksFile, JSON.stringify({}), 'utf-8');
}

// 获取文件 Content-Type（不使用 mime 包）
function getContentType(ext) {
    const mimeTypes = {
        '.html': 'text/html; charset=utf-8',
        '.js': 'text/javascript; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.json': 'application/json; charset=utf-8',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon',
        '.woff': 'font/woff',
        '.woff2': 'font/woff2'
    };
    return mimeTypes[ext] || 'application/octet-stream';
}

// 读取任务数据
function readTasks() {
    try {
        const data = fs.readFileSync(tasksFile, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('读取任务数据失败:', error);
        return {};
    }
}

// 保存任务数据
function saveTasks(tasks) {
    try {
        fs.writeFileSync(tasksFile, JSON.stringify(tasks, null, 2), 'utf-8');
        return true;
    } catch (error) {
        console.error('保存任务数据失败:', error);
        return false;
    }
}

// 处理 API 请求
function handleAPI(req, res, pathname) {
    // 设置 CORS 头部
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    if (pathname === '/api/tasks' && req.method === 'GET') {
        // 获取所有任务
        const tasks = readTasks();
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(tasks));
        return true;
    }

    if (pathname === '/api/tasks' && req.method === 'POST') {
        // 保存任务
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const tasks = JSON.parse(body);
                if (saveTasks(tasks)) {
                    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({ success: true }));
                } else {
                    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({ success: false, error: '保存失败' }));
                }
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ success: false, error: '数据格式错误' }));
            }
        });
        return true;
    }

    return false;
}

const server = http.createServer((req, res) => {
    // 解析 URL（去除 query/hash）
    const parsedUrl = url.parse(req.url);
    let pathname = decodeURIComponent(parsedUrl.pathname);

    // 处理 API 请求
    if (pathname.startsWith('/api/')) {
        if (handleAPI(req, res, pathname)) {
            return;
        }
    }

    // 根路径 → 重定向到首页
    if (pathname === '/' || pathname === '') {
        res.writeHead(302, { 'Location': '/pages/index.html' });
        res.end();
        return;
    }

    // /pages/ 或 /pages → 重定向到首页
    if (pathname === '/pages' || pathname === '/pages/') {
        res.writeHead(302, { 'Location': '/pages/index.html' });
        res.end();
        return;
    }

    // 构建安全文件路径（防止目录穿越）
    const safePath = path.normalize(path.join(publicPath, pathname));
    if (!safePath.startsWith(publicPath)) {
        res.writeHead(403, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<h1>403 - 禁止访问</h1>');
        return;
    }

    // 读取文件扩展名
    const ext = path.extname(safePath).toLowerCase();
    const contentType = getContentType(ext);

    // 创建文件流读取
    fs.stat(safePath, (err, stats) => {
        if (err) {
            // 文件不存在，返回 404
            const errorPage = path.join(publicPath, 'pages', '404.html');
            fs.access(errorPage, fs.constants.F_OK, (notFound) => {
                if (notFound) {
                    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                    res.end('<h1>404 - 页面未找到</h1><a href="/pages/index.html">返回首页</a>');
                } else {
                    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                    const readStream = fs.createReadStream(errorPage);
                    readStream.on('error', () => {
                        res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
                        res.end('<h1>500 - 服务器错误</h1>');
                    });
                    readStream.pipe(res);
                }
            });
            return;
        }

        // 如果是目录，重定向到首页（不显示目录列表）
        if (stats.isDirectory()) {
            res.writeHead(302, { 'Location': '/pages/index.html' });
            res.end();
            return;
        }

        // 确认是文件才继续
        if (!stats.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end('<h1>404 - 页面未找到</h1><a href="/pages/index.html">返回首页</a>');
            return;
        }

        // 静态资源缓存控制
        const cacheable = /\.(js|css|png|jpg|jpeg|gif|svg|woff2?|ico)$/i.test(ext);
        if (cacheable) {
            res.setHeader('Cache-Control', 'public, max-age=31536000');
        } else {
            res.setHeader('Cache-Control', 'no-cache');
        }

        // 流式返回文件内容（高效）
        res.writeHead(200, { 'Content-Type': contentType });
        const readStream = fs.createReadStream(safePath);
        readStream.on('error', () => {
            res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end('<h1>500 - 文件读取失败</h1>');
        });
        readStream.pipe(res);
    });
});

server.listen(PORT, () => {
    console.log(`🚀 服务器已启动！`);
    console.log(`📝 访问地址: http://localhost:${PORT}`);
    console.log(`📝 首页地址: http://localhost:${PORT}/pages/index.html`);
    console.log(`\n按 Ctrl+C 停止服务器\n`);
});
