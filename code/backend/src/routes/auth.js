import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDatabase } from '../database/init.js';
import { validateLogin, validateRegister } from '../middleware/validation.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// 用户登录
router.post('/login', validateLogin, async (req, res) => {
  try {
    const { username, password } = req.body;
    const db = getDatabase();
    
    // 查找用户
    const user = await db.get(
      'SELECT * FROM users WHERE username = ? AND status = "active"',
      [username]
    );
    
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
    
    // 生成JWT令牌
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        role: user.role
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    // 返回用户信息和令牌
    res.json({
      message: '登录成功',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status
      },
      token
    });
    
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({
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
    const existingUser = await db.get(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );
    
    if (existingUser) {
      return res.status(400).json({
        error: '注册失败',
        message: '用户名或邮箱已存在'
      });
    }
    
    // 加密密码
    const passwordHash = await bcrypt.hash(password, 10);
    
    // 创建用户
    const result = await db.run(
      'INSERT INTO users (username, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?)',
      [username, email, passwordHash, role, 'active']
    );
    
    // 获取新创建的用户信息
    const newUser = await db.get(
      'SELECT id, username, email, role, status, created_at FROM users WHERE id = ?',
      [result.lastID]
    );
    
    res.status(201).json({
      message: '注册成功',
      user: newUser
    });
    
  } catch (error) {
    console.error('注册失败:', error);
    res.status(500).json({
      error: '服务器错误',
      message: '注册过程中发生错误'
    });
  }
});

// 获取当前用户信息
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();
    const user = await db.get(
      'SELECT id, username, email, role, status, created_at, updated_at FROM users WHERE id = ?',
      [req.user.userId]
    );
    
    if (!user) {
      return res.status(404).json({
        error: '用户不存在',
        message: '无法找到用户信息'
      });
    }
    
    res.json({
      user
    });
    
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({
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
    const user = await db.get(
      'SELECT * FROM users WHERE id = ?',
      [req.user.userId]
    );
    
    if (!user) {
      return res.status(404).json({
        error: '用户不存在',
        message: '无法找到用户信息'
      });
    }
    
    const updates = [];
    const params = [];
    
    // 更新邮箱
    if (email && email !== user.email) {
      // 检查邮箱是否已被其他用户使用
      const existingUser = await db.get(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, req.user.userId]
      );
      
      if (existingUser) {
        return res.status(400).json({
          error: '更新失败',
          message: '邮箱已被其他用户使用'
        });
      }
      
      updates.push('email = ?');
      params.push(email);
    }
    
    // 更新密码
    if (currentPassword && newPassword) {
      // 验证当前密码
      const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isValidPassword) {
        return res.status(400).json({
          error: '更新失败',
          message: '当前密码错误'
        });
      }
      
      // 加密新密码
      const newPasswordHash = await bcrypt.hash(newPassword, 10);
      updates.push('password_hash = ?');
      params.push(newPasswordHash);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({
        error: '更新失败',
        message: '没有提供要更新的信息'
      });
    }
    
    // 执行更新
    params.push(new Date().toISOString());
    params.push(req.user.userId);
    
    await db.run(
      `UPDATE users SET ${updates.join(', ')}, updated_at = ? WHERE id = ?`,
      params
    );
    
    // 获取更新后的用户信息
    const updatedUser = await db.get(
      'SELECT id, username, email, role, status, created_at, updated_at FROM users WHERE id = ?',
      [req.user.userId]
    );
    
    res.json({
      message: '用户信息更新成功',
      user: updatedUser
    });
    
  } catch (error) {
    console.error('更新用户信息失败:', error);
    res.status(500).json({
      error: '服务器错误',
      message: '更新用户信息时发生错误'
    });
  }
});

// 刷新令牌
router.post('/refresh', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();
    const user = await db.get(
      'SELECT id, username, role FROM users WHERE id = ? AND status = "active"',
      [req.user.userId]
    );
    
    if (!user) {
      return res.status(401).json({
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
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    res.json({
      message: '令牌刷新成功',
      token: newToken
    });
    
  } catch (error) {
    console.error('刷新令牌失败:', error);
    res.status(500).json({
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
    message: '登出成功'
  });
});

export default router;
