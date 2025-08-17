import express from 'express';
import { getDatabase } from '../database/init.js';
import { authenticateToken, requireUserOrAdmin } from '../middleware/auth.js';
import { validateDataSource, validateId, validateMultipleIds } from '../middleware/validation.js';
import DatabaseConnector from '../utils/databaseConnector.js';

const router = express.Router();

// 获取数据源列表
router.get('/', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();
    const { page = 1, limit = 10, type, status } = req.query;
    
    let whereClause = 'WHERE ds.status != \'deleted\'';
    const params = [];
    
    if (type) {
      whereClause += ' AND ds.type = $' + (params.length + 1);
      params.push(type);
    }
    
    if (status) {
      whereClause += ' AND ds.status = $' + (params.length + 1);
      params.push(status);
    }
    
    // 获取总数
    const countResult = await db.query(
      `SELECT COUNT(*) as total FROM data_sources ds ${whereClause}`,
      params
    );
    
    const total = parseInt(countResult.rows[0].total);
    const offset = (page - 1) * limit;
    
    // 获取数据源列表
    const dataSourcesResult = await db.query(
      `SELECT ds.*, u.username as created_by_name 
       FROM data_sources ds 
       LEFT JOIN users u ON ds.created_by = u.id 
       ${whereClause} 
       ORDER BY ds.created_at DESC 
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );
    
    const dataSources = dataSourcesResult.rows.map(row => {
      // 安全地解析connection_info，处理可能已经是对象的情况
      let connectionInfo = {};
      try {
        if (typeof row.connection_info === 'string') {
          connectionInfo = JSON.parse(row.connection_info || '{}');
        } else if (row.connection_info && typeof row.connection_info === 'object') {
          connectionInfo = row.connection_info;
        }
      } catch (parseError) {
        console.warn('解析connection_info失败:', parseError.message);
        connectionInfo = {};
      }
      
      return {
        id: row.id,
        name: row.name,
        description: row.description || '',
        type: row.type,
        host: connectionInfo.host || '',
        port: connectionInfo.port || 0,
        database: connectionInfo.database || '',
        username: connectionInfo.username || '',
        status: row.status,
        isEnabled: row.status === 'active',
        lastTestAt: row.last_test_at || row.created_at,
        lastSyncAt: row.last_sync_at || row.created_at,
        createdAt: row.created_at,
        createdBy: {
          username: row.created_by_name
        }
      };
    });
    
    res.json({
      success: true,
      data: dataSources,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('获取数据源列表失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器错误',
      message: '获取数据源列表时发生错误'
    });
  }
});

// 获取数据源统计信息 - 必须在 /:id 路由之前定义
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();
    
    console.log('📊 开始获取数据源统计信息，用户ID:', req.user?.userId || req.user?.id || '未知');
    
    // 获取各种统计数据
    const totalResult = await db.query(
      'SELECT COUNT(*) as count FROM data_sources WHERE status != $1',
      ['deleted']
    );
    
    const connectedResult = await db.query(
      'SELECT COUNT(*) as count FROM data_sources WHERE status = $1',
      ['active']
    );
    
    const errorResult = await db.query(
      'SELECT COUNT(*) as count FROM data_sources WHERE status = $1',
      ['error']
    );
    
    const enabledResult = await db.query(
      'SELECT COUNT(*) as count FROM data_sources WHERE status = $1',
      ['active']
    );
    
    const stats = {
      total: parseInt(totalResult.rows[0].count),
      connected: parseInt(connectedResult.rows[0].count),
      error: parseInt(errorResult.rows[0].count),
      enabled: parseInt(enabledResult.rows[0].count)
    };
    
    console.log('✅ 统计信息获取成功:', stats);
    
    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('❌ 获取统计信息失败:', {
      error: error.message,
      stack: error.stack,
      user: req.user?.id,
      timestamp: new Date().toISOString()
    });
    
    // 根据错误类型返回不同的状态码
    if (error.message.includes('数据库未初始化')) {
      return res.status(503).json({
        success: false,
        error: '服务不可用',
        message: '数据库服务暂时不可用，请稍后重试'
      });
    }
    
    if (error.message.includes('连接')) {
      return res.status(503).json({
        success: false,
        error: '数据库连接失败',
        message: '无法连接到数据库，请检查数据库服务状态'
      });
    }
    
    res.status(500).json({
      success: false,
      error: '服务器错误',
      message: '获取统计信息时发生错误: ' + error.message
    });
  }
});

// 获取单个数据源
router.get('/:id', authenticateToken, validateId, async (req, res) => {
  try {
    const db = getDatabase();
    const { id } = req.params;
    
    const dataSourceResult = await db.query(
      `SELECT ds.*, u.username as created_by_name 
       FROM data_sources ds 
       LEFT JOIN users u ON ds.created_by = u.id 
       WHERE ds.id = $1 AND ds.status != 'deleted'`,
      [id]
    );
    
    if (dataSourceResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '数据源不存在',
        message: '无法找到指定的数据源'
      });
    }
    
    const dataSource = dataSourceResult.rows[0];
    
         // 获取关联的表信息
     const tablesResult = await db.query(
       'SELECT * FROM tables WHERE data_source_id = $1 AND status != \'deleted\'',
       [id]
     );
    
    // 安全地解析connection_info
    let connectionInfo = {};
    try {
      if (typeof dataSource.connection_info === 'string') {
        connectionInfo = JSON.parse(dataSource.connection_info || '{}');
      } else if (dataSource.connection_info && typeof dataSource.connection_info === 'object') {
        connectionInfo = dataSource.connection_info;
      }
    } catch (parseError) {
      console.warn('解析connection_info失败:', parseError.message);
      connectionInfo = {};
    }
    
    const formattedDataSource = {
      id: dataSource.id,
      name: dataSource.name,
      description: dataSource.description,
      type: dataSource.type,
      host: connectionInfo.host || '',
      port: connectionInfo.port || 0,
      database: connectionInfo.database || '',
      username: connectionInfo.username || '',
      status: dataSource.status,
      isEnabled: dataSource.status === 'active',
      lastTestAt: dataSource.last_test_at || dataSource.created_at,
      lastSyncAt: dataSource.last_sync_at || dataSource.created_at,
      createdAt: dataSource.created_at,
      createdBy: {
        username: dataSource.created_by_name
      },
      tables: tablesResult.rows
    };
    
    res.json({ 
      success: true,
      data: formattedDataSource 
    });
    
  } catch (error) {
    console.error('获取数据源失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器错误',
      message: '获取数据源时发生错误'
    });
  }
});

// 创建数据源
router.post('/', authenticateToken, requireUserOrAdmin, validateDataSource, async (req, res) => {
  try {
    const db = getDatabase();
    const { name, description, type, host, port, database, username, password, connectionParams } = req.body;
    const userId = req.user.userId;
    
    // 检查数据源名称是否已存在
    const existingResult = await db.query(
      'SELECT id FROM data_sources WHERE name = $1 AND status != $2',
      [name, 'deleted']
    );
    
    if (existingResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: '创建失败',
        message: '数据源名称已存在'
      });
    }
    
    // 构建连接信息
    const connectionInfo = {
      host,
      port,
      database,
      username,
      password,
      connectionParams: connectionParams || ''
    };
    
    // 创建数据源
    const result = await db.query(
      `INSERT INTO data_sources (name, description, type, connection_info, created_by, status) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, description || '', type, JSON.stringify(connectionInfo), userId, 'active']
    );
    
    const newDataSource = result.rows[0];
    
    // 格式化返回数据
    const formattedDataSource = {
      id: newDataSource.id,
      name: newDataSource.name,
      description: newDataSource.description,
      type: newDataSource.type,
      host,
      port,
      database,
      username,
      status: newDataSource.status,
      isEnabled: true,
      lastTestAt: newDataSource.created_at,
      lastSyncAt: newDataSource.created_at,
      createdAt: newDataSource.created_at,
      createdBy: {
        username: req.user.username
      }
    };
    
    res.status(201).json({
      success: true,
      message: '数据源创建成功',
      data: formattedDataSource
    });
    
  } catch (error) {
    console.error('❌ 创建数据源失败:', {
      error: error.message,
      stack: error.stack,
      user: req.user,
      body: req.body,
      timestamp: new Date().toISOString()
    });
    
    // 根据错误类型返回不同的状态码
    if (error.message.includes('数据库未初始化')) {
      return res.status(503).json({
        success: false,
        error: '服务不可用',
        message: '数据库服务暂时不可用，请稍后重试'
      });
    }
    
    if (error.message.includes('连接')) {
      return res.status(503).json({
        success: false,
        error: '数据库连接失败',
        message: '无法连接到数据库，请检查数据库服务状态'
      });
    }
    
    if (error.message.includes('外键约束')) {
      return res.status(400).json({
        success: false,
        error: '数据验证失败',
        message: '用户信息无效，请重新登录'
      });
    }
    
    res.status(500).json({
      success: false,
      error: '服务器错误',
      message: '创建数据源时发生错误: ' + error.message
    });
  }
});

// 更新数据源
router.put('/:id', authenticateToken, requireUserOrAdmin, validateId, (req, res, next) => {
  // 传递编辑状态给验证中间件
  req.$isEdit = true;
  validateDataSource(req, res, next);
}, async (req, res) => {
  try {
    const db = getDatabase();
    const { id } = req.params;
    const { name, description, type, host, port, database, username, password, connectionParams } = req.body;
    
    // 检查数据源是否存在
    const existingResult = await db.query(
      'SELECT * FROM data_sources WHERE id = $1 AND status != $2',
      [id, 'deleted']
    );
    
    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '更新失败',
        message: '数据源不存在'
      });
    }
    
    const existing = existingResult.rows[0];
    
    // 检查名称是否与其他数据源冲突
    const nameConflictResult = await db.query(
      'SELECT id FROM data_sources WHERE name = $1 AND id != $2 AND status != $3',
      [name, id, 'deleted']
    );
    
    if (nameConflictResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: '更新失败',
        message: '数据源名称已存在'
      });
    }
    
         // 构建连接信息，如果密码为空则保留原密码
     let connectionInfo = {};
     try {
       if (typeof existing.connection_info === 'string') {
         connectionInfo = JSON.parse(existing.connection_info || '{}');
       } else if (existing.connection_info && typeof existing.connection_info === 'object') {
         connectionInfo = existing.connection_info;
       }
     } catch (parseError) {
       console.warn('解析connection_info失败:', parseError.message);
       connectionInfo = {};
     }
     
     // 只有当密码不为空时才更新密码
     if (password && password.trim() !== '') {
       connectionInfo.password = password;
     }
     
     connectionInfo = {
       ...connectionInfo,
       host,
       port,
       database,
       username,
       connectionParams: connectionParams || ''
     };
    
    // 更新数据源
    await db.query(
      `UPDATE data_sources 
       SET name = $1, description = $2, type = $3, connection_info = $4, updated_at = $5 
       WHERE id = $6`,
      [name, description || '', type, JSON.stringify(connectionInfo), new Date().toISOString(), id]
    );
    
    // 获取更新后的数据源
    const updatedResult = await db.query(
      'SELECT * FROM data_sources WHERE id = $1',
      [id]
    );
    
    const updatedDataSource = updatedResult.rows[0];
    
    // 格式化返回数据
    const formattedDataSource = {
      id: updatedDataSource.id,
      name: updatedDataSource.name,
      description: updatedDataSource.description,
      type: updatedDataSource.type,
      host,
      port,
      database,
      username,
      status: updatedDataSource.status,
      isEnabled: updatedDataSource.status === 'active',
      lastTestAt: updatedDataSource.last_test_at || updatedDataSource.created_at,
      lastSyncAt: updatedDataSource.last_sync_at || updatedDataSource.created_at,
      createdAt: updatedDataSource.created_at,
      createdBy: {
        username: req.user.username
      }
    };
    
    res.json({
      success: true,
      message: '数据源更新成功',
      data: formattedDataSource
    });
    
  } catch (error) {
    console.error('更新数据源失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器错误',
      message: '更新数据源时发生错误'
    });
  }
});

// 删除数据源
router.delete('/:id', authenticateToken, requireUserOrAdmin, validateId, async (req, res) => {
  try {
    const db = getDatabase();
    const { id } = req.params;
    
    // 检查数据源是否存在
    const existingResult = await db.query(
      'SELECT id FROM data_sources WHERE id = $1 AND status != $2',
      [id, 'deleted']
    );
    
    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '删除失败',
        message: '数据源不存在'
      });
    }
    
         // 检查是否有关联的表
     const tableCountResult = await db.query(
       'SELECT COUNT(*) as count FROM tables WHERE data_source_id = $1 AND status != \'deleted\'',
       [id]
     );
     
     const tableCount = parseInt(tableCountResult.rows[0].count);
     
     if (tableCount > 0) {
       console.log(`📊 数据源下还有 ${tableCount} 个表，将同时软删除这些表...`);
       
       // 软删除所有关联的表
       await db.query(
         'UPDATE tables SET status = $1, updated_at = $2 WHERE data_source_id = $3',
         ['deleted', new Date().toISOString(), id]
       );
       
       // 软删除所有关联的字段
       await db.query(
         `UPDATE columns SET status = $1, updated_at = $2 
          FROM tables t 
          WHERE t.data_source_id = $3 AND t.id = columns.table_id`,
         ['deleted', new Date().toISOString(), id]
       );
       
       console.log(`✅ 已软删除 ${tableCount} 个表及其字段`);
     }
     
     // 软删除数据源
     await db.query(
       'UPDATE data_sources SET status = $1, updated_at = $2 WHERE id = $3',
       ['deleted', new Date().toISOString(), id]
     );
    
         const message = tableCount > 0 
       ? `数据源删除成功，同时删除了 ${tableCount} 个关联表`
       : '数据源删除成功';
     
     res.json({
       success: true,
       message
     });
    
  } catch (error) {
    console.error('删除数据源失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器错误',
      message: '删除数据源时发生错误'
    });
  }
});

// 测试数据源连接
router.post('/:id/test', authenticateToken, requireUserOrAdmin, validateId, async (req, res) => {
  try {
    const db = getDatabase();
    const { id } = req.params;
    
    // 获取数据源信息
    const dataSourceResult = await db.query(
      'SELECT * FROM data_sources WHERE id = $1 AND status != $2',
      [id, 'deleted']
    );
    
    if (dataSourceResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '测试失败',
        message: '数据源不存在'
      });
    }
    
    const dataSource = dataSourceResult.rows[0];
    
    // 实现真实的数据库连接测试
    let connectionInfo = {};
    try {
      if (typeof dataSource.connection_info === 'string') {
        connectionInfo = JSON.parse(dataSource.connection_info || '{}');
      } else if (dataSource.connection_info && typeof dataSource.connection_info === 'object') {
        connectionInfo = dataSource.connection_info;
      }
    } catch (parseError) {
      console.warn('解析connection_info失败:', parseError.message);
      connectionInfo = {};
    }
    
    // 验证连接参数
    if (!connectionInfo.host || !connectionInfo.username || !connectionInfo.database) {
      return res.status(400).json({
        success: false,
        error: '连接参数不完整',
        message: '主机地址、用户名和数据库名不能为空'
      });
    }
    
    try {
      // 使用真实的数据库连接器进行测试
      const testResult = await DatabaseConnector.testDatabaseConnection(
        connectionInfo, 
        dataSource.type
      );
      
      if (testResult.success) {
        // 更新最后测试时间
        await db.query(
          'UPDATE data_sources SET last_test_at = $1 WHERE id = $2',
          [new Date().toISOString(), id]
        );
        
        res.json({
          success: true,
          message: testResult.message,
          data: {
            status: 'success',
            ...testResult.data
          }
        });
      } else {
        res.status(400).json({
          success: false,
          error: '连接测试失败',
          message: testResult.message,
          details: testResult.error
        });
      }
      
    } catch (error) {
      console.error('数据库连接测试异常:', error);
      res.status(500).json({
        success: false,
        error: '连接测试异常',
        message: '连接测试过程中发生错误: ' + error.message
      });
    }
    
  } catch (error) {
    console.error('测试数据源连接失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器错误',
      message: '测试数据源连接时发生错误'
    });
  }
});

// 切换数据源状态
router.put('/:id/toggle', authenticateToken, requireUserOrAdmin, validateId, async (req, res) => {
  try {
    const db = getDatabase();
    const { id } = req.params;
    const { enabled } = req.query;
    
    // 检查数据源是否存在
    const existingResult = await db.query(
      'SELECT * FROM data_sources WHERE id = $1 AND status != $2',
      [id, 'deleted']
    );
    
    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '操作失败',
        message: '数据源不存在'
      });
    }
    
    const newStatus = enabled === 'true' ? 'active' : 'inactive';
    
    // 更新状态
    await db.query(
      'UPDATE data_sources SET status = $1, updated_at = $2 WHERE id = $3',
      [newStatus, new Date().toISOString(), id]
    );
    
    res.json({
      success: true,
      message: `数据源已${enabled === 'true' ? '启用' : '禁用'}`,
      data: { status: newStatus }
    });
    
  } catch (error) {
    console.error('切换数据源状态失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器错误',
      message: '切换数据源状态时发生错误'
    });
  }
});

// 获取数据源下的数据表列表
router.get('/:id/tables', authenticateToken, validateId, async (req, res) => {
  try {
    const db = getDatabase();
    const { id } = req.params;
    const { page = 1, limit = 10, search, status } = req.query;
    
    // 检查数据源是否存在
    const dataSourceResult = await db.query(
      'SELECT id, name FROM data_sources WHERE id = $1 AND status != $2',
      [id, 'deleted']
    );
    
    if (dataSourceResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '数据源不存在',
        message: '无法找到指定的数据源'
      });
    }
    
    const dataSource = dataSourceResult.rows[0];
    
         // 构建查询条件
     let whereClause = 'WHERE t.data_source_id = $1 AND t.status != \'deleted\'';
     const params = [id];
     let paramIndex = 1;
    
    if (status) {
      paramIndex++;
      whereClause += ` AND t.status = $${paramIndex}`;
      params.push(status);
    }
    
    if (search) {
      paramIndex++;
      whereClause += ` AND (t.table_name ILIKE $${paramIndex} OR t.schema_name ILIKE $${paramIndex} OR t.description ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
    }
    
    // 获取总数
    const countResult = await db.query(
      `SELECT COUNT(*) as total FROM tables t ${whereClause}`,
      params
    );
    
    const total = parseInt(countResult.rows[0].total);
    const offset = (page - 1) * limit;
    
         // 获取数据表列表
     const tablesResult = await db.query(
       `SELECT t.*, 
               COALESCE((SELECT COUNT(*) FROM columns c WHERE c.table_id = t.id AND c.status = 'active'), 0) as column_count,
               COALESCE((SELECT COUNT(*) FROM columns c WHERE c.table_id = t.id AND c.status = 'active' AND c.is_primary_key = true), 0) as primary_key_count
        FROM tables t 
        ${whereClause} 
        ORDER BY t.schema_name NULLS LAST, t.table_name 
        LIMIT $${paramIndex + 1} OFFSET $${paramIndex + 2}`,
       [...params, limit, offset]
     );
    
    const tables = tablesResult.rows.map(row => ({
      id: row.id,
      tableName: row.table_name,
      schemaName: row.schema_name || '',
      description: row.description || '',
      status: row.status,
      columnCount: parseInt(row.column_count),
      primaryKeyCount: parseInt(row.primary_key_count),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
    
    res.json({
      success: true,
      data: {
        dataSource: {
          id: dataSource.id,
          name: dataSource.name
        },
        tables,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
    
  } catch (error) {
    console.error('获取数据表列表失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器错误',
      message: '获取数据表列表时发生错误'
    });
  }
});

// 获取数据表的字段信息
router.get('/:dataSourceId/tables/:tableId/columns', authenticateToken, validateMultipleIds(['dataSourceId', 'tableId']), async (req, res) => {
  try {
    const db = getDatabase();
    const { dataSourceId, tableId } = req.params;
    
    // 检查数据源和表是否存在
    const tableResult = await db.query(
      `SELECT t.* FROM tables t 
       JOIN data_sources ds ON t.data_source_id = ds.id 
       WHERE t.id = $1 AND ds.id = $2 AND t.status != 'deleted' AND ds.status != 'deleted'`,
      [tableId, dataSourceId]
    );
    
    if (tableResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '表不存在',
        message: '无法找到指定的表'
      });
    }
    
         // 获取字段信息
     const columnsResult = await db.query(
       `SELECT * FROM columns 
        WHERE table_id = $1 AND status = 'active' 
        ORDER BY ordinal_position, column_name`,
       [tableId]
     );
    
    const columns = columnsResult.rows.map(row => ({
      id: row.id,
      columnName: row.column_name,
      dataType: row.data_type,
      isNullable: row.is_nullable,
      isPrimaryKey: row.is_primary_key,
      defaultValue: row.default_value || '',
      description: row.description || '',
      status: row.status
    }));
    
    res.json({
      success: true,
      data: {
        table: {
          id: tableResult.rows[0].id,
          tableName: tableResult.rows[0].table_name,
          schemaName: tableResult.rows[0].schema_name,
          description: tableResult.rows[0].description
        },
        columns
      }
    });
    
  } catch (error) {
    console.error('获取表字段信息失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器错误',
      message: '获取表字段信息时发生错误'
    });
  }
});

// 同步数据源的表结构
router.post('/:id/sync-tables', authenticateToken, requireUserOrAdmin, validateId, async (req, res) => {
  try {
    const db = getDatabase();
    const { id } = req.params;
    
    // 检查数据源是否存在
    const dataSourceResult = await db.query(
      'SELECT * FROM data_sources WHERE id = $1 AND status != $2',
      [id, 'deleted']
    );
    
    if (dataSourceResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '同步失败',
        message: '数据源不存在'
      });
    }
    
    const dataSource = dataSourceResult.rows[0];
    
    // 检查是否已有表数据
    const existingTablesResult = await db.query(
      'SELECT COUNT(*) as count FROM tables WHERE data_source_id = $1 AND status != $2',
      [id, 'deleted']
    );
    
    const existingTableCount = parseInt(existingTablesResult.rows[0].count);
    
    let syncResult = {
      totalTables: 0,
      newTables: 0,
      updatedTables: 0,
      errors: []
    };
    
         // 尝试获取真实的数据库表结构
     let connectionInfo = {};
     try {
       if (typeof dataSource.connection_info === 'string') {
         connectionInfo = JSON.parse(dataSource.connection_info || '{}');
       } else if (dataSource.connection_info && typeof dataSource.connection_info === 'object') {
         connectionInfo = dataSource.connection_info;
       }
     } catch (parseError) {
       console.warn('解析connection_info失败:', parseError.message);
       connectionInfo = {};
     }
     
     // 验证连接参数完整性
     if (!connectionInfo.host || !connectionInfo.username || !connectionInfo.database) {
       return res.status(400).json({
         success: false,
         error: '连接参数不完整',
         message: '主机地址、用户名和数据库名不能为空，请先完善数据源连接信息'
       });
     }
    
         // 无论是否有旧数据，都先清空旧数据，然后重新同步
     if (existingTableCount > 0) {
       console.log(`📊 数据源 ${dataSource.name} 下已有 ${existingTableCount} 个表，先清空旧数据...`);
       
       // 软删除旧的表数据
       await db.query(
         'UPDATE tables SET status = $1, updated_at = $2 WHERE data_source_id = $3',
         ['deleted', new Date().toISOString(), id]
       );
       
       // 软删除旧的字段数据
       await db.query(
         `UPDATE columns SET status = $1, updated_at = $2 
          FROM tables t 
          WHERE t.data_source_id = $3 AND t.id = columns.table_id`,
         ['deleted', new Date().toISOString(), id]
       );
       
       console.log(`✅ 旧数据清理完成`);
     }
     
     console.log(`📊 开始从真实数据库获取表结构...`);
      
      try {
        // 先测试连接
        const connectionTest = await DatabaseConnector.testDatabaseConnection(
          connectionInfo, 
          dataSource.type
        );
        
                 if (connectionTest.success) {
           console.log(`✅ 数据库连接成功，开始获取真实表结构...`);
           
           // 从真实数据库获取表结构
           const schemaResult = await DatabaseConnector.getDatabaseSchema(
             connectionInfo, 
             dataSource.type
           );
           
           if (schemaResult.success) {
             console.log(`✅ 成功获取 ${schemaResult.data.totalTables} 个表的真实结构`);
             
             // 将真实表结构保存到本地数据库
             for (const tableInfo of schemaResult.data.tables) {
               try {
                 // 插入表信息
                 const tableResult = await db.query(
                   'INSERT INTO tables (data_source_id, table_name, schema_name, description, status) VALUES ($1, $2, $3, $4, $5) RETURNING id',
                   [id, tableInfo.tableName, tableInfo.schemaName, tableInfo.description, 'active']
                 );
                 
                 const tableId = tableResult.rows[0].id;
                 
                 // 插入字段信息
                 for (const columnInfo of tableInfo.columns) {
                   await db.query(
                     'INSERT INTO columns (table_id, column_name, data_type, is_nullable, is_primary_key, default_value, description, ordinal_position, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
                     [tableId, columnInfo.columnName, columnInfo.dataType, columnInfo.isNullable, columnInfo.isPrimaryKey, columnInfo.defaultValue, columnInfo.description, columnInfo.ordinalPosition, 'active']
                   );
                 }
                 
                 syncResult.newTables++;
                 console.log(`✅ 同步真实表 ${tableInfo.tableName} 成功，包含 ${tableInfo.columns.length} 个字段`);
               } catch (error) {
                 console.error(`❌ 同步表 ${tableInfo.tableName} 失败:`, error);
                 syncResult.errors.push(`同步表 ${tableInfo.tableName} 失败: ${error.message}`);
               }
             }
             
             syncResult.totalTables = schemaResult.data.totalTables;
             
                                 } else {
           console.log(`❌ 获取真实表结构失败: ${schemaResult.message}`);
           syncResult.errors.push(`获取真实表结构失败: ${schemaResult.message}`);
           
           // 获取失败时，不创建任何表，返回错误
           console.log(`📝 无法获取真实表结构，同步失败`);
           return res.status(400).json({
             success: false,
             error: '同步失败',
             message: `无法获取真实表结构: ${schemaResult.message}`,
             details: syncResult.errors
           });
         }
          
                 } else {
           console.log(`❌ 数据库连接失败，无法获取真实表结构: ${connectionTest.message}`);
           syncResult.errors.push(`数据库连接失败: ${connectionTest.message}`);
           
           // 连接失败时，不创建任何表，返回错误
           console.log(`📝 数据库连接失败，同步失败`);
           return res.status(400).json({
             success: false,
             error: '同步失败',
             message: `数据库连接失败: ${connectionTest.message}`,
             details: syncResult.errors
           });
         }
         
       } catch (error) {
         console.error(`❌ 获取真实表结构失败:`, error);
         syncResult.errors.push(`获取真实表结构失败: ${error.message}`);
       }
    
    // 更新最后同步时间
    await db.query(
      'UPDATE data_sources SET last_sync_at = $1 WHERE id = $2',
      [new Date().toISOString(), id]
    );
    
    console.log(`✅ 数据源 ${dataSource.name} 表结构同步完成:`, syncResult);
    
    res.json({
      success: true,
      message: '表结构同步完成',
      data: syncResult
    });
    
  } catch (error) {
    console.error('同步表结构失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器错误',
      message: '同步表结构时发生错误'
    });
  }
});



export default router;
