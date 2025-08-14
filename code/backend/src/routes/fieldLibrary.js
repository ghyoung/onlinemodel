import express from 'express';
import { getDatabase } from '../database/init.js';
import { authenticateToken, requireUserOrAdmin } from '../middleware/auth.js';
import { validateField, validateId } from '../middleware/validation.js';

const router = express.Router();

// 获取标准字段列表
router.get('/', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();
    const { page = 1, limit = 10, field_type, status } = req.query;
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    
    if (field_type) {
      whereClause += ' AND field_type = ?';
      params.push(field_type);
    }
    
    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }
    
    // 获取总数
    const countResult = await db.query(
      `SELECT COUNT(*) as total FROM standard_fields ${whereClause}`,
      params
    );
    
    const total = parseInt(countResult.rows[0].total);
    const offset = (page - 1) * limit;
    
    // 获取字段列表
    const fieldsResult = await db.query(
      `SELECT sf.*, u.username as created_by_name 
       FROM standard_fields sf 
       LEFT JOIN users u ON sf.created_by = u.id 
       ${whereClause} 
       ORDER BY sf.field_name ASC 
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );
    const fields = fieldsResult.rows;
    
    res.json({
      data: fields,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('获取标准字段列表失败:', error);
    res.status(500).json({
      error: '服务器错误',
      message: '获取标准字段列表时发生错误'
    });
  }
});

// 创建标准字段
router.post('/', authenticateToken, requireUserOrAdmin, validateField, async (req, res) => {
  try {
    const db = getDatabase();
    const { field_name, field_type, business_meaning, data_standard, data_quality_rule, examples } = req.body;
    const userId = req.user.userId;
    
    // 检查字段名称是否已存在
    const existingResult = await db.query(
      'SELECT id FROM standard_fields WHERE field_name = $1',
      [field_name]
    );
    const existing = existingResult.rows[0];
    
    if (existing) {
      return res.status(400).json({
        error: '创建失败',
        message: '字段名称已存在'
      });
    }
    
    // 创建标准字段
    const result = await db.query(
      `INSERT INTO standard_fields (field_name, field_type, business_meaning, data_standard, data_quality_rule, examples, created_by) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [field_name, field_type, business_meaning, data_standard, data_quality_rule, examples, userId]
    );
    const newField = result.rows[0];
    
    res.status(201).json({
      message: '标准字段创建成功',
      data: newField
    });
    
  } catch (error) {
    console.error('创建标准字段失败:', error);
    res.status(500).json({
      error: '服务器错误',
      message: '创建标准字段时发生错误'
    });
  }
});

export default router;
