import express from 'express';
import { getDatabase } from '../database/init.js';
import { authenticateToken, requireUserOrAdmin } from '../middleware/auth.js';

const router = express.Router();

// 获取DDL导入记录列表
router.get('/', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();
    const { page = 1, limit = 10, status } = req.query;
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    
    if (status) {
      whereClause += ' AND import_status = ?';
      params.push(status);
    }
    
    // 获取总数
    const countResult = await db.get(
      `SELECT COUNT(*) as total FROM ddl_imports ${whereClause}`,
      params
    );
    
    const total = countResult.total;
    const offset = (page - 1) * limit;
    
    // 获取DDL导入记录列表
    const imports = await db.all(
      `SELECT di.*, u.username as created_by_name 
       FROM ddl_imports di 
       LEFT JOIN users u ON di.created_by = u.id 
       ${whereClause} 
       ORDER BY di.created_at DESC 
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    
    res.json({
      data: imports,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('获取DDL导入记录列表失败:', error);
    res.status(500).json({
      error: '服务器错误',
      message: '获取DDL导入记录列表时发生错误'
    });
  }
});

// 模拟DDL导入（简化版本）
router.post('/import', authenticateToken, requireUserOrAdmin, async (req, res) => {
  try {
    const { file_name, file_size, ddl_content } = req.body;
    const userId = req.user.userId;
    
    if (!ddl_content) {
      return res.status(400).json({
        error: '导入失败',
        message: 'DDL内容不能为空'
      });
    }
    
    const db = getDatabase();
    
    // 创建导入记录
    const result = await db.run(
      `INSERT INTO ddl_imports (file_name, file_size, import_status, created_by) 
       VALUES (?, ?, ?, ?)`,
      [file_name || 'manual_input.sql', file_size || ddl_content.length, 'processing', userId]
    );
    
    // 模拟解析过程
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 更新导入状态
    await db.run(
      `UPDATE ddl_imports 
       SET import_status = ?, parsed_tables = ?, parsed_columns = ?, updated_at = ? 
       WHERE id = ?`,
      ['completed', Math.floor(Math.random() * 10) + 1, Math.floor(Math.random() * 50) + 5, new Date().toISOString(), result.lastID]
    );
    
    // 获取更新后的记录
    const importRecord = await db.get(
      'SELECT * FROM ddl_imports WHERE id = ?',
      [result.lastID]
    );
    
    res.json({
      message: 'DDL导入成功',
      data: importRecord
    });
    
  } catch (error) {
    console.error('DDL导入失败:', error);
    res.status(500).json({
      error: '服务器错误',
      message: 'DDL导入时发生错误'
    });
  }
});

export default router;
