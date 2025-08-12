import React, { useState, useEffect } from 'react'
import { Table, Button, Space, Tag, Tooltip, Popconfirm, message } from 'antd'
import { 
  EditOutlined, 
  DeleteOutlined, 
  SyncOutlined, 
  CheckCircleOutlined,
  CloseCircleOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons'

interface DataSource {
  id: number
  name: string
  type: string
  host: string
  port: number
  databaseName: string
  status: string
  lastSyncTime: string
  createdBy: string
  createdAt: string
}

interface DataSourceListProps {
  onSync: (id: number) => void
  onEdit: (id: number) => void
  onDelete: (id: number) => void
  onTest: (id: number) => void
}

const DataSourceList: React.FC<DataSourceListProps> = ({
  onSync,
  onEdit,
  onDelete,
  onTest
}) => {
  const [loading, setLoading] = useState(false)
  const [dataSource, setDataSource] = useState<DataSource[]>([])

  // 模拟数据
  useEffect(() => {
    setDataSource([
      {
        id: 1,
        name: 'MySQL_Production',
        type: 'mysql',
        host: '192.168.1.100',
        port: 3306,
        databaseName: 'production_db',
        status: 'ACTIVE',
        lastSyncTime: '2024-01-15 10:30:00',
        createdBy: 'admin',
        createdAt: '2024-01-01 09:00:00'
      },
      {
        id: 2,
        name: 'PostgreSQL_Staging',
        type: 'postgresql',
        host: '192.168.1.101',
        port: 5432,
        databaseName: 'staging_db',
        status: 'ACTIVE',
        lastSyncTime: '2024-01-15 09:15:00',
        createdBy: 'admin',
        createdAt: '2024-01-02 14:30:00'
      },
      {
        id: 3,
        name: 'Hive_DataWarehouse',
        type: 'hive',
        host: '192.168.1.102',
        port: 10000,
        databaseName: 'data_warehouse',
        status: 'INACTIVE',
        lastSyncTime: '2024-01-14 16:45:00',
        createdBy: 'data_engineer',
        createdAt: '2024-01-03 11:20:00'
      }
    ])
  }, [])

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Tag color="success" icon={<CheckCircleOutlined />}>正常</Tag>
      case 'INACTIVE':
        return <Tag color="default" icon={<CloseCircleOutlined />}>停用</Tag>
      case 'ERROR':
        return <Tag color="error" icon={<CloseCircleOutlined />}>错误</Tag>
      default:
        return <Tag color="default" icon={<QuestionCircleOutlined />}>未知</Tag>
    }
  }

  const getTypeTag = (type: string) => {
    const typeMap: Record<string, { color: string; label: string }> = {
      mysql: { color: 'blue', label: 'MySQL' },
      postgresql: { color: 'green', label: 'PostgreSQL' },
      hive: { color: 'orange', label: 'Hive' },
      clickhouse: { color: 'purple', label: 'ClickHouse' }
    }
    
    const config = typeMap[type] || { color: 'default', label: type }
    return <Tag color={config.color}>{config.label}</Tag>
  }

  const columns = [
    {
      title: '数据源名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (text: string) => <strong>{text}</strong>
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string) => getTypeTag(type)
    },
    {
      title: '连接信息',
      key: 'connection',
      width: 200,
      render: (record: DataSource) => (
        <div>
          <div>{record.host}:{record.port}</div>
          <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
            {record.databaseName}
          </div>
        </div>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => getStatusTag(status)
    },
    {
      title: '最后同步时间',
      dataIndex: 'lastSyncTime',
      key: 'lastSyncTime',
      width: 160,
      render: (text: string) => (
        <span style={{ fontSize: '12px' }}>{text}</span>
      )
    },
    {
      title: '创建人',
      dataIndex: 'createdBy',
      key: 'createdBy',
      width: 100
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right' as const,
      render: (record: DataSource) => (
        <Space size="small">
          <Tooltip title="测试连接">
            <Button
              type="text"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => onTest(record.id)}
            />
          </Tooltip>
          <Tooltip title="同步">
            <Button
              type="text"
              size="small"
              icon={<SyncOutlined />}
              onClick={() => onSync(record.id)}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => onEdit(record.id)}
            />
          </Tooltip>
          <Popconfirm
            title="确定要删除这个数据源吗？"
            description="删除后无法恢复，请谨慎操作。"
            onConfirm={() => onDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除">
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <Table
      columns={columns}
      dataSource={dataSource}
      rowKey="id"
      loading={loading}
      scroll={{ x: 1200 }}
      pagination={{
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total, range) => 
          `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
        pageSize: 10,
        pageSizeOptions: ['10', '20', '50', '100']
      }}
    />
  )
}

export default DataSourceList

