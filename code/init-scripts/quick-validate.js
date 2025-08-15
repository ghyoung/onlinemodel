import pg from 'pg';
import { envConfig } from '../backend/env.config.js';

const { Pool } = pg;

async function quickValidate() {
  console.log('🔍 快速系统校验...');
  
  let pool;
  try {
    // 数据库连接检查
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

    const client = await pool.connect();
    console.log('✅ 数据库连接正常');

    // 快速检查核心表
    const tables = ['data_sources', 'models', 'users'];
    for (const table of tables) {
      try {
        const result = await client.query(`SELECT 1 FROM ${table} LIMIT 1`);
        console.log(`✅ 表 ${table} 可访问`);
      } catch (error) {
        console.error(`❌ 表 ${table} 访问失败: ${error.message}`);
      }
    }

    // 检查关键字段
    try {
      const columnsResult = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'data_sources' AND column_name = 'description'
      `);
      
      if (columnsResult.rows.length > 0) {
        console.log('✅ data_sources.description 字段存在');
      } else {
        console.log('❌ data_sources.description 字段缺失 - 需要运行 fix-database.js');
      }
    } catch (error) {
      console.error('❌ 字段检查失败:', error.message);
    }

    client.release();
    console.log('✅ 快速校验完成');

  } catch (error) {
    console.error('❌ 快速校验失败:', error.message);
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

quickValidate().catch(console.error);
