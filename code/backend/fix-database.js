import pg from 'pg';
import { envConfig } from './env.config.js';

const { Pool } = pg;

async function fixDatabase() {
  console.log('🔧 开始修复数据库结构...');
  
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

    const client = await pool.connect();
    console.log('✅ 数据库连接成功');

    // 检查data_sources表结构
    const columnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'data_sources'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 当前data_sources表列:', columnsResult.rows.map(col => col.column_name));
    
    // 检查是否缺少description字段
    const hasDescription = columnsResult.rows.some(col => col.column_name === 'description');
    
    if (!hasDescription) {
      console.log('🔧 发现缺少description字段，正在添加...');
      
      // 添加description字段
      await client.query(`
        ALTER TABLE data_sources 
        ADD COLUMN description TEXT
      `);
      
      console.log('✅ description字段添加成功');
    } else {
      console.log('✅ description字段已存在');
    }
    
    // 检查是否缺少其他必要字段
    const requiredColumns = [
      'last_test_at',
      'last_sync_at'
    ];
    
    for (const column of requiredColumns) {
      const hasColumn = columnsResult.rows.some(col => col.column_name === column);
      if (!hasColumn) {
        console.log(`🔧 发现缺少${column}字段，正在添加...`);
        await client.query(`
          ALTER TABLE data_sources 
          ADD COLUMN ${column} TIMESTAMP
        `);
        console.log(`✅ ${column}字段添加成功`);
      }
    }
    
    // 验证修复结果
    const finalColumnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'data_sources'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 修复后的data_sources表列:', finalColumnsResult.rows.map(col => col.column_name));
    
    client.release();
    console.log('✅ 数据库修复完成');

  } catch (error) {
    console.error('❌ 数据库修复失败:', error.message);
    
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

// 运行修复
fixDatabase().catch(console.error);
