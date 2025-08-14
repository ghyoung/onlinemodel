import pg from 'pg';
import dotenv from 'dotenv';
import { envConfig } from '../../env.config.js';

dotenv.config();

const { Pool } = pg;

// 数据库连接池
let pool;

// 初始化数据库连接
async function initDatabase() {
  try {
    // 创建连接池
    pool = new Pool({
      host: envConfig.DB_HOST || 'localhost',
      port: envConfig.DB_PORT || 5433,
      database: envConfig.DB_NAME || 'lakehouse_modeling',
      user: envConfig.DB_USERNAME || 'lakehouse_user',
      password: envConfig.DB_PASSWORD || 'lakehouse_pass',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // 测试连接
    const client = await pool.connect();
    console.log('✅ PostgreSQL数据库连接成功');
    client.release();

    return pool;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error);
    throw error;
  }
}

// 修复数据库结构
async function fixDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 开始修复数据库结构...');
    
    // 检查并添加缺失的字段
    const fieldsToAdd = [
      {
        table: 'users',
        column: 'last_login_at',
        type: 'TIMESTAMP',
        defaultValue: 'NULL'
      },
      {
        table: 'users',
        column: 'updated_at',
        type: 'TIMESTAMP',
        defaultValue: 'DEFAULT CURRENT_TIMESTAMP'
      }
    ];
    
    for (const field of fieldsToAdd) {
      try {
        // 检查字段是否存在
        const checkResult = await client.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = $1 AND column_name = $2
        `, [field.table, field.column]);
        
        if (checkResult.rows.length === 0) {
          console.log(`➕ 添加字段: ${field.table}.${field.column}`);
          
          if (field.defaultValue === 'NULL') {
            await client.query(`
              ALTER TABLE ${field.table} 
              ADD COLUMN ${field.column} ${field.type}
            `);
          } else {
            await client.query(`
              ALTER TABLE ${field.table} 
              ADD COLUMN ${field.column} ${field.type} ${field.defaultValue}
            `);
          }
          
          console.log(`✅ 字段 ${field.table}.${field.column} 添加成功`);
        } else {
          console.log(`ℹ️ 字段 ${field.table}.${field.column} 已存在`);
        }
      } catch (error) {
        console.error(`❌ 添加字段 ${field.table}.${field.column} 失败:`, error);
      }
    }
    
    // 检查并创建索引
    const indexesToCreate = [
      {
        name: 'idx_users_username',
        query: 'CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)'
      },
      {
        name: 'idx_users_email',
        query: 'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)'
      }
    ];
    
    for (const index of indexesToCreate) {
      try {
        await client.query(index.query);
        console.log(`✅ 索引 ${index.name} 创建成功`);
      } catch (error) {
        console.error(`❌ 创建索引 ${index.name} 失败:`, error);
      }
    }
    
    console.log('✅ 数据库结构修复完成');
    
  } finally {
    client.release();
  }
}

// 主函数
async function main() {
  try {
    await initDatabase();
    await fixDatabase();
    console.log('🎉 数据库修复完成！');
    process.exit(0);
  } catch (error) {
    console.error('💥 数据库修复失败:', error);
    process.exit(1);
  }
}

// 运行修复脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { fixDatabase };
