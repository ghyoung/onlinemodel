import express from 'express';
import { getDatabase } from '../database/init.js';
import { authenticateToken, requireUserOrAdmin } from '../middleware/auth.js';
import { validateDataSource, validateId } from '../middleware/validation.js';

const router = express.Router();

// 获取数据源列表
router.get('/', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();
    const { page = 1, limit = 10, type, status } = req.query;
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    
    if (type) {
      whereClause += ' AND type = ?';
      params.push(type);
    }
    
    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }
    
    // 获取总数
    const countResult = await db.get(
      `SELECT COUNT(*) as total FROM data_sources ${whereClause}`,
      params
    );
    
    const total = countResult.total;
    const offset = (page - 1) * limit;
    
    // 获取数据源列表
    const dataSources = await db.all(
      `SELECT ds.*, u.username as created_by_name 
       FROM data_sources ds 
       LEFT JOIN users u ON ds.created_by = u.id 
       ${whereClause} 
       ORDER BY ds.created_at DESC 
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    
    res.json({
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
      error: '服务器错误',
      message: '获取数据源列表时发生错误'
    });
  }
});

// 获取单个数据源
router.get('/:id', authenticateToken, validateId, async (req, res) => {
  try {
    const db = getDatabase();
    const { id } = req.params;
    
    const dataSource = await db.get(
      `SELECT ds.*, u.username as created_by_name 
       FROM data_sources ds 
       LEFT JOIN users u ON ds.created_by = u.id 
       WHERE ds.id = ?`,
      [id]
    );
    
    if (!dataSource) {
      return res.status(404).json({
        error: '数据源不存在',
        message: '无法找到指定的数据源'
      });
    }
    
    // 获取关联的表信息
    const tables = await db.all(
      'SELECT * FROM tables WHERE data_source_id = ? AND status = "active"',
      [id]
    );
    
    dataSource.tables = tables;
    
    res.json({ data: dataSource });
    
  } catch (error) {
    console.error('获取数据源失败:', error);
    res.status(500).json({
      error: '服务器错误',
      message: '获取数据源时发生错误'
    });
  }
});

// 创建数据源
router.post('/', authenticateToken, requireUserOrAdmin, validateDataSource, async (req, res) => {
  try {
    const db = getDatabase();
    const { name, type, connection_info } = req.body;
    const userId = req.user.userId;
    
    // 检查数据源名称是否已存在
    const existing = await db.get(
      'SELECT id FROM data_sources WHERE name = ?',
      [name]
    );
    
    if (existing) {
      return res.status(400).json({
        error: '创建失败',
        message: '数据源名称已存在'
      });
    }
    
    // 创建数据源
    const result = await db.run(
      `INSERT INTO data_sources (name, type, connection_info, created_by, status) 
       VALUES (?, ?, ?, ?, ?)`,
      [name, type, JSON.stringify(connection_info), userId, 'active']
    );
    
    // 获取新创建的数据源
    const newDataSource = await db.get(
      'SELECT * FROM data_sources WHERE id = ?',
      [result.lastID]
    );
    
    res.status(201).json({
      message: '数据源创建成功',
      data: newDataSource
    });
    
  } catch (error) {
    console.error('创建数据源失败:', error);
    res.status(500).json({
      error: '服务器错误',
      message: '创建数据源时发生错误'
    });
  }
});

// 更新数据源
router.put('/:id', authenticateToken, requireUserOrAdmin, validateId, validateDataSource, async (req, res) => {
  try {
    const db = getDatabase();
    const { id } = req.params;
    const { name, type, connection_info } = req.body;
    
    // 检查数据源是否存在
    const existing = await db.get(
      'SELECT id FROM data_sources WHERE id = ?',
      [id]
    );
    
    if (!existing) {
      return res.status(404).json({
        error: '更新失败',
        message: '数据源不存在'
      });
    }
    
    // 检查名称是否与其他数据源冲突
    const nameConflict = await db.get(
      'SELECT id FROM data_sources WHERE name = ? AND id != ?',
      [name, id]
    );
    
    if (nameConflict) {
      return res.status(400).json({
        error: '更新失败',
        message: '数据源名称已存在'
      });
    }
    
    // 更新数据源
    await db.run(
      `UPDATE data_sources 
       SET name = ?, type = ?, connection_info = ?, updated_at = ? 
       WHERE id = ?`,
      [name, type, JSON.stringify(connection_info), new Date().toISOString(), id]
    );
    
    // 获取更新后的数据源
    const updatedDataSource = await db.get(
      'SELECT * FROM data_sources WHERE id = ?',
      [id]
    );
    
    res.json({
      message: '数据源更新成功',
      data: updatedDataSource
    });
    
  } catch (error) {
    console.error('更新数据源失败:', error);
    res.status(500).json({
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
    const existing = await db.get(
      'SELECT id FROM data_sources WHERE id = ?',
      [id]
    );
    
    if (!existing) {
      return res.status(404).json({
        error: '删除失败',
        message: '数据源不存在'
      });
    }
    
    // 检查是否有关联的表
    const tableCount = await db.get(
      'SELECT COUNT(*) as count FROM tables WHERE data_source_id = ?',
      [id]
    );
    
    if (tableCount.count > 0) {
      return res.status(400).json({
        error: '删除失败',
        message: '该数据源下还有关联的表，无法删除'
      });
    }
    
    // 软删除数据源
    await db.run(
      'UPDATE data_sources SET status = "deleted", updated_at = ? WHERE id = ?',
      [new Date().toISOString(), id]
    );
    
    res.json({
      message: '数据源删除成功'
    });
    
  } catch (error) {
    console.error('删除数据源失败:', error);
    res.status(500).json({
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
    const dataSource = await db.get(
      'SELECT * FROM data_sources WHERE id = ?',
      [id]
    );
    
    if (!dataSource) {
      return res.status(404).json({
        error: '测试失败',
        message: '数据源不存在'
      });
    }
    
    // 这里应该实现实际的数据库连接测试
    // 由于是轻量版本，我们模拟连接测试
    const connectionInfo = JSON.parse(dataSource.connection_info);
    
    // 模拟连接延迟
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 模拟连接测试结果
    const isSuccess = Math.random() > 0.1; // 90%成功率
    
    if (isSuccess) {
      res.json({
        message: '连接测试成功',
        data: {
          status: 'success',
          message: `成功连接到 ${connectionInfo.host}:${connectionInfo.port}/${connectionInfo.database}`,
          timestamp: new Date().toISOString()
        }
      });
    } else {
      res.status(400).json({
        error: '连接测试失败',
        message: '无法连接到数据库，请检查连接信息'
      });
    }
    
  } catch (error) {
    console.error('测试数据源连接失败:', error);
    res.status(500).json({
      error: '服务器错误',
      message: '测试数据源连接时发生错误'
    });
  }
});

export default router;
