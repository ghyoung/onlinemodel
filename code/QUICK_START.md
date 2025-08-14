# 湖仓建模工具 - 快速启动指南

## 🚀 快速启动

### 方式1：使用启动脚本（推荐）

#### Windows
```cmd
cd code
start-dev.bat
```

#### Linux/macOS
```bash
cd code
./start-dev.sh
```

### 方式2：手动启动

#### 1. 启动后端服务
```bash
cd code/backend
npm install
npm run dev
```

#### 2. 启动前端服务
```bash
cd code/frontend
npm install
npm run dev
```

## 📋 服务配置

### 端口配置
- **前端**: http://localhost:3002
- **后端**: http://localhost:3000
- **API**: http://localhost:3000/api

### 配置验证
在项目根目录运行配置检查：
```bash
cd code
npm run check-config
```

## 🔧 常见问题解决

### 1. 端口被占用
```bash
# Windows
netstat -ano | findstr :3000
netstat -ano | findstr :3002

# Linux/macOS
lsof -i :3000
lsof -i :3002
```

### 2. 配置错误
运行配置检查脚本：
```bash
npm run check-config
```

### 3. API连接失败
检查后端服务状态：
```bash
curl http://localhost:3000/health
```

## 📱 访问应用

1. 打开浏览器访问：http://localhost:3002
2. 使用默认账户登录：
   - 用户名：admin
   - 密码：admin123

## 🧪 测试API

测试后端API是否正常工作：
```bash
cd code/backend
npm run test-api
```

## 📚 更多信息

- 详细故障排除：查看 [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- 端口配置说明：查看 [PORT_CONFIG.md](./PORT_CONFIG.md)
- 数据源管理模块说明：查看 [数据源管理模块说明.md](./数据源管理模块说明.md)
