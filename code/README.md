# 湖仓建模工具

## 项目概述
湖仓建模工具是一个面向数据工程师、数据架构师、业务分析师的一站式湖仓建模平台，提供从设计到开发、从文档到代码的全流程支持。

## 技术架构
- **前端**：React 18 + TypeScript + Ant Design 5.x + Vite
- **后端**：Spring Boot 3.x + Java 17
- **数据库**：PostgreSQL 15 + Redis 7 + Elasticsearch 8
- **消息队列**：RabbitMQ 3.12
- **容器化**：Docker + Docker Compose

## 项目结构
```
code/
├── frontend/          # 前端React应用
├── backend/           # 后端Spring Boot应用
├── database/          # 数据库脚本和配置
├── docker/            # Docker配置文件
├── docs/              # 开发文档
└── scripts/           # 部署和构建脚本
```

## 开发环境要求
- Node.js 18+
- Java 17+
- Docker & Docker Compose
- PostgreSQL 15+
- Redis 7+
- Elasticsearch 8+

## 快速开始
1. 启动基础设施：`docker-compose up -d`
2. 启动后端：`cd backend && ./mvnw spring-boot:run`
3. 启动前端：`cd frontend && npm run dev`

## 开发计划
- **第一阶段 (8周)**：MVP核心功能
- **第二阶段 (12周)**：核心功能完善
- **第三阶段 (16周)**：高级功能开发

