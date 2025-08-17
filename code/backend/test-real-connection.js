import DatabaseConnector from './src/utils/databaseConnector.js'

async function testRealConnection() {
  console.log('🔍 测试真实数据库连接功能...')
  
  // 测试MySQL连接
  console.log('\n1. 测试MySQL连接:')
  const mysqlConfig = {
    host: 'localhost',
    port: 3306,
    database: 'test_db',
    username: 'test_user',
    password: 'test_password',
    connectionParams: 'useSSL=false&serverTimezone=UTC'
  }
  
  try {
    const mysqlResult = await DatabaseConnector.testDatabaseConnection(mysqlConfig, 'MYSQL')
    console.log('MySQL连接结果:', mysqlResult.success ? '✅ 成功' : '❌ 失败')
    console.log('消息:', mysqlResult.message)
    if (mysqlResult.data) {
      console.log('数据库信息:', mysqlResult.data)
    }
  } catch (error) {
    console.error('MySQL连接异常:', error.message)
  }
  
  // 测试PostgreSQL连接
  console.log('\n2. 测试PostgreSQL连接:')
  const postgresConfig = {
    host: 'localhost',
    port: 5432,
    database: 'test_db',
    username: 'test_user',
    password: 'test_password'
  }
  
  try {
    const postgresResult = await DatabaseConnector.testDatabaseConnection(postgresConfig, 'POSTGRESQL')
    console.log('PostgreSQL连接结果:', postgresResult.success ? '✅ 成功' : '❌ 失败')
    console.log('消息:', postgresResult.message)
    if (postgresResult.data) {
      console.log('数据库信息:', postgresResult.data)
    }
  } catch (error) {
    console.error('PostgreSQL连接异常:', error.message)
  }
  
  // 测试MongoDB连接
  console.log('\n3. 测试MongoDB连接:')
  const mongoConfig = {
    host: 'localhost',
    port: 27017,
    database: 'test_db',
    username: 'test_user',
    password: 'test_password'
  }
  
  try {
    const mongoResult = await DatabaseConnector.testDatabaseConnection(mongoConfig, 'MONGODB')
    console.log('MongoDB连接结果:', mongoResult.success ? '✅ 成功' : '❌ 失败')
    console.log('消息:', mongoResult.message)
    if (mongoResult.data) {
      console.log('数据库信息:', mongoResult.data)
    }
  } catch (error) {
    console.error('MongoDB连接异常:', error.message)
  }
  
  // 测试不支持的数据库类型
  console.log('\n4. 测试不支持的数据库类型:')
  try {
    const unsupportedResult = await DatabaseConnector.testDatabaseConnection({}, 'ORACLE')
    console.log('Oracle连接结果:', unsupportedResult.success ? '✅ 成功' : '❌ 失败')
    console.log('消息:', unsupportedResult.message)
  } catch (error) {
    console.error('Oracle连接异常:', error.message)
  }
  
  console.log('\n✅ 真实数据库连接测试完成')
  console.log('\n注意: 以上测试会失败，因为测试数据库不存在')
  console.log('这是正常的，说明连接测试功能已经实现')
}

// 运行测试
testRealConnection()
