import mysql from 'mysql2/promise';
import { Client } from 'pg';
import { MongoClient } from 'mongodb';

/**
 * 数据库连接器 - 支持多种数据库类型的真实连接测试和表结构获取
 */
class DatabaseConnector {
  
  /**
   * 测试MySQL连接
   */
  static async testMySQLConnection(connectionInfo) {
    const { host, port, database, username, password, connectionParams } = connectionInfo;
    
    try {
      // 构建连接配置
      const config = {
        host: host || 'localhost',
        port: port || 3306,
        user: username,
        password: password,
        database: database,
        connectTimeout: 10000,
        acquireTimeout: 10000,
        timeout: 10000,
        ...this.parseConnectionParams(connectionParams)
      };
      
      // 尝试连接
      const connection = await mysql.createConnection(config);
      
      // 测试基本查询
      const [rows] = await connection.execute('SELECT 1 as test');
      
      // 获取数据库信息
      const [dbInfo] = await connection.execute('SELECT DATABASE() as current_db, VERSION() as version');
      
      await connection.end();
      
      return {
        success: true,
        message: `成功连接到MySQL数据库 ${host}:${port}/${database}`,
        data: {
          database: dbInfo[0].current_db,
          version: dbInfo[0].version,
          connectionTime: new Date().toISOString()
        }
      };
      
    } catch (error) {
      return {
        success: false,
        message: `MySQL连接失败: ${error.message}`,
        error: error.code || 'UNKNOWN_ERROR'
      };
    }
  }
  
  /**
   * 获取MySQL数据库表结构
   */
  static async getMySQLSchema(connectionInfo) {
    const { host, port, database, username, password, connectionParams } = connectionInfo;
    
    try {
      // 构建连接配置
      const config = {
        host: host || 'localhost',
        port: port || 3306,
        user: username,
        password: password,
        database: database,
        connectTimeout: 10000,
        acquireTimeout: 10000,
        timeout: 10000,
        ...this.parseConnectionParams(connectionParams)
      };
      
      // 尝试连接
      const connection = await mysql.createConnection(config);
      
      // 获取所有表信息
      const [tables] = await connection.execute(`
        SELECT 
          TABLE_NAME as table_name,
          TABLE_SCHEMA as schema_name,
          TABLE_COMMENT as description
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'
        ORDER BY TABLE_SCHEMA, TABLE_NAME
      `, [database]);
      
      const result = [];
      
      // 获取每个表的字段信息
      for (const table of tables) {
        const [columns] = await connection.execute(`
          SELECT 
            COLUMN_NAME as column_name,
            DATA_TYPE as data_type,
            IS_NULLABLE as is_nullable,
            COLUMN_KEY as column_key,
            COLUMN_DEFAULT as default_value,
            COLUMN_COMMENT as description,
            ORDINAL_POSITION as ordinal_position
          FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
          ORDER BY ORDINAL_POSITION
        `, [database, table.table_name]);
        
        result.push({
          tableName: table.table_name,
          schemaName: table.schema_name || 'public',
          description: table.description || '',
          columns: columns.map(col => ({
            columnName: col.column_name,
            dataType: col.data_type.toUpperCase(),
            isNullable: col.is_nullable === 'YES',
            isPrimaryKey: col.column_key === 'PRI',
            defaultValue: col.default_value || '',
            description: col.description || '',
            ordinalPosition: col.ordinal_position
          }))
        });
      }
      
      await connection.end();
      
      return {
        success: true,
        message: `成功获取MySQL数据库 ${database} 的表结构`,
        data: {
          tables: result,
          totalTables: result.length,
          connectionTime: new Date().toISOString()
        }
      };
      
    } catch (error) {
      return {
        success: false,
        message: `获取MySQL表结构失败: ${error.message}`,
        error: error.code || 'UNKNOWN_ERROR'
      };
    }
  }
  
  /**
   * 测试PostgreSQL连接
   */
  static async testPostgreSQLConnection(connectionInfo) {
    const { host, port, database, username, password, connectionParams } = connectionInfo;
    
    try {
      // 构建连接字符串
      const connectionString = `postgresql://${username}:${password}@${host}:${port}/${database}`;
      
      // 尝试连接
      const client = new Client({ connectionString });
      await client.connect();
      
      // 测试基本查询
      const result = await client.query('SELECT 1 as test');
      
      // 获取数据库信息
      const dbInfo = await client.query('SELECT current_database() as current_db, version() as version');
      
      await client.end();
      
      return {
        success: true,
        message: `成功连接到PostgreSQL数据库 ${host}:${port}/${database}`,
        data: {
          database: dbInfo.rows[0].current_db,
          version: dbInfo.rows[0].version,
          connectionTime: new Date().toISOString()
        }
      };
      
    } catch (error) {
      return {
        success: false,
        message: `PostgreSQL连接失败: ${error.message}`,
        error: error.code || 'UNKNOWN_ERROR'
      };
    }
  }
  
  /**
   * 获取PostgreSQL数据库表结构
   */
  static async getPostgreSQLSchema(connectionInfo) {
    const { host, port, database, username, password, connectionParams } = connectionInfo;
    
    try {
      // 构建连接字符串
      const connectionString = `postgresql://${username}:${password}@${host}:${port}/${database}`;
      
      // 尝试连接
      const client = new Client({ connectionString });
      await client.connect();
      
      // 获取所有表信息
      const tablesResult = await client.query(`
        SELECT 
          t.table_name,
          t.table_schema as schema_name,
          COALESCE(pgd.description, '') as description
        FROM information_schema.tables t
        LEFT JOIN pg_catalog.pg_statio_all_tables st ON t.table_name = st.relname
        LEFT JOIN pg_catalog.pg_description pgd ON st.relid = pgd.objoid AND pgd.objsubid = 0
        WHERE t.table_schema NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
          AND t.table_type = 'BASE TABLE'
        ORDER BY t.table_schema, t.table_name
      `);
      
      const result = [];
      
      // 获取每个表的字段信息
      for (const table of tablesResult.rows) {
        const columnsResult = await client.query(`
          SELECT 
            c.column_name,
            c.data_type,
            c.is_nullable,
            CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END as is_primary_key,
            c.column_default as default_value,
            COALESCE(pgd.description, '') as description,
            c.ordinal_position
          FROM information_schema.columns c
          LEFT JOIN (
            SELECT ku.column_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage ku ON tc.constraint_name = ku.constraint_name
            WHERE tc.constraint_type = 'PRIMARY KEY' AND ku.table_name = $1
          ) pk ON c.column_name = pk.column_name
          LEFT JOIN pg_catalog.pg_statio_all_tables st ON c.table_name = st.relname
          LEFT JOIN pg_catalog.pg_description pgd ON st.relid = pgd.objoid AND pgd.objsubid = c.ordinal_position
          WHERE c.table_name = $1 AND c.table_schema = $2
          ORDER BY c.ordinal_position
        `, [table.table_name, table.schema_name]);
        
        result.push({
          tableName: table.table_name,
          schemaName: table.schema_name || 'public',
          description: table.description || '',
          columns: columnsResult.rows.map(col => ({
            columnName: col.column_name,
            dataType: col.data_type.toUpperCase(),
            isNullable: col.is_nullable === 'YES',
            isPrimaryKey: col.is_primary_key,
            defaultValue: col.default_value || '',
            description: col.description || '',
            ordinalPosition: col.ordinal_position
          }))
        });
      }
      
      await client.end();
      
      return {
        success: true,
        message: `成功获取PostgreSQL数据库 ${database} 的表结构`,
        data: {
          tables: result,
          totalTables: result.length,
          connectionTime: new Date().toISOString()
        }
      };
      
    } catch (error) {
      return {
        success: false,
        message: `获取PostgreSQL表结构失败: ${error.message}`,
        error: error.code || 'UNKNOWN_ERROR'
      };
    }
  }
  
  /**
   * 测试MongoDB连接
   */
  static async testMongoDBConnection(connectionInfo) {
    const { host, port, database, username, password, connectionParams } = connectionInfo;
    
    try {
      // 构建连接字符串
      let connectionString = `mongodb://`;
      if (username && password) {
        connectionString += `${username}:${password}@`;
      }
      connectionString += `${host}:${port || 27017}`;
      if (database) {
        connectionString += `/${database}`;
      }
      
      // 尝试连接
      const client = new MongoClient(connectionString, {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000
      });
      
      await client.connect();
      
      // 测试基本操作
      const adminDb = client.db('admin');
      const result = await adminDb.command({ ping: 1 });
      
      // 获取数据库信息
      const dbList = await client.db().admin().listDatabases();
      
      await client.close();
      
      return {
        success: true,
        message: `成功连接到MongoDB数据库 ${host}:${port || 27017}`,
        data: {
          databases: dbList.databases.map(db => db.name),
          connectionTime: new Date().toISOString()
        }
      };
      
    } catch (error) {
      return {
        success: false,
        message: `MongoDB连接失败: ${error.message}`,
        error: error.code || 'UNKNOWN_ERROR'
      };
    }
  }
  
  /**
   * 获取MongoDB数据库表结构
   */
  static async getMongoDBSchema(connectionInfo) {
    const { host, port, database, username, password, connectionParams } = connectionInfo;
    
    try {
      // 构建连接字符串
      let connectionString = `mongodb://`;
      if (username && password) {
        connectionString += `${username}:${password}@`;
      }
      connectionString += `${host}:${port || 27017}`;
      if (database) {
        connectionString += `/${database}`;
      }
      
      // 尝试连接
      const client = new MongoClient(connectionString, {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000
      });
      
      await client.connect();
      
      const db = client.db(database);
      const collections = await db.listCollections().toArray();
      
      const result = [];
      
      // 获取每个集合的结构信息
      for (const collection of collections) {
        if (collection.type === 'collection') {
          // 获取集合的示例文档来分析结构
          const sampleDoc = await db.collection(collection.name).findOne({});
          
          let columns = [];
          if (sampleDoc) {
            // 分析文档结构，转换为列信息
            columns = this.analyzeMongoDBDocument(sampleDoc);
          }
          
          result.push({
            tableName: collection.name,
            schemaName: database,
            description: collection.options?.validator ? '有验证规则' : '',
            columns: columns
          });
        }
      }
      
      await client.close();
      
      return {
        success: true,
        message: `成功获取MongoDB数据库 ${database} 的集合结构`,
        data: {
          tables: result,
          totalTables: result.length,
          connectionTime: new Date().toISOString()
        }
      };
      
    } catch (error) {
      return {
        success: false,
        message: `获取MongoDB集合结构失败: ${error.message}`,
        error: error.code || 'UNKNOWN_ERROR'
      };
    }
  }
  
  /**
   * 分析MongoDB文档结构，转换为列信息
   */
  static analyzeMongoDBDocument(doc, prefix = '') {
    const columns = [];
    let position = 1;
    
    for (const [key, value] of Object.entries(doc)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (value === null) {
        columns.push({
          columnName: fullKey,
          dataType: 'NULL',
          isNullable: true,
          isPrimaryKey: false,
          defaultValue: '',
          description: 'MongoDB字段',
          ordinalPosition: position++
        });
      } else if (typeof value === 'string') {
        columns.push({
          columnName: fullKey,
          dataType: 'STRING',
          isNullable: true,
          isPrimaryKey: false,
          defaultValue: '',
          description: 'MongoDB字符串字段',
          ordinalPosition: position++
        });
      } else if (typeof value === 'number') {
        columns.push({
          columnName: fullKey,
          dataType: value % 1 === 0 ? 'INT' : 'DOUBLE',
          isNullable: true,
          isPrimaryKey: false,
          defaultValue: '',
          description: 'MongoDB数值字段',
          ordinalPosition: position++
        });
      } else if (typeof value === 'boolean') {
        columns.push({
          columnName: fullKey,
          dataType: 'BOOLEAN',
          isNullable: true,
          isPrimaryKey: false,
          defaultValue: '',
          description: 'MongoDB布尔字段',
          ordinalPosition: position++
        });
      } else if (value instanceof Date) {
        columns.push({
          columnName: fullKey,
          dataType: 'DATE',
          isNullable: true,
          isPrimaryKey: false,
          defaultValue: '',
          description: 'MongoDB日期字段',
          ordinalPosition: position++
        });
      } else if (Array.isArray(value)) {
        columns.push({
          columnName: fullKey,
          dataType: 'ARRAY',
          isNullable: true,
          isPrimaryKey: false,
          defaultValue: '',
          description: 'MongoDB数组字段',
          ordinalPosition: position++
        });
      } else if (typeof value === 'object') {
        // 递归处理嵌套对象
        const nestedColumns = this.analyzeMongoDBDocument(value, fullKey);
        columns.push(...nestedColumns);
      }
    }
    
    return columns;
  }
  
  /**
   * 测试通用数据库连接
   */
  static async testDatabaseConnection(connectionInfo, databaseType) {
    switch (databaseType.toUpperCase()) {
      case 'MYSQL':
        return await this.testMySQLConnection(connectionInfo);
        
      case 'POSTGRESQL':
        return await this.testPostgreSQLConnection(connectionInfo);
        
      case 'MONGODB':
        return await this.testMongoDBConnection(connectionInfo);
        
      case 'ORACLE':
        // TODO: 实现Oracle连接测试
        return {
          success: false,
          message: 'Oracle连接测试暂未实现',
          error: 'NOT_IMPLEMENTED'
        };
        
      case 'SQLSERVER':
        // TODO: 实现SQL Server连接测试
        return {
          success: false,
          message: 'SQL Server连接测试暂未实现',
          error: 'NOT_IMPLEMENTED'
        };
        
      default:
        return {
          success: false,
          message: `不支持的数据库类型: ${databaseType}`,
          error: 'UNSUPPORTED_DATABASE_TYPE'
        };
    }
  }
  
  /**
   * 获取数据库表结构
   */
  static async getDatabaseSchema(connectionInfo, databaseType) {
    switch (databaseType.toUpperCase()) {
      case 'MYSQL':
        return await this.getMySQLSchema(connectionInfo);
        
      case 'POSTGRESQL':
        return await this.getPostgreSQLSchema(connectionInfo);
        
      case 'MONGODB':
        return await this.getMongoDBSchema(connectionInfo);
        
      case 'ORACLE':
        // TODO: 实现Oracle表结构获取
        return {
          success: false,
          message: 'Oracle表结构获取暂未实现',
          error: 'NOT_IMPLEMENTED'
        };
        
      case 'SQLSERVER':
        // TODO: 实现SQL Server表结构获取
        return {
          success: false,
          message: 'SQL Server表结构获取暂未实现',
          error: 'NOT_IMPLEMENTED'
        };
        
      default:
        return {
          success: false,
          message: `不支持的数据库类型: ${databaseType}`,
          error: 'UNSUPPORTED_DATABASE_TYPE'
        };
    }
  }
  
  /**
   * 解析连接参数字符串
   */
  static parseConnectionParams(connectionParams) {
    if (!connectionParams) return {};
    
    const params = {};
    const pairs = connectionParams.split('&');
    
    for (const pair of pairs) {
      const [key, value] = pair.split('=');
      if (key && value) {
        params[key] = value;
      }
    }
    
    return params;
  }
}

export default DatabaseConnector;
