import React, { useState } from 'react'
import { Card, Button, Space, Input, Select, Table, Tag, Tooltip, message } from 'antd'
import { 
  PlusOutlined, 
  ImportOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined,
  ExportOutlined,
  SearchOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'

const { Search } = Input
const { Option } = Select

interface DataModel {
  id: number
  tableNameEn: string
  tableNameZh: string
  overview: string
  layer: string
  domains: string[]
  status: string
  fieldCount: number
  rowCount: number
  updatedAt: string
  updatedBy: string
}

const ModelManagement: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [selectedLayer, setSelectedLayer] = useState<string>('')
  const [selectedDomains, setSelectedDomains] = useState<string[]>([])

  // 模拟数据
  const models: DataModel[] = [
    {
      id: 1,
      tableNameEn: 'user_profile_dwd',
      tableNameZh: '用户画像明细表',
      overview: '用户基础信息和行为数据的明细表',
      layer: 'DWD',
      domains: ['用户域'],
      status: 'published',
      fieldCount: 25,
      rowCount: 1000000,
      updatedAt: '2024-01-15 14:30:00',
      updatedBy: '张三'
    },
    {
      id: 2,
      tableNameEn: 'order_master_dwd',
      tableNameZh: '订单主表明细',
      overview: '订单基础信息和状态变更的明细表',
      layer: 'DWD',
      domains: ['订单域'],
      status: 'published',
      fieldCount: 30,
      rowCount: 500000,
      updatedAt: '2024-01-15 10:15:00',
      updatedBy: '李四'
    },
    {
      id: 3,
      tableNameEn: 'product_dim',
      tableNameZh: '商品维度表',
      overview: '商品基础信息和分类的维度表',
      layer: 'DIM',
      domains: ['商品域'],
      status: 'draft',
      fieldCount: 18,
      rowCount: 50000,
      updatedAt: '2024-01-14 16:45:00',
      updatedBy: '王五'
    }
  ]

  // 分层选项
  const layerOptions = [
    { value: 'ODS', label: 'ODS - 原始数据层' },
    { value: 'DWD', label: 'DWD - 明细数据层' },
    { value: 'DIM', label: 'DIM - 维度数据层' },
    { value: 'DWS', label: 'DWS - 汇总数据层' },
    { value: 'ADS', label: 'ADS - 应用数据层' }
  ]

  // 主题域选项
  const domainOptions = [
    { value: '用户域', label: '用户域' },
    { value: '订单域', label: '订单域' },
    { value: '商品域', label: '商品域' },
    { value: '营销域', label: '营销域' },
    { value: '财务域', label: '财务域' }
  ]

  // 状态选项
  const statusOptions = [
    { value: 'draft', label: '草稿' },
    { value: 'published', label: '已发布' },
    { value: 'archived', label: '已归档' }
  ]

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'published':
        return <Tag color="success">已发布</Tag>
      case 'draft':
        return <Tag color="processing">草稿</Tag>
      case 'archived':
        return <Tag color="default">已归档</Tag>
      default:
        return <Tag color="default">未知</Tag>
    }
  }

  const getLayerTag = (layer: string) => {
    const layerMap: Record<string, { color: string; label: string }> = {
      'ODS': { color: 'red', label: 'ODS' },
      'DWD': { color: 'blue', label: 'DWD' },
      'DIM': { color: 'green', label: 'DIM' },
      'DWS': { color: 'orange', label: 'DWS' },
      'ADS': { color: 'purple', label: 'ADS' }
    }
    
    const config = layerMap[layer] || { color: 'default', label: layer }
    return <Tag color={config.color}>{config.label}</Tag>
  }

  const columns = [
    {
      title: '英文表名',
      dataIndex: 'tableNameEn',
      key: 'tableNameEn',
      width: 200,
      render: (text: string, record: DataModel) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{text}</div>
          <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
            {record.tableNameZh}
          </div>
        </div>
      )
    },
    {
      title: '概述',
      dataIndex: 'overview',
      key: 'overview',
      width: 250,
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text}>
          <span>{text}</span>
        </Tooltip>
      )
    },
    {
      title: '分层',
      dataIndex: 'layer',
      key: 'layer',
      width: 100,
      render: (layer: string) => getLayerTag(layer)
    },
    {
      title: '主题域',
      dataIndex: 'domains',
      key: 'domains',
      width: 150,
      render: (domains: string[]) => (
        <div>
          {domains.map(domain => (
            <Tag key={domain} color="blue" style={{ marginBottom: 4 }}>
              {domain}
            </Tag>
          ))}
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
      title: '统计信息',
      key: 'stats',
      width: 150,
      render: (record: DataModel) => (
        <div>
          <div>字段: {record.fieldCount}</div>
          <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
            行数: {record.rowCount.toLocaleString()}
          </div>
        </div>
      )
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 160,
      render: (text: string) => (
        <span style={{ fontSize: '12px' }}>{text}</span>
      )
    },
    {
      title: '更新人',
      dataIndex: 'updatedBy',
      key: 'updatedBy',
      width: 100
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right' as const,
      render: (record: DataModel) => (
        <Space size="small">
          <Tooltip title="查看">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/modeling?id=${record.id}`)}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => navigate(`/modeling?id=${record.id}&mode=edit`)}
            />
          </Tooltip>
          <Tooltip title="导出">
            <Button
              type="text"
              size="small"
              icon={<ExportOutlined />}
              onClick={() => console.log('导出模型:', record.id)}
            />
          </Tooltip>
          <Tooltip title="删除">
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => console.log('删除模型:', record.id)}
            />
          </Tooltip>
        </Space>
      )
    }
  ]

  const handleSearch = (value: string) => {
    setSearchText(value)
    // TODO: 实现搜索逻辑
  }

  const handleNewModel = () => {
    navigate('/modeling?mode=new')
  }

  const handleImportDDL = () => {
    navigate('/ddl-import')
  }

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 16
      }}>
        <h1>模型管理</h1>
        <Space>
          <Button
            icon={<ImportOutlined />}
            onClick={handleImportDDL}
          >
            导入DDL
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleNewModel}
          >
            新建模型
          </Button>
        </Space>
      </div>

      {/* 搜索和筛选 */}
      <Card style={{ marginBottom: 16 }}>
        <Space wrap style={{ width: '100%' }}>
          <Search
            placeholder="搜索模型名称、概述..."
            style={{ width: 300 }}
            onSearch={handleSearch}
            enterButton={<SearchOutlined />}
          />
          <Select
            placeholder="选择分层"
            style={{ width: 150 }}
            allowClear
            value={selectedLayer}
            onChange={setSelectedLayer}
          >
            {layerOptions.map(option => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
          <Select
            mode="multiple"
            placeholder="选择主题域"
            style={{ width: 200 }}
            allowClear
            value={selectedDomains}
            onChange={setSelectedDomains}
          >
            {domainOptions.map(option => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
        </Space>
      </Card>

      {/* 模型列表 */}
      <Table
        columns={columns}
        dataSource={models}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1400 }}
        pagination={{
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => 
            `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
          pageSize: 10,
          pageSizeOptions: ['10', '20', '50', '100']
        }}
      />
    </div>
  )
}

export default ModelManagement

