# 湖仓建模工具

## 项目简介

湖仓建模工具是一个用于数据湖和数据仓库建模的Web应用，提供数据源管理、模型设计、血缘关系追踪等功能。

## 项目结构

```
code/
├── backend/          # 后端服务 (Node.js + Express)
├── frontend/         # 前端应用 (React + TypeScript)
├── doc/              # 项目文档中心
│   ├── api/          # API接口文档
│   ├── requirements/ # 需求文档
│   ├── technical/    # 技术架构文档
│   └── development/  # 开发计划文档
├── start.bat         # 统一启动脚本 (Windows)
└── README.md         # 项目说明文档
```

## 环境要求

- Node.js 18+
- npm 8+
- PostgreSQL 数据库

## 快速启动

### Windows 用户

1. 双击 `start.bat` 文件
2. 等待服务启动完成
3. 访问前端页面：http://localhost:5173

### 手动启动

#### 启动后端服务

```bash
cd backend
npm install
npm run dev
```

#### 启动前端服务

```bash
cd frontend
npm install
npm run dev
```

## 服务地址

- **前端页面**: http://localhost:5173
- **后端API**: http://localhost:3002
- **健康检查**: http://localhost:3002/health
- **文档中心**: [项目文档](./doc/README.md)

## 默认账号

- **用户名**: admin
- **密码**: admin123

## 数据库配置

项目使用PostgreSQL数据库，默认配置：

- 主机: localhost
- 端口: 5433
- 数据库: lakehouse_modeling
- 用户名: lakehouse_user
- 密码: lakehouse_pass

## 开发说明

### 后端开发

- 使用ES6模块语法
- 支持热重载 (nodemon)
- 数据库连接池管理
- JWT认证中间件

### 前端开发

- React 18 + TypeScript
- Ant Design UI组件库
- Zustand状态管理
- React Query数据获取

## 故障排除

### 常见问题

1. **端口被占用**: 检查3000和5173端口是否被其他服务占用
2. **数据库连接失败**: 确保PostgreSQL服务正在运行
3. **依赖安装失败**: 检查Node.js版本和网络连接

### 启动失败检查

1. 确认在项目根目录运行启动脚本
2. 检查Node.js和npm是否正确安装
3. 查看新打开的命令行窗口中的错误信息
4. 检查防火墙设置

## 更新日志

### v1.0.0-beta (2025-08-14)
- 完成数据源管理模块核心功能开发
- 修复所有已知的技术问题和Bug
- 完善用户认证和权限管理系统
- 建立完整的项目文档体系
- 优化前后端性能和用户体验

### v1.0.0-alpha (2025-07-15)
- 清理多余的启动脚本，统一使用start.bat
- 修复前后端接口配置一致性
- 解决Windows批处理文件中文乱码问题
- 优化数据库查询语法，支持PostgreSQL

## 技术支持

如遇到问题，请检查：
1. 项目目录结构是否正确
2. 环境变量配置是否一致
3. 数据库服务是否正常运行
4. 网络和防火墙设置

