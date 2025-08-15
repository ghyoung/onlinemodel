import pg from 'pg';
import { envConfig } from '../backend/env.config.js';
import fs from 'fs';
import path from 'path';

const { Pool } = pg;

class SystemValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.success = [];
  }

  log(type, message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${type.toUpperCase()}: ${message}`;
    
    switch (type) {
      case 'error':
        this.errors.push(logMessage);
        console.error(`❌ ${message}`);
        break;
      case 'warning':
        this.warnings.push(logMessage);
        console.warn(`⚠️  ${message}`);
        break;
      case 'success':
        this.success.push(logMessage);
        console.log(`✅ ${message}`);
        break;
      default:
        console.log(`ℹ️  ${message}`);
    }
  }

  async validateDatabase() {
    this.log('info', '🔍 开始验证数据库结构...');
    
    let pool;
    try {
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
      this.log('success', '数据库连接成功');

      // 验证核心表结构
      await this.validateTableStructure(client, 'data_sources', [
        { name: 'id', type: 'integer', nullable: false },
        { name: 'name', type: 'character varying', nullable: false },
        { name: 'type', type: 'character varying', nullable: false },
        { name: 'connection_string', type: 'text', nullable: false },
        { name: 'description', type: 'text', nullable: true },
        { name: 'status', type: 'character varying', nullable: true },
        { name: 'created_at', type: 'timestamp', nullable: true },
        { name: 'updated_at', type: 'timestamp', nullable: true },
        { name: 'last_test_at', type: 'timestamp', nullable: true },
        { name: 'last_sync_at', type: 'timestamp', nullable: true }
      ]);

      await this.validateTableStructure(client, 'models', [
        { name: 'id', type: 'integer', nullable: false },
        { name: 'name', type: 'character varying', nullable: false },
        { name: 'description', type: 'text', nullable: true },
        { name: 'data_source_id', type: 'integer', nullable: true },
        { name: 'created_at', type: 'timestamp', nullable: true },
        { name: 'updated_at', type: 'timestamp', nullable: true }
      ]);

      await this.validateTableStructure(client, 'users', [
        { name: 'id', type: 'integer', nullable: false },
        { name: 'username', type: 'character varying', nullable: false },
        { name: 'email', type: 'character varying', nullable: false },
        { name: 'password_hash', type: 'character varying', nullable: false },
        { name: 'created_at', type: 'timestamp', nullable: true },
        { name: 'updated_at', type: 'timestamp', nullable: true }
      ]);

      client.release();
      this.log('success', '数据库结构验证完成');

    } catch (error) {
      this.log('error', `数据库验证失败: ${error.message}`);
    } finally {
      if (pool) {
        await pool.end();
      }
    }
  }

  async validateTableStructure(client, tableName, expectedColumns) {
    try {
      const result = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = $1
        ORDER BY ordinal_position
      `, [tableName]);

      const existingColumns = result.rows;
      const existingColumnNames = existingColumns.map(col => col.column_name);

      this.log('info', `表 ${tableName} 当前列: ${existingColumnNames.join(', ')}`);

      for (const expectedCol of expectedColumns) {
        const existingCol = existingColumns.find(col => col.column_name === expectedCol.name);
        
        if (!existingCol) {
          this.log('error', `表 ${tableName} 缺少列: ${expectedCol.name}`);
        } else if (existingCol.data_type !== expectedCol.type) {
          this.log('warning', `表 ${tableName} 列 ${expectedCol.name} 类型不匹配: 期望 ${expectedCol.type}, 实际 ${existingCol.data_type}`);
        } else if (expectedCol.nullable === false && existingCol.is_nullable === 'YES') {
          this.log('warning', `表 ${tableName} 列 ${expectedCol.name} 应该为非空，但当前允许为空`);
        }
      }
    } catch (error) {
      this.log('error', `验证表 ${tableName} 结构失败: ${error.message}`);
    }
  }

  async validateBackendAPI() {
    this.log('info', '🔍 开始验证后端API...');
    
    try {
      // 检查路由文件是否存在
      const routeFiles = [
        'src/routes/auth.js',
        'src/routes/dataSource.js',
        'src/routes/model.js',
        'src/routes/fieldLibrary.js',
        'src/routes/lineage.js',
        'src/routes/ddl.js'
      ];

      for (const routeFile of routeFiles) {
        const fullPath = path.join(process.cwd(), '..', 'backend', routeFile);
        if (fs.existsSync(fullPath)) {
          this.log('success', `路由文件存在: ${routeFile}`);
        } else {
          this.log('error', `路由文件缺失: ${routeFile}`);
        }
      }

      // 检查控制器文件
      const controllerFiles = [
        'src/controllers/authController.js',
        'src/controllers/dataSourceController.js',
        'src/controllers/modelController.js'
      ];

      for (const controllerFile of controllerFiles) {
        const fullPath = path.join(process.cwd(), '..', 'backend', controllerFile);
        if (fs.existsSync(fullPath)) {
          this.log('success', `控制器文件存在: ${controllerFile}`);
        } else {
          this.log('warning', `控制器文件缺失: ${controllerFile}`);
        }
      }

      this.log('success', '后端API验证完成');
    } catch (error) {
      this.log('error', `后端API验证失败: ${error.message}`);
    }
  }

  async validateFrontend() {
    this.log('info', '🔍 开始验证前端结构...');
    
    try {
      // 检查页面组件
      const pageFiles = [
        'src/pages/Dashboard.tsx',
        'src/pages/DataSourceManagement.tsx',
        'src/pages/ModelManagement.tsx',
        'src/pages/OnlineModeling.tsx',
        'src/pages/FieldLibrary.tsx',
        'src/pages/Lineage.tsx',
        'src/pages/DDLImport.tsx',
        'src/pages/DataGovernance.tsx',
        'src/pages/UserManagement.tsx',
        'src/pages/SystemSettings.tsx'
      ];

      for (const pageFile of pageFiles) {
        const fullPath = path.join(process.cwd(), '..', 'frontend', pageFile);
        if (fs.existsSync(fullPath)) {
          this.log('success', `页面组件存在: ${pageFile}`);
        } else {
          this.log('error', `页面组件缺失: ${pageFile}`);
        }
      }

      // 检查配置文件
      const configFiles = [
        'src/config/api.ts',
        'src/config/env.ts',
        'src/stores/authStore.ts'
      ];

      for (const configFile of configFiles) {
        const fullPath = path.join(process.cwd(), '..', 'frontend', configFile);
        if (fs.existsSync(fullPath)) {
          this.log('success', `配置文件存在: ${configFile}`);
        } else {
          this.log('warning', `配置文件缺失: ${configFile}`);
        }
      }

      this.log('success', '前端结构验证完成');
    } catch (error) {
      this.log('error', `前端验证失败: ${error.message}`);
    }
  }

  async validateEnvironment() {
    this.log('info', '🔍 开始验证环境配置...');
    
    try {
      // 检查环境配置文件
      const envFiles = [
        '../backend/env.config.js',
        '../frontend/env.config.js'
      ];

      for (const envFile of envFiles) {
        const fullPath = path.join(process.cwd(), envFile);
        if (fs.existsSync(fullPath)) {
          this.log('success', `环境配置文件存在: ${envFile}`);
        } else {
          this.log('error', `环境配置文件缺失: ${envFile}`);
        }
      }

      // 检查package.json
      const packageFiles = [
        '../backend/package.json',
        '../frontend/package.json'
      ];

      for (const packageFile of packageFiles) {
        const fullPath = path.join(process.cwd(), packageFile);
        if (fs.existsSync(fullPath)) {
          this.log('success', `package.json存在: ${packageFile}`);
        } else {
          this.log('error', `package.json缺失: ${packageFile}`);
        }
      }

      this.log('success', '环境配置验证完成');
    } catch (error) {
      this.log('error', `环境配置验证失败: ${error.message}`);
    }
  }

  generateReport() {
    this.log('info', '\n📊 系统一致性校验报告');
    this.log('info', '='.repeat(50));
    
    if (this.success.length > 0) {
      this.log('info', `✅ 成功项目: ${this.success.length}`);
    }
    
    if (this.warnings.length > 0) {
      this.log('info', `⚠️  警告项目: ${this.warnings.length}`);
    }
    
    if (this.errors.length > 0) {
      this.log('info', `❌ 错误项目: ${this.errors.length}`);
    }

    if (this.errors.length === 0) {
      this.log('success', '🎉 系统一致性校验通过！');
    } else {
      this.log('error', '🚨 系统存在不一致问题，请修复后重新校验');
    }

    // 保存报告到文件
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        success: this.success.length,
        warnings: this.warnings.length,
        errors: this.errors.length
      },
      details: {
        success: this.success,
        warnings: this.warnings,
        errors: this.errors
      }
    };

    const reportPath = path.join(process.cwd(), 'validation-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    this.log('info', `📄 详细报告已保存到: ${reportPath}`);
  }

  async run() {
    this.log('info', '🚀 开始系统一致性校验...');
    
    await this.validateEnvironment();
    await this.validateDatabase();
    await this.validateBackendAPI();
    await this.validateFrontend();
    
    this.generateReport();
  }
}

// 运行校验
const validator = new SystemValidator();
validator.run().catch(console.error);
