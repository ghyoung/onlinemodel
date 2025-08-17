import React, { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Button,
  Space,
  Input,
  Select,
  Tag,
  message,
  Tooltip,
  Modal,
  Descriptions,
  Spin,
  Empty,
  Typography,
  Divider,
  Row,
  Col,
  Statistic
} from 'antd'
import {
  SyncOutlined,
  EyeOutlined,
  SearchOutlined,
  ReloadOutlined,
  TableOutlined,
  DatabaseOutlined,
  KeyOutlined
} from '@ant-design/icons'
import api from '@/config/api'

const { Option } = Select
const { Text } = Typography

// 数据表状态
const TABLE_STATUS = {
  active: { text: '活跃', color: 'green' },
  inactive: { text: '未激活', color: 'default' },
  deleted: { text: '已删除', color: 'red' }
}

interface DataTable {
  id: number
  tableName: string
  schemaName: string
  description: string
  status: string
  columnCount: number
  primaryKeyCount: number
  createdAt: string
  updatedAt: string
}

interface DataSource {
  id: number
  name: string
}

interface TableColumns {
  id: number
  columnName: string
  dataType: string
  isNullable: boolean
  isPrimaryKey: boolean
  defaultValue: string
  description: string
  status: string
}

interface DataSourceTablesProps {
  dataSourceId: number
  dataSourceName: string
  onRefresh?: () => void
}

const DataSourceTables: React.FC<DataSourceTablesProps> = ({
  dataSourceId,
  dataSourceName,
  onRefresh
}) => {
  const [tables, setTables] = useState<DataTable[]>([])
  const [loading, setLoading] = useState(false)
  const [syncLoading, setSyncLoading] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  })
  const [columnsModalVisible, setColumnsModalVisible] = useState(false)
  const [selectedTable, setSelectedTable] = useState<DataTable | null>(null)
  const [tableColumns, setTableColumns] = useState<TableColumns[]>([])
  const [columnsLoading, setColumnsLoading] = useState(false)

  // 获取数据表列表
  const fetchTables = async (page = 1, pageSize = 10) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString()
      })
      
      if (searchText) {
        params.append('search', searchText)
      }
      
      if (statusFilter) {
        params.append('status', statusFilter)
      }
      
      const response = await api.get(`/data-sources/${dataSourceId}/tables?${params}`)
      
      if (response.data.success) {
        setTables(response.data.data.tables)
        setPagination({
          current: response.data.data.pagination.page,
          pageSize: response.data.data.pagination.limit,
          total: response.data.data.pagination.total
        })
      } else {
        message.warning('获取数据表列表失败: ' + (response.data.message || '未知错误'))
      }
    } catch (error: any) {
      console.error('获取数据表列表失败:', error)
      message.error('获取数据表列表失败: ' + (error.response?.data?.message || error.message || '未知错误'))
    } finally {
      setLoading(false)
    }
  }

  // 同步表结构
  const handleSyncTables = async () => {
    setSyncLoading(true)
    try {
      const response = await api.post(`/data-sources/${dataSourceId}/sync-tables`)
      
      if (response.data.success) {
        message.success('表结构同步完成')
        const result = response.data.data
        message.info(`同步结果: 总表数 ${result.totalTables}, 新增 ${result.newTables}, 更新 ${result.updatedTables}`)
        
        // 刷新数据
        fetchTables(pagination.current, pagination.pageSize)
        if (onRefresh) {
          onRefresh()
        }
      } else {
        message.warning('同步失败: ' + (response.data.message || '未知错误'))
      }
    } catch (error: any) {
      console.error('同步表结构失败:', error)
      message.error('同步失败: ' + (error.response?.data?.message || error.message || '未知错误'))
    } finally {
      setSyncLoading(false)
    }
  }

  // 查看表字段
  const handleViewColumns = async (table: DataTable) => {
    setSelectedTable(table)
    setColumnsModalVisible(true)
    setColumnsLoading(true)
    
    try {
      const response = await api.get(`/data-sources/${dataSourceId}/tables/${table.id}/columns`)
      
      if (response.data.success) {
        setTableColumns(response.data.data.columns)
      } else {
        message.warning('获取表字段失败: ' + (response.data.message || '未知错误'))
      }
    } catch (error: any) {
      console.error('获取表字段失败:', error)
      message.error('获取表字段失败: ' + (error.response?.data?.message || error.message || '未知错误'))
    } finally {
      setColumnsLoading(false)
    }
  }

  // 处理搜索
  const handleSearch = () => {
    setPagination(prev => ({ ...prev, current: 1 }))
    fetchTables(1, pagination.pageSize)
  }

  // 处理分页变化
  const handleTableChange = (pagination: any) => {
    fetchTables(pagination.current, pagination.pageSize)
  }

  // 初始化加载
  useEffect(() => {
    if (dataSourceId) {
      fetchTables()
    }
  }, [dataSourceId])

  // 表格列定义
  const columns = [
    {
      title: '表名',
      dataIndex: 'tableName',
      key: 'tableName',
      render: (text: string, record: DataTable) => (
        <Space>
          <TableOutlined />
          <span>{text}</span>
          {record.schemaName && (
            <Tag color="blue" size="small">{record.schemaName}</Tag>
          )}
        </Space>
      )
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      render: (text: string) => (
        <Text ellipsis={{ tooltip: text }}>
          {text || '-'}
        </Text>
      )
    },
    {
      title: '字段数',
      dataIndex: 'columnCount',
      key: 'columnCount',
      render: (count: number) => (
        <Tag color="blue" icon={<DatabaseOutlined />}>
          {count}
        </Tag>
      )
    },
    {
      title: '主键数',
      dataIndex: 'primaryKeyCount',
      key: 'primaryKeyCount',
      render: (count: number) => (
        <Tag color="green" icon={<KeyOutlined />}>
          {count}
        </Tag>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusInfo = TABLE_STATUS[status as keyof typeof TABLE_STATUS]
        return (
          <Tag color={statusInfo?.color}>
            {statusInfo?.text || status}
          </Tag>
        )
      }
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (date: string) => (
        <span>{new Date(date).toLocaleString()}</span>
      )
    },
    {
      title: '操作',
      key: 'actions',
      render: (record: DataTable) => (
        <Space size="small">
          <Tooltip title="查看字段">
            <Button
              type="text"
              icon={<EyeOutlined />}
              size="small"
              onClick={() => handleViewColumns(record)}
            />
          </Tooltip>
        </Space>
      )
    }
  ]

  return (
    <div>
      {/* 统计信息 */}
      <Row gutter={16} style={{ marginBottom: '16px' }}>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="总表数"
              value={pagination.total}
              prefix={<TableOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="活跃表"
              value={tables.filter(t => t.status === 'active').length}
              prefix={<TableOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="总字段数"
              value={tables.reduce((sum, t) => sum + t.columnCount, 0)}
              prefix={<DatabaseOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="总主键数"
              value={tables.reduce((sum, t) => sum + t.primaryKeyCount, 0)}
              prefix={<KeyOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 操作栏 */}
      <Card
        size="small"
        style={{ marginBottom: '16px' }}
        bodyStyle={{ padding: '12px 16px' }}
      >
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Space>
              <Input
                placeholder="搜索表名、模式名或描述"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onPressEnter={handleSearch}
                style={{ width: 300 }}
                prefix={<SearchOutlined />}
              />
              <Select
                placeholder="状态筛选"
                value={statusFilter}
                onChange={setStatusFilter}
                allowClear
                style={{ width: 120 }}
              >
                <Option value="active">活跃</Option>
                <Option value="inactive">未激活</Option>
              </Select>
              <Button onClick={handleSearch}>搜索</Button>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => fetchTables(pagination.current, pagination.pageSize)}
                loading={loading}
              >
                刷新
              </Button>
              <Button
                type="primary"
                icon={<SyncOutlined />}
                onClick={handleSyncTables}
                loading={syncLoading}
              >
                同步表结构
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 数据表列表 */}
      <Card size="small">
        <Table
          columns={columns}
          dataSource={tables}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            position: ['bottomCenter']
          }}
          onChange={handleTableChange}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="暂无数据表"
              />
            )
          }}
        />
      </Card>

      {/* 表字段详情模态框 */}
      <Modal
        title={
          <Space>
            <TableOutlined />
            {selectedTable?.tableName}
            {selectedTable?.schemaName && (
              <Tag color="blue" size="small">{selectedTable.schemaName}</Tag>
            )}
          </Space>
        }
        open={columnsModalVisible}
        onCancel={() => setColumnsModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedTable && (
          <div>
            <Descriptions size="small" column={2} style={{ marginBottom: '16px' }}>
              <Descriptions.Item label="表名">{selectedTable.tableName}</Descriptions.Item>
              <Descriptions.Item label="模式名">{selectedTable.schemaName || '-'}</Descriptions.Item>
              <Descriptions.Item label="描述">{selectedTable.description || '-'}</Descriptions.Item>
              <Descriptions.Item label="字段数">{selectedTable.columnCount}</Descriptions.Item>
              <Descriptions.Item label="主键数">{selectedTable.primaryKeyCount}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={TABLE_STATUS[selectedTable.status as keyof typeof TABLE_STATUS]?.color}>
                  {TABLE_STATUS[selectedTable.status as keyof typeof TABLE_STATUS]?.text}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
            
            <Divider>字段信息</Divider>
            
            {columnsLoading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <Spin size="large" />
              </div>
            ) : (
              <Table
                columns={[
                  {
                    title: '字段名',
                    dataIndex: 'columnName',
                    key: 'columnName',
                    render: (text: string, record: TableColumns) => (
                      <Space>
                        {record.isPrimaryKey && <KeyOutlined style={{ color: '#52c41a' }} />}
                        <span>{text}</span>
                      </Space>
                    )
                  },
                  {
                    title: '数据类型',
                    dataIndex: 'dataType',
                    key: 'dataType',
                    render: (text: string) => <Tag color="blue">{text}</Tag>
                  },
                  {
                    title: '可空',
                    dataIndex: 'isNullable',
                    key: 'isNullable',
                    render: (value: boolean) => (
                      <Tag color={value ? 'orange' : 'green'}>
                        {value ? '是' : '否'}
                      </Tag>
                    )
                  },
                  {
                    title: '主键',
                    dataIndex: 'isPrimaryKey',
                    key: 'isPrimaryKey',
                    render: (value: boolean) => (
                      value ? <Tag color="green">是</Tag> : '-'
                    )
                  },
                  {
                    title: '默认值',
                    dataIndex: 'defaultValue',
                    key: 'defaultValue',
                    render: (text: string) => text || '-'
                  },
                  {
                    title: '描述',
                    dataIndex: 'description',
                    key: 'description',
                    render: (text: string) => text || '-'
                  }
                ]}
                dataSource={tableColumns}
                rowKey="id"
                size="small"
                pagination={false}
                scroll={{ y: 300 }}
              />
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default DataSourceTables
