import jwt from 'jsonwebtoken';

// JWT认证中间件
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    return res.status(401).json({
      error: '访问被拒绝',
      message: '缺少访问令牌'
    });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: '访问被拒绝',
        message: '访问令牌已过期'
      });
    }
    
    return res.status(403).json({
      error: '访问被拒绝',
      message: '无效的访问令牌'
    });
  }
}

// 角色验证中间件
export function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: '访问被拒绝',
        message: '需要先登录'
      });
    }
    
    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: '权限不足',
        message: '您没有权限执行此操作'
      });
    }
    
    next();
  };
}

// 管理员权限验证
export const requireAdmin = requireRole('admin');

// 用户或管理员权限验证
export const requireUserOrAdmin = requireRole(['user', 'admin']);
