# 个人网站

## 启动服务器

### 方法1：直接运行（推荐）
```bash
node server.js
```

### 方法2：后台运行
```bash
node server.js &
```

### 方法3：使用 PM2（生产环境推荐）
```bash
# 安装 PM2
npm install -g pm2

# 启动服务器
pm2 start server.js --name personal-site

# 查看状态
pm2 status

# 停止服务器
pm2 stop personal-site

# 重启服务器
pm2 restart personal-site
```

## 访问地址

- 本地访问: http://localhost:3000
- 首页: http://localhost:3000/pages/index.html

## 修改端口

如果要修改端口，可以设置环境变量：

```bash
PORT=8080 node server.js
```

或者修改 `server.js` 文件中的 `PORT` 变量。

## 项目结构

```
个人网站/
├── public/              # 静态文件目录
│   ├── assets/         # 资源文件
│   │   └── images/     # 图片
│   ├── css/            # 样式文件
│   ├── js/             # JavaScript文件
│   └── pages/          # HTML页面
│       ├── index.html  # 首页
│       └── about.html  # 关于我页面
└── server.js           # 服务器文件
```

## 停止服务器

如果服务器在前台运行，按 `Ctrl + C` 停止。

如果在后台运行，使用：
```bash
# 查找进程
ps aux | grep "node server.js"

# 停止进程（替换 PID 为实际进程ID）
kill <PID>
```

## 部署到服务器

1. 将整个项目上传到服务器
2. 在服务器上运行 `node server.js`
3. 使用 PM2 保持运行：
   ```bash
   pm2 start server.js --name personal-site
   pm2 save
   pm2 startup
   ```

## 注意事项

- 这是一个纯静态网站服务器，无需安装任何依赖
- 使用 Node.js 内置模块，直接运行即可
- 默认端口是 3000，可以在代码中修改

