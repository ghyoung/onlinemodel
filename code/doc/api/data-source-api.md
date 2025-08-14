# 数据源管理模块 API 文档

## 基础信息
- **基础URL**: `http://localhost:3002/api`
- **认证方式**: JWT Token (Bearer)
- **内容类型**: `application/json`

## 认证要求
所有API请求都需要在Header中包含有效的JWT Token：
```
Authorization: Bearer <your_jwt_token>
```

---

## 数据源管理API

### 1. 获取数据源列表

**接口**: `GET /data-sources`

**描述**: 获取分页的数据源列表，支持筛选

**请求参数**:
| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| page | number | 否 | 1 | 页码 |
| limit | number | 否 | 10 | 每页数量 |
| type | string | 否 | - | 数据源类型筛选 |
| status | string | 否 | - | 状态筛选 |

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "MySQL主库",
      "description": "生产环境主数据库",
      "type": "MYSQL",
      "host": "192.168.1.100",
      "port": 3306,
      "database": "production_db",
      "username": "db_user",
      "status": "active",
      "isEnabled": true,
      "lastTestAt": "2025-08-14T16:30:00Z",
      "lastSyncAt": "2025-08-14T16:00:00Z",
      "createdAt": "2025-08-14T10:00:00Z",
      "createdBy": {
        "username": "admin"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

---

### 2. 获取数据源统计信息

**接口**: `GET /data-sources/stats`

**描述**: 获取数据源统计概览

**响应示例**:
```json
{
  "success": true,
  "data": {
    "total": 25,
    "connected": 20,
    "error": 2,
    "enabled": 23
  }
}
```

---

### 3. 获取单个数据源

**接口**: `GET /data-sources/:id`

**描述**: 根据ID获取数据源详细信息

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | number | 是 | 数据源ID |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "MySQL主库",
    "description": "生产环境主数据库",
    "type": "MYSQL",
    "host": "192.168.1.100",
    "port": 3306,
    "database": "production_db",
    "username": "db_user",
    "status": "active",
    "isEnabled": true,
    "lastTestAt": "2025-08-14T16:30:00Z",
    "lastSyncAt": "2025-08-14T16:00:00Z",
    "createdAt": "2025-08-14T10:00:00Z",
    "createdBy": {
      "username": "admin"
    },
    "tables": [
      {
        "id": 1,
        "table_name": "users",
        "schema_name": "public",
        "description": "用户表"
      }
    ]
  }
}
```

---

### 4. 创建数据源

**接口**: `POST /data-sources`

**描述**: 创建新的数据源

**请求体**:
```json
{
  "name": "MySQL测试库",
  "description": "测试环境数据库",
  "type": "MYSQL",
  "host": "localhost",
  "port": 3306,
  "database": "test_db",
  "username": "test_user",
  "password": "test_password",
  "connectionParams": "charset=utf8mb4"
}
```

**字段说明**:
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 数据源名称（唯一） |
| description | string | 否 | 数据源描述 |
| type | string | 是 | 数据源类型 |
| host | string | 是 | 主机地址 |
| port | number | 是 | 端口号 |
| database | string | 是 | 数据库名 |
| username | string | 是 | 用户名 |
| password | string | 是 | 密码 |
| connectionParams | string | 否 | 额外连接参数 |

**响应示例**:
```json
{
  "success": true,
  "message": "数据源创建成功",
  "data": {
    "id": 2,
    "name": "MySQL测试库",
    "description": "测试环境数据库",
    "type": "MYSQL",
    "host": "localhost",
    "port": 3306,
    "database": "test_db",
    "username": "test_user",
    "status": "active",
    "isEnabled": true,
    "lastTestAt": "2025-08-14T16:45:00Z",
    "lastSyncAt": "2025-08-14T16:45:00Z",
    "createdAt": "2025-08-14T16:45:00Z",
    "createdBy": {
      "username": "admin"
    }
  }
}
```

---

### 5. 更新数据源

**接口**: `PUT /data-sources/:id`

**描述**: 更新现有数据源信息

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | number | 是 | 数据源ID |

**请求体**: 同创建数据源，所有字段都是可选的

**响应示例**:
```json
{
  "success": true,
  "message": "数据源更新成功",
  "data": {
    "id": 2,
    "name": "MySQL测试库更新",
    "description": "更新后的描述",
    "type": "MYSQL",
    "host": "localhost",
    "port": 3306,
    "database": "test_db",
    "username": "test_user",
    "status": "active",
    "isEnabled": true,
    "lastTestAt": "2025-08-14T16:45:00Z",
    "lastSyncAt": "2025-08-14T16:45:00Z",
    "createdAt": "2025-08-14T16:45:00Z",
    "createdBy": {
      "username": "admin"
    }
  }
}
```

---

### 6. 删除数据源

**接口**: `DELETE /data-sources/:id`

**描述**: 软删除数据源（标记为deleted状态）

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | number | 是 | 数据源ID |

**响应示例**:
```json
{
  "success": true,
  "message": "数据源删除成功"
}
```

---

### 7. 测试数据源连接

**接口**: `POST /data-sources/:id/test`

**描述**: 测试数据源连接是否正常

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | number | 是 | 数据源ID |

**响应示例**:
```json
{
  "success": true,
  "message": "连接测试成功",
  "data": {
    "status": "success",
    "message": "成功连接到 localhost:3306/test_db",
    "timestamp": "2025-08-14T16:50:00Z"
  }
}
```

---

### 8. 切换数据源状态

**接口**: `PUT /data-sources/:id/toggle`

**描述**: 启用或禁用数据源

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | number | 是 | 数据源ID |

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| enabled | boolean | 是 | true为启用，false为禁用 |

**响应示例**:
```json
{
  "success": true,
  "message": "数据源已启用",
  "data": {
    "status": "active"
  }
}
```

---

## 错误响应格式

所有API在发生错误时都会返回统一的错误格式：

```json
{
  "success": false,
  "error": "错误类型",
  "message": "详细错误信息"
}
```

### 常见HTTP状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未认证或Token无效 |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

---

## 数据源类型支持

### 关系型数据库
- MySQL
- PostgreSQL
- SQL Server
- Oracle
- SQLite

### NoSQL数据库
- MongoDB
- Redis
- Cassandra
- Elasticsearch

### 其他类型
- CSV文件
- Excel文件
- API接口
- 自定义连接器

---

## 数据源状态说明

| 状态 | 说明 |
|------|------|
| active | 活跃状态，可正常使用 |
| inactive | 禁用状态，暂时不可用 |
| error | 错误状态，连接失败 |
| deleted | 已删除状态（软删除） |

---

## 开发注意事项

1. **安全性**: 密码等敏感信息在传输和存储时需要进行加密
2. **连接池**: 建议实现连接池管理，避免频繁创建数据库连接
3. **错误处理**: 需要完善的错误处理和日志记录
4. **性能监控**: 建议添加连接性能监控和统计
5. **备份策略**: 重要数据源需要制定备份和恢复策略

---

## 更新日志

### v1.0.0 (2025-08-14)
- ✅ 完成基础CRUD功能
- ✅ 实现JWT认证
- ✅ 支持多种数据库类型
- ✅ 添加连接测试功能
- ✅ 实现状态管理
- ✅ 修复所有已知问题

---

*最后更新: 2025-08-14*
