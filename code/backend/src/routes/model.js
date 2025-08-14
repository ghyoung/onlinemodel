import express from 'express';
import { getDatabase } from '../database/init.js';
import { authenticateToken, requireUserOrAdmin } from '../middleware/auth.js';
import { validateModel, validateField, validateId } from '../middleware/validation.js';

const router = express.Router();

// 获取模型列表
router.get('/', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();
    const { page = 1, limit = 10, type, status } = req.query;
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    
    if (type) {
      whereClause += ' AND model_type = $' + (params.length + 1);
      params.push(type);
    }
    
    if (status) {
      whereClause += ' AND status = $' + (params.length + 1);
      params.push(status);
    }
    
    // 获取总数
    const countResult = await db.query(
      `SELECT COUNT(*) as total FROM models ${whereClause}`,
      params
    );
    
    const total = parseInt(countResult.rows[0].total);
    const offset = (page - 1) * limit;
    
    // 获取模型列表
    const modelsResult = await db.query(
      `SELECT m.*, u.username as created_by_name 
       FROM models m 
       LEFT JOIN users u ON m.created_by = u.id 
       ${whereClause} 
       ORDER BY m.created_at DESC 
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );
    
    const models = modelsResult.rows;
    
    res.json({
      data: models,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('获取模型列表失败:', error);
    res.status(500).json({
      error: '服务器错误',
      message: '获取模型列表时发生错误'
    });
  }
});

// 创建模型
router.post('/', authenticateToken, requireUserOrAdmin, validateModel, async (req, res) => {
  try {
    const db = getDatabase();
    const { name, description, model_type } = req.body;
    const userId = req.user.userId;
    
    // 检查模型名称是否已存在
    const existingResult = await db.query('SELECT id FROM models WHERE name = $1', [name]);
    const existing = existingResult.rows[0];
    
    if (existing) {
      return res.status(400).json({
        error: '创建失败',
        message: '模型名称已存在'
      });
    }
    
    // 创建模型
    const result = await db.query(
      'INSERT INTO models (name, description, model_type, created_by, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, description, model_type, userId, 'draft']
    );
    
    const newModel = result.rows[0];
    
    res.status(201).json({
      message: '模型创建成功',
      data: newModel
    });
    
  } catch (error) {
    console.error('创建模型失败:', error);
    res.status(500).json({
      error: '服务器错误',
      message: '创建模型时发生错误'
    });
  }
});

export default router;
