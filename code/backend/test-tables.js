import { getDatabase } from './src/database/init.js'

async function testTables() {
  try {
    const db = getDatabase()
    
    console.log('🔍 测试数据表相关功能...')
    
    // 测试获取数据源列表
    console.log('\n1. 获取数据源列表:')
    const dataSourcesResult = await db.query(
      'SELECT id, name, type FROM data_sources WHERE status != $1',
      ['deleted']
    )
    console.log('数据源数量:', dataSourcesResult.rows.length)
    dataSourcesResult.rows.forEach(ds => {
      console.log(`  - ${ds.name} (${ds.type}) - ID: ${ds.id}`)
    })
    
    if (dataSourcesResult.rows.length === 0) {
      console.log('❌ 没有找到数据源，请先运行数据库初始化脚本')
      return
    }
    
    const firstDataSource = dataSourcesResult.rows[0]
    
    // 测试获取数据表列表
    console.log(`\n2. 获取数据源 ${firstDataSource.name} 下的数据表:`)
    const tablesResult = await db.query(
      `SELECT t.*, 
              (SELECT COUNT(*) FROM columns c WHERE c.table_id = t.id AND c.status = 'active') as column_count,
              (SELECT COUNT(*) FROM columns c WHERE c.table_id = t.id AND c.status = 'active' AND c.is_primary_key = true) as primary_key_count
       FROM tables t 
       WHERE t.data_source_id = $1 AND t.status = 'active'
       ORDER BY t.schema_name NULLS LAST, t.table_name`,
      [firstDataSource.id]
    )
    
    console.log('数据表数量:', tablesResult.rows.length)
    tablesResult.rows.forEach(table => {
      console.log(`  - ${table.table_name} (${table.schema_name || 'default'}) - 字段数: ${table.column_count}, 主键数: ${table.primary_key_count}`)
    })
    
    if (tablesResult.rows.length === 0) {
      console.log('❌ 没有找到数据表，请先运行数据库初始化脚本')
      return
    }
    
    const firstTable = tablesResult.rows[0]
    
    // 测试获取表字段
    console.log(`\n3. 获取表 ${firstTable.table_name} 的字段信息:`)
    const columnsResult = await db.query(
      `SELECT * FROM columns 
       WHERE table_id = $1 AND status = 'active' 
       ORDER BY id, column_name`,
      [firstTable.id]
    )
    
    console.log('字段数量:', columnsResult.rows.length)
    columnsResult.rows.forEach(column => {
      console.log(`  - ${column.column_name}: ${column.data_type} ${column.is_nullable ? 'NULL' : 'NOT NULL'} ${column.is_primary_key ? 'PRIMARY KEY' : ''}`)
    })
    
    console.log('\n✅ 数据表功能测试完成')
    
  } catch (error) {
    console.error('❌ 测试失败:', error)
  }
}

// 运行测试
testTables()
