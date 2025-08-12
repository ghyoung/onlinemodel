import React, { useState } from 'react'
import { Tabs, Card, Button, Space, message } from 'antd'
import { PlusOutlined, SyncOutlined, SettingOutlined } from '@ant-design/icons'
import DataSourceList from '@/components/DataSourceList'
import DataTableList from '@/components/DataTableList'
import AddDataSourceModal from '@/components/AddDataSourceModal'

const { TabPane } = Tabs

const DataSourceManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('connections')
  const [addModalVisible, setAddModalVisible] = useState(false)
  const [loading, setLoading] = useState(false)

  // 处理添加数据源
  const handleAddDataSource = async (values: any) => {
    setLoading(true)
    try {
      // TODO: 调用添加数据源API
      console.log('添加数据源:', values)
      message.success('数据源添加成功')
      setAddModalVisible(false)
      // 刷新数据源列表
    } catch (error) {
      message.error('数据源添加失败')
    } finally {
      setLoading(false)
    }
  }

  // 处理数据源同步
  const handleSyncDataSource = async (id: number) => {
    try {
      // TODO: 调用同步数据源API
      console.log('同步数据源:', id)
      message.success('数据源同步成功')
      // 刷新数据源列表
    } catch (error) {
      message.error('数据源同步失败')
    }
  }

  // 处理表结构同步
  const handleSyncTableStructure = async (connectionId: number) => {
    try {
      // TODO: 调用同步表结构API
      console.log('同步表结构:', connectionId)
      message.success('表结构同步成功')
      // 刷新表列表
    } catch (error) {
      message.error('表结构同步失败')
    }
  }

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 16
      }}>
        <h1>数据源管理</h1>
        <Space>
          <Button
            icon={<SyncOutlined />}
            onClick={() => {
              if (activeTab === 'connections') {
                // 同步所有数据源
                message.info('开始同步所有数据源...')
              } else {
                // 同步所有表结构
                message.info('开始同步所有表结构...')
              }
            }}
          >
            批量同步
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setAddModalVisible(true)}
          >
            添加数据源
          </Button>
        </Space>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="数据源管理列表" key="connections">
          <DataSourceList
            onSync={handleSyncDataSource}
            onEdit={(id) => console.log('编辑数据源:', id)}
            onDelete={(id) => console.log('删除数据源:', id)}
            onTest={(id) => console.log('测试连接:', id)}
          />
        </TabPane>
        
        <TabPane tab="数据表列表" key="tables">
          <DataTableList
            onSync={handleSyncTableStructure}
            onViewStructure={(tableId) => console.log('查看表结构:', tableId)}
            onExport={(tableId) => console.log('导出表结构:', tableId)}
          />
        </TabPane>
      </Tabs>

      <AddDataSourceModal
        visible={addModalVisible}
        loading={loading}
        onCancel={() => setAddModalVisible(false)}
        onSubmit={handleAddDataSource}
      />
    </div>
  )
}

export default DataSourceManagement

