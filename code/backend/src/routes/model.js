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
      whereClause += ' AND model_type = ?';
      params.push(type);
    }
    
    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }
    
    // 获取总数
    const countResult = await db.get(
      `SELECT COUNT(*) as total FROM models ${whereClause}`,
      params
    );
    
    const total = countResult.total;
    const offset = (page - 1) * limit;
    
    // 获取模型列表
    const models = await db.all(
      `SELECT m.*, u.username as created_by_name 
       FROM models m 
       LEFT JOIN users u ON m.created_by = u.id 
       ${whereClause} 
       ORDER BY m.created_at DESC 
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    
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
    const existing = await db.get(
      'SELECT id FROM models WHERE name = ?',
      [name]
    );
    
    if (existing) {
      return res.status(400).json({
        error: '创建失败',
        message: '模型名称已存在'
      });
    }
    
    // 创建模型
    const result = await db.run(
      `INSERT INTO models (name, description, model_type, created_by, status) 
       VALUES (?, ?, ?, ?, ?)`,
      [name, description, model_type, userId, 'draft']
    );
    
    // 获取新创建的模型
    const newModel = await db.get(
      'SELECT * FROM models WHERE id = ?',
      [result.lastID]
    );
    
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
