import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDatabase } from '../database/init.js';
import { validateLogin, validateRegister } from '../middleware/validation.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { envConfig } from '../../env.config.js';

const router = express.Router();

// 用户登录
router.post('/login', validateLogin, async (req, res) => {
  try {
    const { username, password } = req.body;
    const db = getDatabase();
    
    // 查找用户
    const result = await db.query(
      'SELECT * FROM users WHERE username = $1 AND status = $2',
      [username, 'active']
    );
    const user = result.rows[0];
    
    if (!user) {
      return res.status(401).json({
        error: '认证失败',
        message: '用户名或密码错误'
      });
    }
    
    // 验证密码
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        error: '认证失败',
        message: '用户名或密码错误'
      });
    }
    
    // 更新最后登录时间（如果字段存在）
    try {
      await db.query(
        'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1',
        [user.id]
      );
    } catch (error) {
      // 如果字段不存在，记录警告但继续执行
      console.warn('⚠️ 无法更新last_login_at字段，可能字段不存在:', error.message);
    }
    
    // 生成JWT令牌
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        role: user.role
      },
      envConfig.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    // 返回用户信息和令牌
    res.json({
      success: true,
      message: '登录成功',
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
        created_at: user.created_at
        // 注意：last_login_at 字段可能不存在，暂时不返回
      },
      token
    });
    
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器错误',
      message: '登录过程中发生错误'
    });
  }
});

// 用户注册
router.post('/register', validateRegister, async (req, res) => {
  try {
    const { username, email, password, role = 'user' } = req.body;
    const db = getDatabase();
    
    // 检查用户名是否已存在
    const existingResult = await db.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );
    const existingUser = existingResult.rows[0];
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: '注册失败',
        message: '用户名或邮箱已存在'
      });
    }
    
    // 加密密码
    const passwordHash = await bcrypt.hash(password, 10);
    
    // 创建用户
    const result = await db.query(
      'INSERT INTO users (username, email, password_hash, role, status) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, email, role, status, created_at',
      [username, email, passwordHash, role, 'active']
    );
    const newUser = result.rows[0];
    
    res.status(201).json({
      success: true,
      message: '注册成功',
      data: newUser
    });
    
  } catch (error) {
    console.error('注册失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器错误',
      message: '注册过程中发生错误'
    });
  }
});

// 获取当前用户信息
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();
    const result = await db.query(
      'SELECT id, username, email, role, status, created_at, updated_at, last_login_at FROM users WHERE id = $1',
      [req.user.userId]
    );
    const user = result.rows[0];
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: '用户不存在',
        message: '无法找到用户信息'
      });
    }
    
    res.json({
      success: true,
      data: user
    });
    
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器错误',
      message: '获取用户信息时发生错误'
    });
  }
});

// 更新用户信息
router.put('/me', authenticateToken, async (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body;
    const db = getDatabase();
    
    // 获取当前用户信息
    const result = await db.query(
      'SELECT * FROM users WHERE id = $1',
      [req.user.userId]
    );
    const user = result.rows[0];
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: '用户不存在',
        message: '无法找到用户信息'
      });
    }
    
    const updates = [];
    const params = [];
    let paramIndex = 1;
    
    // 更新邮箱
    if (email && email !== user.email) {
      // 检查邮箱是否已被其他用户使用
      const existingResult = await db.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email, req.user.userId]
      );
      const existingUser = existingResult.rows[0];
      
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: '更新失败',
          message: '邮箱已被其他用户使用'
        });
      }
      
      updates.push(`email = $${paramIndex}`);
      params.push(email);
      paramIndex++;
    }
    
    // 更新密码
    if (currentPassword && newPassword) {
      // 验证当前密码
      const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isValidPassword) {
        return res.status(400).json({
          success: false,
          error: '更新失败',
          message: '当前密码错误'
        });
      }
      
      // 加密新密码
      const newPasswordHash = await bcrypt.hash(newPassword, 10);
      updates.push(`password_hash = $${paramIndex}`);
      params.push(newPasswordHash);
      paramIndex++;
    }
    
    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: '更新失败',
        message: '没有提供要更新的信息'
      });
    }
    
    // 执行更新
    updates.push(`updated_at = $${paramIndex}`);
    params.push(new Date().toISOString());
    paramIndex++;
    params.push(req.user.userId);
    
    await db.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
      params
    );
    
    // 获取更新后的用户信息
    const updatedResult = await db.query(
      'SELECT id, username, email, role, status, created_at, updated_at, last_login_at FROM users WHERE id = $1',
      [req.user.userId]
    );
    const updatedUser = updatedResult.rows[0];
    
    res.json({
      success: true,
      message: '用户信息更新成功',
      data: updatedUser
    });
    
  } catch (error) {
    console.error('更新用户信息失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器错误',
      message: '更新用户信息时发生错误'
    });
  }
});

// 获取用户列表（仅管理员）
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = getDatabase();
    const { page = 1, limit = 10, role, status, search } = req.query;
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;
    
    if (role) {
      whereClause += ` AND role = $${paramIndex}`;
      params.push(role);
      paramIndex++;
    }
    
    if (status) {
      whereClause += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    if (search) {
      whereClause += ` AND (username ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    // 获取总数
    const countResult = await db.query(
      `SELECT COUNT(*) as total FROM users ${whereClause}`,
      params
    );
    
    const total = parseInt(countResult.rows[0].total);
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // 获取用户列表
    const usersResult = await db.query(
      `SELECT id, username, email, role, status, created_at, updated_at, last_login_at 
       FROM users ${whereClause} 
       ORDER BY created_at DESC 
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, parseInt(limit), offset]
    );
    
    const users = usersResult.rows;
    
    res.json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
    
  } catch (error) {
    console.error('获取用户列表失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器错误',
      message: '获取用户列表时发生错误'
    });
  }
});

// 获取单个用户信息（仅管理员）
router.get('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    
    const result = await db.query(
      'SELECT id, username, email, role, status, created_at, updated_at, last_login_at FROM users WHERE id = $1',
      [id]
    );
    
    const user = result.rows[0];
    if (!user) {
      return res.status(404).json({
        success: false,
        error: '用户不存在',
        message: '无法找到指定用户'
      });
    }
    
    res.json({
      success: true,
      data: user
    });
    
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器错误',
      message: '获取用户信息时发生错误'
    });
  }
});

// 创建用户（仅管理员）
router.post('/users', authenticateToken, requireAdmin, validateRegister, async (req, res) => {
  try {
    const { username, email, password, role = 'user' } = req.body;
    const db = getDatabase();
    
    // 检查用户名是否已存在
    const existingResult = await db.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );
    const existingUser = existingResult.rows[0];
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: '创建失败',
        message: '用户名或邮箱已存在'
      });
    }
    
    // 加密密码
    const passwordHash = await bcrypt.hash(password, 10);
    
    // 创建用户
    const result = await db.query(
      'INSERT INTO users (username, email, password_hash, role, status) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, email, role, status, created_at',
      [username, email, passwordHash, role, 'active']
    );
    const newUser = result.rows[0];
    
    res.status(201).json({
      success: true,
      message: '用户创建成功',
      data: newUser
    });
    
  } catch (error) {
    console.error('创建用户失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器错误',
      message: '创建用户时发生错误'
    });
  }
});

// 更新用户（仅管理员）
router.put('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, role, status, password } = req.body;
    const db = getDatabase();
    
    // 检查用户是否存在
    const existingResult = await db.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    
    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '用户不存在',
        message: '无法找到指定用户'
      });
    }
    
    const updates = [];
    const params = [];
    let paramIndex = 1;
    
    // 更新用户名
    if (username) {
      // 检查用户名是否已被其他用户使用
      const usernameResult = await db.query(
        'SELECT id FROM users WHERE username = $1 AND id != $2',
        [username, id]
      );
      if (usernameResult.rows.length > 0) {
        return res.status(400).json({
          success: false,
          error: '更新失败',
          message: '用户名已被其他用户使用'
        });
      }
      updates.push(`username = $${paramIndex}`);
      params.push(username);
      paramIndex++;
    }
    
    // 更新邮箱
    if (email) {
      // 检查邮箱是否已被其他用户使用
      const emailResult = await db.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email, id]
      );
      if (emailResult.rows.length > 0) {
        return res.status(400).json({
          success: false,
          error: '更新失败',
          message: '邮箱已被其他用户使用'
        });
      }
      updates.push(`email = $${paramIndex}`);
      params.push(email);
      paramIndex++;
    }
    
    // 更新角色
    if (role) {
      updates.push(`role = $${paramIndex}`);
      params.push(role);
      paramIndex++;
    }
    
    // 更新状态
    if (status) {
      updates.push(`status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }
    
    // 更新密码
    if (password) {
      const passwordHash = await bcrypt.hash(password, 10);
      updates.push(`password_hash = $${paramIndex}`);
      params.push(passwordHash);
      paramIndex++;
    }
    
    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: '更新失败',
        message: '没有提供要更新的信息'
      });
    }
    
    // 执行更新
    updates.push(`updated_at = $${paramIndex}`);
    params.push(new Date().toISOString());
    paramIndex++;
    params.push(id);
    
    await db.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
      params
    );
    
    // 获取更新后的用户信息
    const updatedResult = await db.query(
      'SELECT id, username, email, role, status, created_at, updated_at, last_login_at FROM users WHERE id = $1',
      [id]
    );
    const updatedUser = updatedResult.rows[0];
    
    res.json({
      success: true,
      message: '用户更新成功',
      data: updatedUser
    });
    
  } catch (error) {
    console.error('更新用户失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器错误',
      message: '更新用户时发生错误'
    });
  }
});

// 删除用户（仅管理员）
router.delete('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    
    // 检查用户是否存在
    const existingResult = await db.query(
      'SELECT username FROM users WHERE id = $1',
      [id]
    );
    
    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '用户不存在',
        message: '无法找到指定用户'
      });
    }
    
    // 软删除用户（将状态设置为deleted）
    await db.query(
      'UPDATE users SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['deleted', id]
    );
    
    res.json({
      success: true,
      message: '用户删除成功'
    });
    
  } catch (error) {
    console.error('删除用户失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器错误',
      message: '删除用户时发生错误'
    });
  }
});

// 检查用户名是否存在
router.get('/check-username', async (req, res) => {
  try {
    const { username } = req.query;
    
    if (!username) {
      return res.status(400).json({
        success: false,
        error: '参数错误',
        message: '用户名不能为空'
      });
    }
    
    const db = getDatabase();
    const result = await db.query(
      'SELECT id FROM users WHERE username = $1 AND status != $2',
      [username, 'deleted']
    );
    
    res.json({
      success: true,
      exists: result.rows.length > 0
    });
    
  } catch (error) {
    console.error('检查用户名失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器错误',
      message: '检查用户名时发生错误'
    });
  }
});

// 检查邮箱是否存在
router.get('/check-email', async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: '参数错误',
        message: '邮箱不能为空'
      });
    }
    
    const db = getDatabase();
    const result = await db.query(
      'SELECT id FROM users WHERE email = $1 AND status != $2',
      [email, 'deleted']
    );
    
    res.json({
      success: true,
      exists: result.rows.length > 0
    });
    
  } catch (error) {
    console.error('检查邮箱失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器错误',
      message: '检查邮箱时发生错误'
    });
  }
});

// 刷新令牌
router.post('/refresh', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();
    const result = await db.query(
      'SELECT id, username, role FROM users WHERE id = $1 AND status = $2',
      [req.user.userId, 'active']
    );
    const user = result.rows[0];
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: '令牌无效',
        message: '用户不存在或已被禁用'
      });
    }
    
    // 生成新的JWT令牌
    const newToken = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        role: user.role
      },
      envConfig.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    res.json({
      success: true,
      message: '令牌刷新成功',
      data: { token: newToken }
    });
    
  } catch (error) {
    console.error('刷新令牌失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器错误',
      message: '刷新令牌时发生错误'
    });
  }
});

// 用户登出
router.post('/logout', authenticateToken, (req, res) => {
  // 注意：JWT是无状态的，真正的登出需要在客户端删除令牌
  // 这里可以记录登出日志或实现令牌黑名单
  res.json({
    success: true,
    message: '登出成功'
  });
});

export default router;
