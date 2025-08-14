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
