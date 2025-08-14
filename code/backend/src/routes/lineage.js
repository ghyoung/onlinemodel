import express from 'express';
import { getDatabase } from '../database/init.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// 获取血缘关系列表
router.get('/', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();
    const { page = 1, limit = 10 } = req.query;
    
    // 获取总数
    const countResult = await db.query('SELECT COUNT(*) as total FROM lineage');
    const total = parseInt(countResult.rows[0].total);
    const offset = (page - 1) * limit;
    
    // 获取血缘关系列表
    const lineagesResult = await db.query(
      `SELECT l.*, 
              st.table_name as source_table_name,
              sc.column_name as source_column_name,
              tt.table_name as target_table_name,
              tc.column_name as target_column_name
       FROM lineage l
       LEFT JOIN tables st ON l.source_table_id = st.id
       LEFT JOIN columns sc ON l.source_column_id = sc.id
       LEFT JOIN tables tt ON l.target_table_id = tt.id
       LEFT JOIN columns tc ON l.target_column_id = tc.id
       ORDER BY l.created_at DESC 
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    const lineages = lineagesResult.rows;
    
    res.json({
      data: lineages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('获取血缘关系列表失败:', error);
    res.status(500).json({
      error: '服务器错误',
      message: '获取血缘关系列表时发生错误'
    });
  }
});

export default router;
