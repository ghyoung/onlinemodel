# 数据源管理模块技术架构文档

## 1. 系统架构概览

### 1.1 整体架构
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端界面      │    │   后端API       │    │   数据库       │
│   (React)      │◄──►│   (Express.js)  │◄──►│ (PostgreSQL)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   状态管理      │    │   中间件        │    │   连接池       │
│   (Zustand)    │    │ (Auth/Validation)│    │   (pg Pool)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 1.2 技术栈
- **前端**: React 18 + TypeScript + Ant Design
- **状态管理**: Zustand
- **HTTP客户端**: Axios
- **后端**: Node.js + Express.js + TypeScript
- **数据库**: PostgreSQL
- **认证**: JWT (JSON Web Token)
- **构建工具**: Vite (前端), Node.js (后端)

---

## 2. 前端架构

### 2.1 组件结构
```
DataSourceManagement/
├── index.tsx                    # 主组件入口
├── components/
│   ├── DataSourceList.tsx      # 数据源列表组件
│   ├── DataSourceForm.tsx      # 数据源表单组件
│   ├── DataSourceStats.tsx     # 统计信息组件
│   ├── DataSourceActions.tsx   # 操作按钮组件
│   └── DataSourceModal.tsx     # 弹窗组件
├── hooks/
│   ├── useDataSources.ts       # 数据源相关Hook
│   └── useDataSourceForm.ts    # 表单相关Hook
├── types/
│   └── dataSource.ts           # 类型定义
└── utils/
    └── dataSourceUtils.ts      # 工具函数
```

### 2.2 状态管理架构
```typescript
// 数据源状态管理
interface DataSourceStore {
  // 状态
  dataSources: DataSource[]
  loading: boolean
  error: string | null
  stats: DataSourceStats
  
  // 操作
  fetchDataSources: () => Promise<void>
  createDataSource: (data: DataSourceFormData) => Promise<void>
  updateDataSource: (id: number, data: DataSourceFormData) => Promise<void>
  deleteDataSource: (id: number) => Promise<void>
  fetchStats: () => Promise<void>
}
```

### 2.3 路由配置
```typescript
// 路由配置
const routes = [
  {
    path: '/data-source',
    element: (
      <ProtectedRoute>
        <DataSourceManagement />
      </ProtectedRoute>
    )
  }
]
```

---

## 3. 后端架构

### 3.1 目录结构
```
backend/
├── src/
│   ├── routes/
│   │   └── dataSource.js       # 数据源路由
│   ├── middleware/
│   │   ├── auth.js             # 认证中间件
│   │   └── validation.js       # 验证中间件
│   ├── database/
│   │   └── init.js             # 数据库初始化
│   ├── config/
│   │   └── database.js         # 数据库配置
│   └── app.js                  # 应用入口
├── package.json
└── env.config.js               # 环境配置
```

### 3.2 路由架构
```javascript
// 数据源路由配置
const router = express.Router()

// 获取数据源列表
router.get('/', authenticateToken, async (req, res) => { ... })

// 获取统计信息
router.get('/stats', authenticateToken, async (req, res) => { ... })

// 获取单个数据源
router.get('/:id', authenticateToken, validateId, async (req, res) => { ... })

// 创建数据源
router.post('/', authenticateToken, requireUserOrAdmin, validateDataSource, async (req, res) => { ... })

// 更新数据源
router.put('/:id', authenticateToken, requireUserOrAdmin, validateId, validateDataSource, async (req, res) => { ... })

// 删除数据源
router.delete('/:id', authenticateToken, requireUserOrAdmin, validateId, async (req, res) => { ... })

// 测试连接
router.post('/:id/test', authenticateToken, requireUserOrAdmin, validateId, async (req, res) => { ... })

// 切换状态
router.put('/:id/toggle', authenticateToken, requireUserOrAdmin, validateId, async (req, res) => { ... })
```

### 3.3 中间件架构
```javascript
// 认证中间件
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) {
    return res.status(401).json({ message: '访问令牌缺失' })
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch (error) {
    return res.status(403).json({ message: '访问令牌无效' })
  }
}

// 验证中间件
const validateDataSource = (req, res, next) => {
  const { name, type, host, port, database, username, password } = req.body
  
  if (!name || !type || !host || !port || !database || !username || !password) {
    return res.status(400).json({ message: '缺少必要字段' })
  }
  
  next()
}
```

---

## 4. 数据库设计

### 4.1 核心表结构
```sql
-- 数据源表
CREATE TABLE data_sources (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  type VARCHAR(50) NOT NULL,
  connection_info JSONB NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  last_test_at TIMESTAMP,
  last_sync_at TIMESTAMP,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 用户表
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'user',
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 表信息表
CREATE TABLE tables (
  id SERIAL PRIMARY KEY,
  data_source_id INTEGER NOT NULL REFERENCES data_sources(id),
  table_name VARCHAR(100) NOT NULL,
  schema_name VARCHAR(100),
  description TEXT,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(data_source_id, table_name)
);
```

### 4.2 索引设计
```sql
-- 性能优化索引
CREATE INDEX idx_data_sources_status ON data_sources(status);
CREATE INDEX idx_data_sources_type ON data_sources(type);
CREATE INDEX idx_data_sources_created_by ON data_sources(created_by);
CREATE INDEX idx_data_sources_created_at ON data_sources(created_at);

-- 复合索引
CREATE INDEX idx_data_sources_status_type ON data_sources(status, type);
CREATE INDEX idx_tables_data_source_status ON tables(data_source_id, status);
```

### 4.3 连接池配置
```javascript
// 数据库连接池配置
const pool = new Pool({
  host: envConfig.DB_HOST,
  port: envConfig.DB_PORT,
  database: envConfig.DB_NAME,
  user: envConfig.DB_USERNAME,
  password: envConfig.DB_PASSWORD,
  max: 20,                    // 最大连接数
  idleTimeoutMillis: 30000,   // 空闲超时
  connectionTimeoutMillis: 2000, // 连接超时
  ssl: envConfig.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
})
```

---

## 5. 安全架构

### 5.1 认证机制
```javascript
// JWT Token生成
const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      username: user.username,
      role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  )
}

// Token验证
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET)
  } catch (error) {
    throw new Error('Token验证失败')
  }
}
```

### 5.2 权限控制
```javascript
// 角色权限中间件
const requireUserOrAdmin = (req, res, next) => {
  if (req.user.role === 'admin' || req.user.role === 'user') {
    next()
  } else {
    res.status(403).json({ message: '权限不足' })
  }
}

const requireAdmin = (req, res, next) => {
  if (req.user.role === 'admin') {
    next()
  } else {
    res.status(403).json({ message: '需要管理员权限' })
  }
}
```

### 5.3 数据验证
```javascript
// 输入验证
const validateDataSource = (req, res, next) => {
  const { name, type, host, port, database, username, password } = req.body
  
  // 名称验证
  if (!name || name.length < 2 || name.length > 100) {
    return res.status(400).json({ message: '名称长度必须在2-100字符之间' })
  }
  
  // 类型验证
  const validTypes = ['MYSQL', 'POSTGRESQL', 'SQLSERVER', 'ORACLE', 'MONGODB', 'REDIS']
  if (!validTypes.includes(type.toUpperCase())) {
    return res.status(400).json({ message: '不支持的数据源类型' })
  }
  
  // 端口验证
  if (port < 1 || port > 65535) {
    return res.status(400).json({ message: '端口号必须在1-65535之间' })
  }
  
  next()
}
```

---

## 6. 性能优化

### 6.1 数据库优化
```javascript
// 查询优化
const getDataSourcesWithPagination = async (page = 1, limit = 10) => {
  const offset = (page - 1) * limit
  
  // 使用窗口函数优化分页
  const query = `
    SELECT 
      ds.*,
      u.username as created_by_name,
      COUNT(*) OVER() as total_count
    FROM data_sources ds
    LEFT JOIN users u ON ds.created_by = u.id
    WHERE ds.status != 'deleted'
    ORDER BY ds.created_at DESC
    LIMIT $1 OFFSET $2
  `
  
  const result = await db.query(query, [limit, offset])
  return result.rows
}
```

### 6.2 缓存策略
```javascript
// Redis缓存配置（未来版本）
const cacheDataSources = async (key, data, ttl = 300) => {
  try {
    await redis.setex(key, ttl, JSON.stringify(data))
  } catch (error) {
    console.warn('缓存设置失败:', error.message)
  }
}

const getCachedDataSources = async (key) => {
  try {
    const cached = await redis.get(key)
    return cached ? JSON.parse(cached) : null
  } catch (error) {
    console.warn('缓存获取失败:', error.message)
    return null
  }
}
```

### 6.3 连接池优化
```javascript
// 连接池监控
pool.on('connect', (client) => {
  console.log('数据库连接已建立')
})

pool.on('error', (err, client) => {
  console.error('数据库连接池错误:', err)
})

pool.on('remove', (client) => {
  console.log('数据库连接已移除')
})
```

---

## 7. 错误处理

### 7.1 统一错误处理
```javascript
// 全局错误处理中间件
const errorHandler = (err, req, res, next) => {
  console.error('错误详情:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    user: req.user?.username,
    timestamp: new Date().toISOString()
  })
  
  // 根据错误类型返回不同状态码
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: '验证错误',
      message: err.message
    })
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      error: '认证失败',
      message: '请重新登录'
    })
  }
  
  // 默认500错误
  res.status(500).json({
    success: false,
    error: '服务器错误',
    message: '内部服务器错误'
  })
}
```

### 7.2 业务错误处理
```javascript
// 业务逻辑错误
const handleDataSourceError = (error, operation) => {
  const errorMap = {
    'duplicate_name': '数据源名称已存在',
    'connection_failed': '数据库连接失败',
    'invalid_credentials': '用户名或密码错误',
    'database_not_found': '数据库不存在',
    'permission_denied': '权限不足'
  }
  
  const message = errorMap[error.code] || error.message
  throw new Error(`${operation}失败: ${message}`)
}
```

---

## 8. 监控和日志

### 8.1 日志配置
```javascript
// Winston日志配置
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
})

// 开发环境控制台输出
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }))
}
```

### 8.2 性能监控
```javascript
// 请求响应时间监控
const responseTime = (req, res, next) => {
  const start = Date.now()
  
  res.on('finish', () => {
    const duration = Date.now() - start
    console.log(`${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`)
    
    // 记录慢查询
    if (duration > 1000) {
      logger.warn('慢查询警告', {
        method: req.method,
        url: req.url,
        duration,
        user: req.user?.username
      })
    }
  })
  
  next()
}
```

---

## 9. 部署架构

### 9.1 环境配置
```javascript
// 环境变量配置
const envConfig = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 3002,
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: process.env.DB_PORT || 5433,
  DB_NAME: process.env.DB_NAME || 'lakehouse_modeling',
  DB_USERNAME: process.env.DB_USERNAME || 'lakehouse_user',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  DB_SSL: process.env.DB_SSL || 'false',
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h'
}
```

### 9.2 Docker配置
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3002

CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  backend:
    build: .
    ports:
      - "3002:3002"
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres
      - DB_PORT=5432
    depends_on:
      - postgres
  
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: lakehouse_modeling
      POSTGRES_USER: lakehouse_user
      POSTGRES_PASSWORD: your_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5433:5432"

volumes:
  postgres_data:
```

---

## 10. 测试架构

### 10.1 测试策略
```javascript
// Jest测试配置
module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/app.js'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
}
```

### 10.2 测试用例结构
```
tests/
├── unit/
│   ├── routes/
│   │   └── dataSource.test.js
│   ├── middleware/
│   │   ├── auth.test.js
│   │   └── validation.test.js
│   └── utils/
│       └── database.test.js
├── integration/
│   └── dataSource.test.js
├── e2e/
│   └── dataSource.test.js
└── setup.js
```

---

## 11. 未来扩展

### 11.1 微服务架构
- 数据源管理服务独立部署
- 使用消息队列进行服务间通信
- 支持水平扩展

### 11.2 云原生支持
- Kubernetes部署支持
- 服务网格集成
- 自动扩缩容

### 11.3 高级功能
- 数据源连接池管理
- 性能监控和告警
- 自动化备份和恢复
- 多租户支持

---

*文档版本: v1.0.0*  
*最后更新: 2025-08-14*  
*文档维护: 开发团队*
