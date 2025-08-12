import React, { useState } from 'react'
import { 
  Card, 
  Button, 
  Space, 
  Steps, 
  Form, 
  Select, 
  Table, 
  Checkbox, 
  Input, 
  message,
  Progress,
  Result,
  Divider
} from 'antd'
import { 
  ArrowLeftOutlined,
  DatabaseOutlined,
  TableOutlined,
  ImportOutlined,
  CheckCircleOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'

const { Option } = Select
const { Search } = Input

interface DataSource {
  id: number
  name: string
  type: string
  host: string
  port: number
  databaseName: string
  status: string
}

interface TableInfo {
  id: number
  tableName: string
  tableType: string
  rowCount: number
  sizeBytes: number
  lastSyncTime: string
  selected: boolean
}

const DDLImport: React.FC = () => {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedDataSource, setSelectedDataSource] = useState<DataSource | null>(null)
  const [selectedTables, setSelectedTables] = useState<TableInfo[]>([])
  const [importing, setImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [importResult, setImportResult] = useState<any>(null)

  // 模拟数据源列表
  const dataSources: DataSource[] = [
    {
      id: 1,
      name: 'MySQL_Production',
      type: 'mysql',
      host: '192.168.1.100',
      port: 3306,
      databaseName: 'production_db',
      status: 'ACTIVE'
    },
    {
      id: 2,
      name: 'PostgreSQL_Staging',
      type: 'postgresql',
      host: '192.168.1.101',
      port: 5432,
      databaseName: 'staging_db',
      status: 'ACTIVE'
    }
  ]

  // 模拟表列表
  const tables: TableInfo[] = [
    {
      id: 1,
      tableName: 'user_info',
      tableType: 'table',
      rowCount: 1000000,
      sizeBytes: 1024000,
      lastSyncTime: '2024-01-15 10:30:00',
      selected: false
    },
    {
      id: 2,
      tableName: 'order_master',
      tableType: 'table',
      rowCount: 500000,
      sizeBytes: 512000,
      lastSyncTime: '2024-01-15 09:15:00',
      selected: false
    },
    {
      id: 3,
      tableName: 'product_dim',
      tableType: 'table',
      rowCount: 50000,
      sizeBytes: 256000,
      lastSyncTime: '2024-01-14 16:45:00',
      selected: false
    }
  ]

  const steps = [
    {
      title: '选择数据源',
      description: '选择要导入的数据源连接'
    },
    {
      title: '选择表',
      description: '选择要导入的表'
    },
    {
      title: '导入配置',
      description: '配置导入选项'
    },
    {
      title: '执行导入',
      description: '执行DDL导入'
    }
  ]

  const handleDataSourceSelect = (dataSource: DataSource) => {
    setSelectedDataSource(dataSource)
    setCurrentStep(1)
  }

  const handleTableSelect = (tableId: number, selected: boolean) => {
    setSelectedTables(prev => 
      prev.map(table => 
        table.id === tableId ? { ...table, selected } : table
      )
    )
  }

  const handleSelectAll = (selected: boolean) => {
    setSelectedTables(tables.map(table => ({ ...table, selected })))
  }

  const handleNext = () => {
    if (currentStep === 1 && selectedTables.filter(t => t.selected).length === 0) {
      message.warning('请至少选择一张表')
      return
    }
    setCurrentStep(currentStep + 1)
  }

  const handlePrev = () => {
    setCurrentStep(currentStep - 1)
  }

  const handleImport = async () => {
    setImporting(true)
    setImportProgress(0)
    
    try {
      // 模拟导入过程
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 200))
        setImportProgress(i)
      }
      
      // 模拟导入结果
      setImportResult({
        success: true,
        totalTables: selectedTables.filter(t => t.selected).length,
        successTables: selectedTables.filter(t => t.selected).length,
        failedTables: 0,
        details: selectedTables.filter(t => t.selected).map(table => ({
          tableName: table.tableName,
          status: 'success',
          message: '导入成功'
        }))
      })
      
      message.success('DDL导入完成')
    } catch (error) {
      message.error('导入失败')
    } finally {
      setImporting(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <Card title="选择数据源连接">
            <div style={{ marginBottom: 16 }}>
              <p>请选择要导入DDL的数据源连接。如果没有配置数据源，请先到数据源管理页面添加。</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {dataSources.map(dataSource => (
                <Card
                  key={dataSource.id}
                  hoverable
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleDataSourceSelect(dataSource)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                    <DatabaseOutlined style={{ fontSize: 20, color: '#1890FF', marginRight: 8 }} />
                    <span style={{ fontWeight: 'bold' }}>{dataSource.name}</span>
                  </div>
                  <div style={{ color: '#8c8c8c', fontSize: '12px' }}>
                    <div>{dataSource.host}:{dataSource.port}</div>
                    <div>{dataSource.databaseName}</div>
                    <div>类型: {dataSource.type.toUpperCase()}</div>
                  </div>
                </Card>
              ))}
            </div>
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <Button 
                type="link" 
                onClick={() => navigate('/data-source')}
              >
                去数据源管理页面添加数据源
              </Button>
            </div>
          </Card>
        )
      
      case 1:
        return (
          <Card title="选择要导入的表">
            <div style={{ marginBottom: 16 }}>
              <Space>
                <span>已选择数据源: {selectedDataSource?.name}</span>
                <Button 
                  size="small" 
                  onClick={() => setCurrentStep(0)}
                >
                  重新选择
                </Button>
              </Space>
            </div>
            <div style={{ marginBottom: 16 }}>
              <Space>
                <Checkbox
                  onChange={(e) => handleSelectAll(e.target.checked)}
                >
                  全选
                </Checkbox>
                <span>已选择 {selectedTables.filter(t => t.selected).length} 张表</span>
              </Space>
            </div>
            <Table
              dataSource={tables}
              rowKey="id"
              pagination={false}
              size="small"
              columns={[
                {
                  title: '选择',
                  dataIndex: 'selected',
                  key: 'selected',
                  width: 60,
                  render: (selected: boolean, record: TableInfo) => (
                    <Checkbox
                      checked={selected}
                      onChange={(e) => handleTableSelect(record.id, e.target.checked)}
                    />
                  )
                },
                {
                  title: '表名',
                  dataIndex: 'tableName',
                  key: 'tableName',
                  render: (text: string) => <strong>{text}</strong>
                },
                {
                  title: '类型',
                  dataIndex: 'tableType',
                  key: 'tableType',
                  width: 80
                },
                {
                  title: '行数',
                  dataIndex: 'rowCount',
                  key: 'rowCount',
                  width: 100,
                  render: (count: number) => count.toLocaleString()
                },
                {
                  title: '大小',
                  dataIndex: 'sizeBytes',
                  key: 'sizeBytes',
                  width: 100,
                  render: (bytes: number) => `${(bytes / 1024).toFixed(1)} KB`
                },
                {
                  title: '最后同步',
                  dataIndex: 'lastSyncTime',
                  key: 'lastSyncTime',
                  width: 150,
                  render: (text: string) => (
                    <span style={{ fontSize: '12px' }}>{text}</span>
                  )
                }
              ]}
            />
          </Card>
        )
      
      case 2:
        return (
          <Card title="导入配置">
            <div style={{ marginBottom: 16 }}>
              <p>即将导入 {selectedTables.filter(t => t.selected).length} 张表，请确认导入配置。</p>
            </div>
            <Form layout="vertical">
              <Form.Item label="导入模式">
                <Select defaultValue="create_new">
                  <Option value="create_new">创建新模型</Option>
                  <Option value="update_existing">更新现有模型</Option>
                  <Option value="skip_existing">跳过已存在的模型</Option>
                </Select>
              </Form.Item>
              <Form.Item label="默认分层">
                <Select defaultValue="DWD">
                  <Option value="ODS">ODS - 原始数据层</Option>
                  <Option value="DWD">DWD - 明细数据层</Option>
                  <Option value="DIM">DIM - 维度数据层</Option>
                  <Option value="DWS">DWS - 汇总数据层</Option>
                  <Option value="ADS">ADS - 应用数据层</Option>
                </Select>
              </Form.Item>
              <Form.Item label="默认主题域">
                <Select mode="multiple" placeholder="选择主题域">
                  <Option value="用户域">用户域</Option>
                  <Option value="订单域">订单域</Option>
                  <Option value="商品域">商品域</Option>
                  <Option value="营销域">营销域</Option>
                  <Option value="财务域">财务域</Option>
                </Select>
              </Form.Item>
            </Form>
          </Card>
        )
      
      case 3:
        return (
          <Card title="执行导入">
            {!importing && !importResult ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <p>确认开始导入吗？</p>
                <Space>
                  <Button onClick={handlePrev}>上一步</Button>
                  <Button type="primary" onClick={handleImport}>
                    开始导入
                  </Button>
                </Space>
              </div>
            ) : importing ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Progress type="circle" percent={importProgress} />
                <p style={{ marginTop: 16 }}>正在导入DDL，请稍候...</p>
              </div>
            ) : (
              <Result
                status={importResult.success ? 'success' : 'error'}
                title={importResult.success ? '导入完成' : '导入失败'}
                subTitle={`成功导入 ${importResult.successTables} 张表，失败 ${importResult.failedTables} 张表`}
                extra={[
                  <Button key="view" type="primary" onClick={() => navigate('/model')}>
                    查看导入结果
                  </Button>,
                  <Button key="import" onClick={() => setCurrentStep(0)}>
                    继续导入
                  </Button>
                ]}
              />
            )}
          </Card>
        )
      
      default:
        return null
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/model')}
        >
          返回模型管理
        </Button>
      </div>

      <Card>
        <Steps current={currentStep} items={steps} style={{ marginBottom: 24 }} />
        {renderStepContent()}
        
        {currentStep < 3 && currentStep > 0 && (
          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <Space>
              <Button onClick={handlePrev}>上一步</Button>
              <Button type="primary" onClick={handleNext}>
                下一步
              </Button>
            </Space>
          </div>
        )}
      </Card>
    </div>
  )
}

export default DDLImport

