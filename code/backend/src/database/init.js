import pg from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { envConfig } from '../../env.config.js';

dotenv.config();

const { Pool } = pg;

// 数据库连接池
let pool;

// 初始化数据库连接
export async function initDatabase() {
  try {
    // 创建连接池
    pool = new Pool({
      host: envConfig.DB_HOST || 'localhost',
      port: envConfig.DB_PORT || 5433,
      database: envConfig.DB_NAME || 'lakehouse_modeling',
      user: envConfig.DB_USERNAME || 'lakehouse_user',
      password: envConfig.DB_PASSWORD || 'lakehouse_pass',
      max: 20, // 最大连接数
      idleTimeoutMillis: 30000, // 连接空闲超时
      connectionTimeoutMillis: 2000, // 连接超时
    });

    // 测试连接
    const client = await pool.connect();
    console.log('✅ PostgreSQL数据库连接成功');
    client.release();

    // 创建表结构
    await createTables();
    
    // 插入初始数据
    await insertInitialData();
    
    console.log('✅ 数据库初始化完成');
    return pool;
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    throw error;
  }
}

// 获取数据库连接池
export function getDatabase() {
  if (!pool) {
    throw new Error('数据库未初始化，请先调用 initDatabase()');
  }
  return pool;
}

// 创建表结构
async function createTables() {
  const client = await pool.connect();
  
  try {
    // 用户表
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'user',
        status VARCHAR(20) DEFAULT 'active',
        last_login_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 数据源表
    await client.query(`
      CREATE TABLE IF NOT EXISTS data_sources (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        type VARCHAR(50) NOT NULL,
        connection_info JSONB NOT NULL,
        status VARCHAR(20) DEFAULT 'active',
        last_test_at TIMESTAMP,
        last_sync_at TIMESTAMP,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 数据表信息
    await client.query(`
      CREATE TABLE IF NOT EXISTS tables (
        id SERIAL PRIMARY KEY,
        data_source_id INTEGER NOT NULL REFERENCES data_sources(id),
        table_name VARCHAR(100) NOT NULL,
        schema_name VARCHAR(100),
        description TEXT,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(data_source_id, table_name)
      )
    `);

    // 字段信息
    await client.query(`
      CREATE TABLE IF NOT EXISTS columns (
        id SERIAL PRIMARY KEY,
        table_id INTEGER NOT NULL REFERENCES tables(id),
        column_name VARCHAR(100) NOT NULL,
        data_type VARCHAR(50) NOT NULL,
        is_nullable BOOLEAN DEFAULT true,
        is_primary_key BOOLEAN DEFAULT false,
        default_value TEXT,
        description TEXT,
        ordinal_position INTEGER DEFAULT 0,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(table_id, column_name)
      )
    `);

    // 数据模型
    await client.query(`
      CREATE TABLE IF NOT EXISTS models (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        model_type VARCHAR(50) NOT NULL,
        status VARCHAR(20) DEFAULT 'draft',
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 模型字段映射
    await client.query(`
      CREATE TABLE IF NOT EXISTS model_fields (
        id SERIAL PRIMARY KEY,
        model_id INTEGER NOT NULL REFERENCES models(id),
        field_name VARCHAR(100) NOT NULL,
        field_type VARCHAR(50) NOT NULL,
        source_table_id INTEGER REFERENCES tables(id),
        source_column_id INTEGER REFERENCES columns(id),
        business_rule TEXT,
        data_quality_rule TEXT,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 标准字段库
    await client.query(`
      CREATE TABLE IF NOT EXISTS standard_fields (
        id SERIAL PRIMARY KEY,
        field_name VARCHAR(100) NOT NULL,
        field_type VARCHAR(50) NOT NULL,
        business_meaning TEXT,
        data_standard TEXT,
        data_quality_rule TEXT,
        examples TEXT,
        status VARCHAR(20) DEFAULT 'active',
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 血缘关系
    await client.query(`
      CREATE TABLE IF NOT EXISTS lineage (
        id SERIAL PRIMARY KEY,
        source_table_id INTEGER REFERENCES tables(id),
        source_column_id INTEGER REFERENCES columns(id),
        target_table_id INTEGER REFERENCES tables(id),
        target_column_id INTEGER REFERENCES columns(id),
        transformation_rule TEXT,
        lineage_type VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // DDL导入记录
    await client.query(`
      CREATE TABLE IF NOT EXISTS ddl_imports (
        id SERIAL PRIMARY KEY,
        file_name VARCHAR(255) NOT NULL,
        file_size INTEGER,
        import_status VARCHAR(20) DEFAULT 'pending',
        parsed_tables INTEGER DEFAULT 0,
        parsed_columns INTEGER DEFAULT 0,
        error_message TEXT,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 创建索引
    await client.query('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_data_sources_type ON data_sources(type)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_tables_data_source ON tables(data_source_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_columns_table ON columns(table_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_models_created_by ON models(created_by)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_lineage_source ON lineage(source_table_id, source_column_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_lineage_target ON lineage(target_table_id, target_column_id)');

    console.log('✅ 数据库表结构创建完成');
  } finally {
    client.release();
  }
}

// 插入初始数据
async function insertInitialData() {
  const client = await pool.connect();
  
  try {
    // 检查是否已有数据
    const userCount = await client.query('SELECT COUNT(*) as count FROM users');
    
    if (parseInt(userCount.rows[0].count) === 0) {
      // 创建默认管理员用户
      const adminPassword = await bcrypt.hash('admin123', 10);
      
      await client.query(
        'INSERT INTO users (username, email, password_hash, role, status) VALUES ($1, $2, $3, $4, $5)',
        ['admin', 'admin@lakehouse.com', adminPassword, 'admin', 'active']
      );
      
      console.log('✅ 默认管理员用户创建完成 (用户名: admin, 密码: admin123)');
    }
    
    // 检查标准字段库
    const fieldCount = await client.query('SELECT COUNT(*) as count FROM standard_fields');
    
    if (parseInt(fieldCount.rows[0].count) === 0) {
      // 插入一些标准字段
      const standardFields = [
        ['user_id', 'INTEGER', '用户唯一标识', '正整数，非空', '必须大于0', '1, 2, 3'],
        ['user_name', 'VARCHAR(50)', '用户姓名', '中英文姓名，长度2-50', '不能为空，不能包含特殊字符', '张三, John'],
        ['email', 'VARCHAR(100)', '邮箱地址', '标准邮箱格式', '必须符合邮箱格式', 'user@example.com'],
        ['phone', 'VARCHAR(20)', '手机号码', '11位手机号', '必须为11位数字', '13800138000'],
        ['create_time', 'TIMESTAMP', '创建时间', 'ISO 8601格式', '不能为空，不能晚于当前时间', '2024-01-01 00:00:00'],
        ['update_time', 'TIMESTAMP', '更新时间', 'ISO 8601格式', '不能为空，不能早于创建时间', '2024-01-01 00:00:00']
      ];
      
      for (const field of standardFields) {
        await client.query(
          'INSERT INTO standard_fields (field_name, field_type, business_meaning, data_standard, data_quality_rule, examples) VALUES ($1, $2, $3, $4, $5, $6)',
          field
        );
      }
      
      console.log('✅ 标准字段库初始化完成');
    }
    
    // 检查数据源
    const dataSourceCount = await client.query('SELECT COUNT(*) as count FROM data_sources');
    
    if (parseInt(dataSourceCount.rows[0].count) === 0) {
      // 插入示例数据源
      const adminUser = await client.query('SELECT id FROM users WHERE username = $1', ['admin']);
      const adminId = adminUser.rows[0].id;
      
      const dataSources = [
        {
          name: 'MySQL主库',
          description: '生产环境主数据库',
          type: 'MYSQL',
          connectionInfo: {
            host: '192.168.1.100',
            port: 3306,
            database: 'production_db',
            username: 'app_user',
            password: 'encrypted_password',
            connectionParams: 'useSSL=false&serverTimezone=UTC'
          }
        },
        {
          name: 'PostgreSQL仓库',
          description: '数据仓库数据库',
          type: 'POSTGRESQL',
          connectionInfo: {
            host: '192.168.1.101',
            port: 5432,
            database: 'data_warehouse',
            username: 'warehouse_user',
            password: 'encrypted_password',
            connectionParams: 'sslmode=require'
          }
        },
        {
          name: 'Hive集群',
          description: '大数据分析集群',
          type: 'HIVE',
          connectionInfo: {
            host: '192.168.1.102',
            port: 10000,
            database: 'analytics',
            username: 'hive_user',
            password: 'encrypted_password',
            connectionParams: 'transportMode=http&httpPath=cliservice'
          }
        }
      ];
      
      for (const ds of dataSources) {
        const result = await client.query(
          'INSERT INTO data_sources (name, description, type, connection_info, created_by, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
          [ds.name, ds.description, ds.type, JSON.stringify(ds.connectionInfo), adminId, 'active']
        );
        
        const dataSourceId = result.rows[0].id;
        
        // 为每个数据源插入示例表
        const tables = [
          {
            tableName: 'users',
            schemaName: 'public',
            description: '用户信息表'
          },
          {
            tableName: 'orders',
            schemaName: 'public',
            description: '订单信息表'
          },
          {
            tableName: 'products',
            schemaName: 'public',
            description: '产品信息表'
          },
          {
            tableName: 'categories',
            schemaName: 'public',
            description: '产品分类表'
          },
          {
            tableName: 'user_logs',
            schemaName: 'logs',
            description: '用户行为日志表'
          }
        ];
        
        for (const table of tables) {
          const tableResult = await client.query(
            'INSERT INTO tables (data_source_id, table_name, schema_name, description, status) VALUES ($1, $2, $3, $4, $5) RETURNING id',
            [dataSourceId, table.tableName, table.schemaName, table.description, 'active']
          );
          
          const tableId = tableResult.rows[0].id;
          
          // 为每个表插入示例字段
          const columns = [
            {
              columnName: 'id',
              dataType: 'INTEGER',
              isNullable: false,
              isPrimaryKey: true,
              description: '主键ID'
            },
            {
              columnName: 'name',
              dataType: 'VARCHAR(100)',
              isNullable: false,
              isPrimaryKey: false,
              description: '名称'
            },
            {
              columnName: 'description',
              dataType: 'TEXT',
              isNullable: true,
              isPrimaryKey: false,
              description: '描述信息'
            },
            {
              columnName: 'created_at',
              dataType: 'TIMESTAMP',
              isNullable: false,
              isPrimaryKey: false,
              description: '创建时间'
            },
            {
              columnName: 'updated_at',
              dataType: 'TIMESTAMP',
              isNullable: true,
              isPrimaryKey: false,
              description: '更新时间'
            }
          ];
          
          for (const column of columns) {
            await client.query(
              'INSERT INTO columns (table_id, column_name, data_type, is_nullable, is_primary_key, description, status) VALUES ($1, $2, $3, $4, $5, $6, $7)',
              [tableId, column.columnName, column.dataType, column.isNullable, column.isPrimaryKey, column.description, 'active']
            );
          }
        }
      }
      
      console.log('✅ 示例数据源和表初始化完成');
    }
    
  } finally {
    client.release();
  }
}
