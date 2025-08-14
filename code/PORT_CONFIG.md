# 端口配置说明

## 当前配置

### 前端 (Vite)
- **端口**: 3002
- **配置文件**: `frontend/vite.config.ts`
- **环境配置**: `frontend/env.config.js`
- **TypeScript配置**: `frontend/src/config/env.ts`

### 后端 (Node.js)
- **端口**: 3000
- **配置文件**: `backend/env.config.js`
- **主文件**: `backend/src/app.js`

## 端口配置说明

为了避免端口冲突和配置不一致的问题，我们使用以下端口配置：

1. **前端开发服务器**: `http://localhost:3002`
2. **后端API服务**: `http://localhost:3000/api`
3. **前端代理配置**: 将 `/api` 请求代理到 `http://localhost:3000`

## 配置内容

### 1. 后端配置 (`backend/env.config.js`)
```javascript
PORT: 3000,                           // 后端服务端口
FRONTEND_URL: 'http://localhost:3002' // CORS允许的前端地址
```

### 2. 前端Vite配置 (`frontend/vite.config.ts`)
```typescript
server: {
  port: 3002,                         // 前端开发服务器端口
  proxy: {
    '/api': {
      target: 'http://localhost:3000', // API代理目标
      changeOrigin: true
    }
  }
}
```

### 3. 前端环境配置 (`frontend/env.config.js`)
```javascript
API_BASE_URL: '/api' // API基础地址（相对路径）
```

### 4. 前端TypeScript配置 (`frontend/src/config/env.ts`)
```typescript
API_BASE_URL: import.meta.env.VITE_API_BASE_URL || '/api'
```

## 启动方式

### 方式1: 使用启动脚本
```bash
# Windows
start-dev.bat

# Linux/Mac
./start-dev.sh
```

### 方式2: 手动启动
```bash
# 终端1: 启动后端
cd backend
npm run dev

# 终端2: 启动前端
cd frontend
npm run dev
```

## 注意事项

1. **端口配置**: 前端3002端口，后端3000端口
2. **CORS配置**: 后端已配置允许前端域名访问
3. **代理配置**: 前端开发时通过代理访问后端API，避免跨域问题
4. **API路径**: 前端使用相对路径 `/api`，通过Vite代理转发到后端

## 故障排除

### 端口被占用
```bash
# Windows查看端口占用
netstat -ano | findstr :3000
netstat -ano | findstr :3002

# Linux/Mac查看端口占用
lsof -i :3000
lsof -i :3002
```

### 配置不生效
1. 重启开发服务器
2. 检查配置文件语法
3. 确认文件保存成功
4. 检查Vite代理配置是否正确

### 常见问题
1. **CSP错误**: 确保前端使用相对路径 `/api` 而不是绝对路径
2. **代理失败**: 检查Vite代理配置中的target地址是否正确
3. **端口冲突**: 确认3000和3002端口未被其他服务占用
