import { getDatabase } from './src/database/init.js'

async function testSyncTables() {
  try {
    const db = getDatabase()
    
    console.log('🔍 测试表结构同步功能...')
    
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
    
    // 测试同步前的表数量
    console.log(`\n2. 同步前检查数据源 ${firstDataSource.name} 下的数据表:`)
    const beforeSyncResult = await db.query(
      'SELECT COUNT(*) as count FROM tables WHERE data_source_id = $1 AND status != $2',
      [firstDataSource.id, 'deleted']
    )
    const beforeCount = parseInt(beforeSyncResult.rows[0].count)
    console.log('同步前表数量:', beforeCount)
    
    // 如果已有表，先删除它们来测试同步功能
    if (beforeCount > 0) {
      console.log('🗑️ 删除现有表以测试同步功能...')
      
      // 先删除字段
      await db.query(
        'DELETE FROM columns WHERE table_id IN (SELECT id FROM tables WHERE data_source_id = $1)',
        [firstDataSource.id]
      )
      
      // 再删除表
      await db.query(
        'DELETE FROM tables WHERE data_source_id = $1',
        [firstDataSource.id]
      )
      
      console.log('✅ 现有表删除完成')
    }
    
    // 测试同步后的表数量
    console.log(`\n3. 同步后检查数据源 ${firstDataSource.name} 下的数据表:`)
    const afterSyncResult = await db.query(
      'SELECT COUNT(*) as count FROM tables WHERE data_source_id = $1 AND status != $2',
      [firstDataSource.id, 'deleted']
    )
    const afterCount = parseInt(afterSyncResult.rows[0].count)
    console.log('同步后表数量:', afterCount)
    
    if (afterCount > 0) {
      console.log('\n4. 查看同步后的表详情:')
      const tablesResult = await db.query(
        `SELECT t.*, 
                (SELECT COUNT(*) FROM columns c WHERE c.table_id = t.id AND c.status = 'active') as column_count,
                (SELECT COUNT(*) FROM columns c WHERE c.table_id = t.id AND c.status = 'active' AND c.is_primary_key = true) as primary_key_count
         FROM tables t 
         WHERE t.data_source_id = $1 AND t.status = 'active'
         ORDER BY t.schema_name NULLS LAST, t.table_name`,
        [firstDataSource.id]
      )
      
      tablesResult.rows.forEach(table => {
        console.log(`  - ${table.table_name} (${table.schema_name || 'default'}) - 字段数: ${table.column_count}, 主键数: ${table.primary_key_count}`)
      })
      
      // 查看第一个表的字段详情
      if (tablesResult.rows.length > 0) {
        const firstTable = tablesResult.rows[0]
        console.log(`\n5. 查看表 ${firstTable.table_name} 的字段信息:`)
        
        const columnsResult = await db.query(
          `SELECT * FROM columns 
           WHERE table_id = $1 AND status = 'active' 
           ORDER BY id, column_name`,
          [firstTable.id]
        )
        
        columnsResult.rows.forEach(column => {
          console.log(`  - ${column.column_name}: ${column.data_type} ${column.is_nullable ? 'NULL' : 'NOT NULL'} ${column.is_primary_key ? 'PRIMARY KEY' : ''}`)
        })
      }
    } else {
      console.log('❌ 同步后仍然没有表，同步功能可能有问题')
    }
    
    console.log('\n✅ 表结构同步功能测试完成')
    
  } catch (error) {
    console.error('❌ 测试失败:', error)
  }
}

// 运行测试
testSyncTables()
