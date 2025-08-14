// 后端环境变量配置
export const envConfig = {
  // 服务器配置
  PORT: 3000,
  NODE_ENV: 'development',
  
  // 前端URL（用于CORS）
  FRONTEND_URL: 'http://localhost:3002',
  
  // JWT配置
  JWT_SECRET: 'your-super-secret-jwt-key-change-in-production',
  
  // 数据库配置（PostgreSQL）
  DB_HOST: 'localhost',
  DB_PORT: 5433,
  DB_NAME: 'lakehouse_modeling',
  DB_USERNAME: 'lakehouse_user',
  DB_PASSWORD: 'lakehouse_pass',
  
  // 日志配置
  LOG_LEVEL: 'info'
}
