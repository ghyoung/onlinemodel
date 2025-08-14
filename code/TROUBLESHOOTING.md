# 湖仓建模工具 - 故障排除指南

## 常见问题及解决方案

### 1. 前端启动失败 - SystemSettings页面缺失

**问题描述：**
```
Failed to resolve import "@/pages/SystemSettings" from "src/App.tsx". Does the file exist?
```

**解决方案：**
- ✅ 已修复：创建了缺失的 `SystemSettings.tsx` 页面
- 页面使用Ant Design组件库，包含完整的系统设置功能

**手动修复步骤：**
1. 确保 `src/pages/SystemSettings.tsx` 文件存在
2. 检查文件导入语句是否正确
3. 重启前端开发服务器

### 2. 后端启动失败 - JDWP传输错误和Maven插件问题

**问题描述：**
```
ERROR: transport error 202: bind failed: Can't assign requested address
ERROR: JDWP Transport dt_socket failed to initialize
No plugin found for prefix 'quarkus'
```

**解决方案：**
- ✅ 已修复：创建了完整的 `application.properties` 配置文件
- ✅ 已修复：简化了配置文件，避免配置冲突
- ✅ 已修复：修复了Maven插件配置问题
- ✅ 已修复：创建了jar包启动脚本，避免Maven插件问题
- ✅ 已修复：使用jar包直接启动方式

**手动修复步骤：**
1. 检查 `src/main/resources/application.properties` 文件是否存在
2. 确保端口没有被其他服务占用
3. 清理Maven缓存：`mvn clean`
4. 使用jar包启动方式：`./start-final.sh` (Linux/macOS)
5. 或者直接构建并启动：`mvn package -DskipTests && java -jar target/backend-1.0.0-SNAPSHOT.jar`

### 3. 端口冲突问题

**问题描述：**
- 前端端口不一致（配置显示5173，实际运行在3000）
- 后端端口被占用

**解决方案：**
- ✅ 前端端口已正确配置为3000
- ✅ 后端端口已配置为8080
- 使用修复版启动脚本自动处理端口检查

**手动修复步骤：**
1. 检查端口占用：`lsof -i :8080` 或 `netstat -an | grep 8080`
2. 停止占用端口的服务
3. 修改配置文件中的端口设置

### 4. 数据库连接问题

**问题描述：**
- PostgreSQL连接失败
- 数据库不存在或权限不足

**解决方案：**
- ✅ 启动脚本自动创建PostgreSQL容器
- 默认配置：localhost:5432，数据库名：lakehouse

**手动修复步骤：**
1. 确保PostgreSQL服务运行
2. 创建数据库：`createdb lakehouse`
3. 检查用户权限和密码设置
4. 更新 `application.properties` 中的连接信息

## 使用修复版启动脚本

### Linux/macOS
```bash
cd code
./start-dev-fixed.sh
```

### Windows
```cmd
cd code
start-dev-fixed.bat
```

## 手动启动步骤

如果自动脚本仍有问题，可以按以下步骤手动启动：

### 1. 启动数据库服务
```bash
# PostgreSQL
docker run -d --name postgres-lakehouse \
  -e POSTGRES_DB=lakehouse \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 postgres:15-alpine

# Typesense
docker run -d --name typesense-lakehouse \
  -p 8108:8108 \
  -v typesense-data:/data \
  typesense/typesense:0.25.1 \
  --data-dir /data --api-key=xyz --enable-cors
```

### 2. 启动后端服务
```bash
cd backend
mvn clean
mvn quarkus:dev
```

### 3. 启动前端服务
```bash
cd frontend
npm install
npm run dev
```

## 环境要求

- **Java**: 17或更高版本
- **Node.js**: 18或更高版本
- **Maven**: 3.6或更高版本
- **Docker**: 用于运行PostgreSQL和Typesense（可选）

## 验证服务状态

### 检查端口占用
```bash
# 检查所有相关端口
lsof -i :3000  # 前端
lsof -i :8080  # 后端
lsof -i :5432  # PostgreSQL
lsof -i :8108  # Typesense
```

### 检查服务健康状态
```bash
# 后端健康检查
curl http://localhost:8080/health/live

# 前端访问测试
curl http://localhost:3000

# 数据库连接测试
psql -h localhost -U postgres -d lakehouse
```

## 常见错误代码

| 错误代码 | 含义 | 解决方案 |
|---------|------|----------|
| 202 | 端口绑定失败 | 检查端口占用，修改配置文件 |
| 510 | JDWP初始化失败 | 清理Maven缓存，重新构建 |
| 197 | 传输初始化失败 | 检查网络配置，重启服务 |

## 获取帮助

如果问题仍然存在：

1. 检查日志文件中的详细错误信息
2. 确认所有依赖服务正常运行
3. 尝试清理并重新安装依赖
4. 检查系统防火墙和网络设置

## 更新日志

- **2024-01-XX**: 创建故障排除指南
- **2024-01-XX**: 修复SystemSettings页面缺失问题
- **2024-01-XX**: 修复后端配置文件缺失问题
- **2024-01-XX**: 创建修复版启动脚本

# 数据源管理模块故障排除指南

## 问题：获取统计信息失败

### 症状
- 进入数据源管理模块时显示 toast 提示："获取统计信息失败"
- 统计卡片显示为 0 或空白
- 控制台显示相关错误信息

### 可能原因及解决方案

#### 1. 认证问题

**症状：**
- 控制台显示 401 错误
- 用户被重定向到登录页

**解决方案：**
1. 检查用户是否已登录
2. 清除浏览器本地存储并重新登录
3. 检查认证令牌是否过期

**验证步骤：**
```bash
# 检查本地存储
localStorage.getItem('auth_token')
localStorage.getItem('auth_user')
```

#### 2. 后端服务问题

**症状：**
- 控制台显示 500 错误
- 网络连接失败
- 后端服务无响应

**解决方案：**
1. 检查后端服务是否正常运行
2. 验证数据库连接
3. 检查后端日志

**验证步骤：**
```bash
# 检查后端服务状态
curl http://localhost:3000/health

# 检查后端日志
tail -f backend/logs/app.log
```

#### 3. 数据库问题

**症状：**
- 后端日志显示数据库连接错误
- 统计查询失败

**解决方案：**
1. 检查 PostgreSQL 服务状态
2. 验证数据库连接配置
3. 检查数据表是否存在

**验证步骤：**
```bash
# 检查数据库连接
psql -h localhost -p 5433 -U lakehouse_user -d lakehouse_modeling

# 检查数据表
\dt data_sources
```

#### 4. 网络/代理问题

**症状：**
- 前端无法连接到后端
- 代理配置错误
- CORS 错误

**解决方案：**
1. 检查 Vite 代理配置
2. 验证后端 CORS 设置
3. 检查防火墙设置

**验证步骤：**
```bash
# 测试 API 连接
curl http://localhost:3000/api/data-sources/stats

# 检查代理配置
cat frontend/vite.config.ts
```

#### 5. 内容安全策略（CSP）错误

**症状：**
- 控制台显示 CSP 错误：`Refused to connect to 'http://localhost:3001/api/data-sources' because it violates the following Content Security Policy directive: "connect-src 'self' ws: wss:"`
- 前端试图连接到错误的端口或绝对路径

**解决方案：**
1. 确保前端使用相对路径 `/api` 而不是绝对路径
2. 检查 Vite 代理配置是否正确
3. 验证端口配置一致性

**验证步骤：**
```bash
# 运行配置检查脚本（在项目根目录）
npm run check-config

# 或者在项目根目录直接运行
node check-config-simple.js

# 检查前端配置文件
cat frontend/src/config/env.ts
cat frontend/src/config/api.ts
cat frontend/vite.config.ts
```

**配置要求：**
- 前端端口：3002
- 后端端口：3000
- 前端使用相对路径：`/api`
- Vite 代理目标：`http://localhost:3000`

### 调试步骤

#### 步骤 1：检查前端控制台
1. 打开浏览器开发者工具
2. 查看 Console 标签页
3. 查找错误信息和调试日志

#### 步骤 2：检查网络请求
1. 打开 Network 标签页
2. 刷新页面
3. 查看 `/data-sources/stats` 请求的状态

#### 步骤 3：运行配置检查
```bash
# 在项目根目录运行
npm run check-config

# 或者直接运行
node check-config-simple.js
```

#### 步骤 4：运行 API 测试
```bash
cd backend
npm run test-api
```

#### 步骤 5：检查后端日志
```bash
cd backend
npm run dev
# 查看控制台输出
```

### 常见错误代码

| 错误代码 | 含义 | 解决方案 |
|---------|------|----------|
| 401 | 未授权 | 重新登录，检查认证令牌 |
| 403 | 禁止访问 | 检查用户权限 |
| 500 | 服务器内部错误 | 检查后端日志，验证数据库 |
| 503 | 服务不可用 | 检查数据库连接 |
| ECONNABORTED | 请求超时 | 检查网络连接，增加超时时间 |
| Network Error | 网络错误 | 检查后端服务状态 |
| CSP Error | 内容安全策略错误 | 检查API路径配置，确保使用相对路径 |

### 预防措施

1. **定期检查服务状态**
   - 监控后端服务运行状态
   - 检查数据库连接健康状态

2. **完善错误处理**
   - 前端显示友好的错误信息
   - 后端记录详细的错误日志

3. **用户引导**
   - 提供清晰的错误提示
   - 引导用户进行故障排除

4. **配置一致性**
   - 定期运行配置检查脚本
   - 确保前后端配置匹配

### 联系支持

如果问题仍然存在，请提供以下信息：
1. 错误截图
2. 控制台日志
3. 后端日志
4. 环境信息（操作系统、Node.js 版本等）
5. 重现步骤
6. 配置检查脚本的输出结果
