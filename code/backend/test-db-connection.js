import pg from 'pg';
import { envConfig } from './env.config.js';

const { Pool } = pg;

async function testDatabaseConnection() {
  console.log('🔍 开始测试数据库连接...');
  console.log('📋 数据库配置:', {
    host: envConfig.DB_HOST,
    port: envConfig.DB_PORT,
    database: envConfig.DB_NAME,
    user: envConfig.DB_USERNAME,
    password: envConfig.DB_PASSWORD ? '***' : '未设置'
  });

  let pool;
  try {
    // 创建连接池
    pool = new Pool({
      host: envConfig.DB_HOST,
      port: envConfig.DB_PORT,
      database: envConfig.DB_NAME,
      user: envConfig.DB_USERNAME,
      password: envConfig.DB_PASSWORD,
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    // 测试连接
    const client = await pool.connect();
    console.log('✅ 数据库连接成功');

    // 测试查询
    const result = await client.query('SELECT version()');
    console.log('📊 PostgreSQL版本:', result.rows[0].version);

    // 检查表是否存在
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('📋 现有表:', tablesResult.rows.map(row => row.table_name));

    // 检查data_sources表结构
    try {
      const tableInfo = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'data_sources'
        ORDER BY ordinal_position
      `);
      
      if (tableInfo.rows.length > 0) {
        console.log('✅ data_sources表存在，列信息:');
        tableInfo.rows.forEach(col => {
          console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? '可空' : '非空'})`);
        });
      } else {
        console.log('❌ data_sources表不存在');
      }
    } catch (error) {
      console.log('❌ 检查data_sources表失败:', error.message);
    }

    // 检查users表
    try {
      const usersResult = await client.query('SELECT COUNT(*) as count FROM users');
      console.log('👥 用户数量:', usersResult.rows[0].count);
    } catch (error) {
      console.log('❌ 检查users表失败:', error.message);
    }

    client.release();
    console.log('✅ 数据库测试完成');

  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 建议: 请检查PostgreSQL服务是否启动');
    } else if (error.code === '28P01') {
      console.log('💡 建议: 请检查数据库用户名和密码');
    } else if (error.code === '3D000') {
      console.log('💡 建议: 请检查数据库名称是否正确');
    }
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

// 运行测试
testDatabaseConnection().catch(console.error);
