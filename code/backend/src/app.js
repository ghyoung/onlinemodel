import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import dotenv from 'dotenv';

// 导入路由
import authRoutes from './routes/auth.js';
import dataSourceRoutes from './routes/dataSource.js';
import modelRoutes from './routes/model.js';
import fieldLibraryRoutes from './routes/fieldLibrary.js';
import lineageRoutes from './routes/lineage.js';
import ddlRoutes from './routes/ddl.js';

// 导入数据库初始化
import { initDatabase } from './database/init.js';

// 导入WebSocket处理
import { setupWebSocket } from './utils/websocket.js';

// 加载环境变量
dotenv.config();

const app = express();
const server = createServer(app);
const port = process.env.PORT || 3000;

// 中间件
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/data-sources', dataSourceRoutes);
app.use('/api/models', modelRoutes);
app.use('/api/field-library', fieldLibraryRoutes);
app.use('/api/lineage', lineageRoutes);
app.use('/api/ddl', ddlRoutes);

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 启动服务器
async function startServer() {
  try {
    // 初始化数据库
    await initDatabase();
    console.log('✅ 数据库初始化完成');
    
    // 启动HTTP服务器
    server.listen(port, () => {
      console.log(`🚀 湖仓建模工具后端服务启动成功`);
      console.log(`📍 服务地址: http://localhost:${port}`);
      console.log(`🔍 健康检查: http://localhost:${port}/health`);
      console.log(`🌍 环境: ${process.env.NODE_ENV || 'development'}`);
    });
    
    // 设置WebSocket
    setupWebSocket(server);
    console.log('✅ WebSocket服务启动完成');
    
  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
}

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('🔄 收到SIGTERM信号，正在关闭服务器...');
  server.close(() => {
    console.log('✅ 服务器已关闭');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🔄 收到SIGINT信号，正在关闭服务器...');
  server.close(() => {
    console.log('✅ 服务器已关闭');
    process.exit(0);
  });
});

// 启动服务器
startServer();
