# 湖仓建模工具

一个现代化的湖仓建模平台，采用Quarkus + React + Ant Design技术栈，提供从设计到开发、从文档到代码的全流程支持。

## 🚀 技术架构

### 后端技术栈
- **框架**: Quarkus 3.6.0 + Java 17
- **数据库**: PostgreSQL 15 + 内嵌缓存
- **搜索引擎**: Typesense 0.25+
- **ORM**: Hibernate ORM + Panache
- **安全**: JWT认证 + 基于角色的权限控制
- **WebSocket**: 实时协作支持
- **调度**: Quarkus Scheduler

### 前端技术栈
- **框架**: React 18 + TypeScript 5.x
- **UI库**: Ant Design 5.x
- **状态管理**: Zustand
- **构建工具**: Vite + Rollup
- **图形库**: G6 (蚂蚁金服)

### 部署架构
- **容器化**: Docker + Docker Compose
- **开发模式**: 热重载 + 快速构建
- **生产部署**: 单容器部署（可选K8s）

## 🎯 核心功能

### P0功能（MVP）
- [x] 数据源管理模块
- [x] DDL快速导入模块
- [x] 在线建模模块
- [x] 标准字段库
- [x] 全局搜索模块
- [x] 安全设置
- [x] 模型管理
- [x] 系统设置

### P1功能（重要）
- [ ] 可视化血缘关系图
- [ ] 数据治理模块
- [ ] 仪表板

### P2功能（增强）
- [ ] 飞书文档同步
- [ ] 协作功能

### P3功能（优化）
- [ ] 模型文档比对

## 🛠️ 开发环境要求

- **Java**: 17+
- **Node.js**: 18+
- **Maven**: 3.8+
- **Docker**: 20.10+
- **Docker Compose**: 2.0+

## 🚀 快速开始

### 1. 克隆项目
```bash
git clone <repository-url>
cd automodelwithcursor
```

### 2. 启动开发环境

#### Linux/macOS
```bash
chmod +x code/start-dev.sh
./code/start-dev.sh
```

#### Windows
```cmd
code\start-dev.bat
```

### 3. 访问应用
- **前端**: http://localhost:5173
- **后端**: http://localhost:8080
- **PostgreSQL**: localhost:5432
- **Typesense**: localhost:8108

## 🔧 开发指南

### 后端开发
```bash
cd code/backend

# 启动开发模式（支持热重载）
mvn quarkus:dev

# 构建项目
mvn clean package

# 运行测试
mvn test
```

### 前端开发
```bash
cd code/frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

### 数据库管理
```bash
cd code/docker

# 启动数据库服务
docker-compose -f docker-compose-simple.yml up -d

# 查看服务状态
docker-compose -f docker-compose-simple.yml ps

# 停止服务
docker-compose -f docker-compose-simple.yml down
```

## 📁 项目结构

```
code/
├── backend/                 # Quarkus后端服务
│   ├── src/main/java/      # Java源代码
│   ├── src/main/resources/ # 配置文件
│   └── pom.xml            # Maven配置
├── frontend/               # React前端应用
│   ├── src/               # 源代码
│   ├── public/            # 静态资源
│   └── package.json       # 依赖配置
├── docker/                 # Docker配置
│   ├── docker-compose.yml # 完整服务配置
│   └── docker-compose-simple.yml # 简化配置
└── start-dev.sh           # 开发环境启动脚本
```

## 🎨 设计规范

- **UI组件**: 基于Ant Design 5.x设计系统
- **代码规范**: ESLint + Prettier
- **提交规范**: Conventional Commits
- **分支策略**: Git Flow

## 📊 性能特性

- **启动速度**: 冷启动 < 50ms，热启动 < 10ms
- **内存占用**: 比Spring Boot减少30-50%
- **响应速度**: API响应时间 < 100ms
- **开发体验**: 热重载、快速构建、更好的调试体验

## 🔒 安全特性

- **认证**: JWT Token认证
- **授权**: 基于角色的访问控制(RBAC)
- **数据加密**: 传输和存储加密
- **审计日志**: 完整的操作日志记录

## 🚀 部署指南

### 开发环境
```bash
# 使用简化配置启动
docker-compose -f docker-compose-simple.yml up -d
mvn quarkus:dev
npm run dev
```

### 生产环境
```bash
# 构建生产版本
mvn clean package -Pnative
docker-compose up -d
```

## 🤝 贡献指南

1. Fork项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建Pull Request

## 📝 许可证

本项目采用MIT许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📞 联系我们

- 项目维护者: [Your Name]
- 邮箱: [your.email@example.com]
- 项目地址: [GitHub Repository URL]

## 🙏 致谢

感谢以下开源项目的支持：
- [Quarkus](https://quarkus.io/) - 现代化Java框架
- [React](https://reactjs.org/) - 前端框架
- [Ant Design](https://ant.design/) - UI组件库
- [Typesense](https://typesense.org/) - 搜索引擎
- [PostgreSQL](https://www.postgresql.org/) - 数据库

