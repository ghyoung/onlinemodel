import React, { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  Tag,
  message,
  Popconfirm,
  Tooltip,
  InputNumber,
  Divider,
  Row,
  Col,
  Statistic
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  ReloadOutlined,
  DatabaseOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  SyncOutlined
} from '@ant-design/icons'
import axios from 'axios'
import { getApiUrl } from '@/config/env'

const { Option } = Select
const { TextArea } = Input

// 数据源类型
const DATA_SOURCE_TYPES = [
  { value: 'MYSQL', label: 'MySQL', icon: '🐬' },
  { value: 'POSTGRESQL', label: 'PostgreSQL', icon: '🐘' },
  { value: 'HIVE', label: 'Hive', icon: '🐝' },
  { value: 'CLICKHOUSE', label: 'ClickHouse', icon: '🦘' },
  { value: 'ORACLE', label: 'Oracle', icon: '🗿' },
  { value: 'SQLSERVER', label: 'SQL Server', icon: '🪟' },
  { value: 'DB2', label: 'DB2', icon: '🔵' },
  { value: 'SNOWFLAKE', label: 'Snowflake', icon: '❄️' }
]

// 数据源状态
const DATA_SOURCE_STATUS = {
  ACTIVE: { text: '活跃', color: 'green' },
  INACTIVE: { text: '未激活', color: 'default' },
  CONNECTING: { text: '连接中', color: 'processing' },
  CONNECTED: { text: '已连接', color: 'success' },
  ERROR: { text: '连接错误', color: 'error' },
  TESTING: { text: '测试中', color: 'processing' }
}

interface DataSource {
  id: number
  name: string
  description?: string
  type: string
  host: string
  port: number
  database: string
  username: string
  status: string
  isEnabled: boolean
  lastTestAt: string
  lastSyncAt: string
  createdAt: string
  createdBy?: {
    username: string
    realName?: string
  }
}

interface DataSourceFormData {
  name: string
  description: string
  type: string
  host: string
  port: number
  database: string
  username: string
  password: string
  connectionParams: string
}

const DataSourceManagement: React.FC = () => {
  const [dataSources, setDataSources] = useState<DataSource[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingDataSource, setEditingDataSource] = useState<DataSource | null>(null)
  const [form] = Form.useForm()
  const [stats, setStats] = useState<any>({})

  // 获取数据源列表
  const fetchDataSources = async () => {
    setLoading(true)
    try {
      const response = await axios.get(getApiUrl('/data-sources'))
      if (response.data.success) {
        setDataSources(response.data.data)
      }
    } catch (error) {
      message.error('获取数据源列表失败')
      console.error('获取数据源列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 获取统计信息
  const fetchStats = async () => {
    try {
      const response = await axios.get(getApiUrl('/data-sources/stats'))
      if (response.data.success) {
        setStats(response.data.data)
      }
    } catch (error) {
      console.error('获取统计信息失败:', error)
    }
  }

  useEffect(() => {
    fetchDataSources()
    fetchStats()
  }, [])

  // 显示创建/编辑模态框
  const showModal = (dataSource?: DataSource) => {
    if (dataSource) {
      setEditingDataSource(dataSource)
      form.setFieldsValue({
        name: dataSource.name,
        description: dataSource.description,
        type: dataSource.type,
        host: dataSource.host,
        port: dataSource.port,
        database: dataSource.database,
        username: dataSource.username,
        password: '', // 编辑时不显示密码
        connectionParams: ''
      })
    } else {
      setEditingDataSource(null)
      form.resetFields()
    }
    setModalVisible(true)
  }

  // 隐藏模态框
  const hideModal = () => {
    setModalVisible(false)
    setEditingDataSource(null)
    form.resetFields()
  }

  // 提交表单
  const handleSubmit = async (values: DataSourceFormData) => {
    try {
      if (editingDataSource) {
        // 更新数据源
        await axios.put(getApiUrl(`/data-sources/${editingDataSource.id}`), values)
        message.success('数据源更新成功')
      } else {
        // 创建数据源
        await axios.post(getApiUrl('/data-sources'), {
          ...values,
          createdBy: 1 // TODO: 从认证状态获取用户ID
        })
        message.success('数据源创建成功')
      }
      hideModal()
      fetchDataSources()
      fetchStats()
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || '操作失败'
      message.error(errorMessage)
    }
  }

  // 删除数据源
  const handleDelete = async (id: number) => {
    try {
      await axios.delete(getApiUrl(`/data-sources/${id}`))
      message.success('数据源删除成功')
      fetchDataSources()
      fetchStats()
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || '删除失败'
      message.error(errorMessage)
    }
  }

  // 测试连接
  const handleTestConnection = async (id: number) => {
    try {
      await axios.post(getApiUrl(`/data-sources/${id}/test`))
      message.success('连接测试成功')
      fetchDataSources()
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || '连接测试失败'
      message.error(errorMessage)
    }
  }

  // 切换启用状态
  const handleToggleStatus = async (id: number, enabled: boolean) => {
    try {
      await axios.put(`http://localhost:8080/api/data-sources/${id}/toggle?enabled=${enabled}`)
      message.success(`数据源已${enabled ? '启用' : '禁用'}`)
      fetchDataSources()
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || '操作失败'
      message.error(errorMessage)
    }
  }

  // 表格列定义
  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: DataSource) => (
        <Space>
          <DatabaseOutlined />
          <span>{text}</span>
          {record.isEnabled ? (
            <Tag color="green">启用</Tag>
          ) : (
            <Tag color="red">禁用</Tag>
          )}
        </Space>
      )
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const typeInfo = DATA_SOURCE_TYPES.find(t => t.value === type)
        return (
          <Tag color="blue">
            {typeInfo?.icon} {typeInfo?.label || type}
          </Tag>
        )
      }
    },
    {
      title: '连接信息',
      key: 'connection',
      render: (record: DataSource) => (
        <div>
          <div>{record.host}:{record.port}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.database} / {record.username}
          </div>
        </div>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusInfo = DATA_SOURCE_STATUS[status as keyof typeof DATA_SOURCE_STATUS]
        return (
          <Tag color={statusInfo?.color}>
            {statusInfo?.text || status}
          </Tag>
        )
      }
    },
    {
      title: '最后测试',
      dataIndex: 'lastTestAt',
      key: 'lastTestAt',
      render: (date: string) => (
        <span>{new Date(date).toLocaleString()}</span>
      )
    },
    {
      title: '创建者',
      dataIndex: 'createdBy',
      key: 'createdBy',
      render: (creator: any) => (
        <span>{creator?.realName || creator?.username || '-'}</span>
      )
    },
    {
      title: '操作',
      key: 'actions',
      render: (record: DataSource) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button
              type="text"
              icon={<EyeOutlined />}
              size="small"
              onClick={() => showModal(record)}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button
              type="text"
              icon={<EditOutlined />}
              size="small"
              onClick={() => showModal(record)}
            />
          </Tooltip>
          <Tooltip title="测试连接">
            <Button
              type="text"
              icon={<SyncOutlined />}
              size="small"
              onClick={() => handleTestConnection(record.id)}
            />
          </Tooltip>
          <Tooltip title={record.isEnabled ? '禁用' : '启用'}>
            <Switch
              size="small"
              checked={record.isEnabled}
              onChange={(checked) => handleToggleStatus(record.id, checked)}
            />
          </Tooltip>
          <Popconfirm
            title="确定要删除这个数据源吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除">
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                size="small"
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div style={{ padding: '24px' }}>
      {/* 统计信息 */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总数据源"
              value={dataSources.length}
              prefix={<DatabaseOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已连接"
              value={dataSources.filter(ds => ds.status === 'CONNECTED').length}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="连接错误"
              value={dataSources.filter(ds => ds.status === 'ERROR').length}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="启用中"
              value={dataSources.filter(ds => ds.isEnabled).length}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 数据源列表 */}
      <Card
        title="数据源管理"
        extra={
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                fetchDataSources()
                fetchStats()
              }}
            >
              刷新
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => showModal()}
            >
              新建数据源
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={dataSources}
          rowKey="id"
          loading={loading}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
        />
      </Card>

      {/* 创建/编辑模态框 */}
      <Modal
        title={editingDataSource ? '编辑数据源' : '新建数据源'}
        open={modalVisible}
        onCancel={hideModal}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            port: 3306,
            connectionParams: ''
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="数据源名称"
                rules={[
                  { required: true, message: '请输入数据源名称' },
                  { max: 100, message: '名称不能超过100个字符' }
                ]}
              >
                <Input placeholder="请输入数据源名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="type"
                label="数据源类型"
                rules={[{ required: true, message: '请选择数据源类型' }]}
              >
                <Select placeholder="请选择数据源类型">
                  {DATA_SOURCE_TYPES.map(type => (
                    <Option key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="描述"
            rules={[{ max: 500, message: '描述不能超过500个字符' }]}
          >
            <TextArea rows={2} placeholder="请输入数据源描述" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="host"
                label="主机地址"
                rules={[{ required: true, message: '请输入主机地址' }]}
              >
                <Input placeholder="localhost" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="port"
                label="端口"
                rules={[{ required: true, message: '请输入端口号' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="3306"
                  min={1}
                  max={65535}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="database"
                label="数据库名"
                rules={[{ required: true, message: '请输入数据库名' }]}
              >
                <Input placeholder="请输入数据库名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="username"
                label="用户名"
                rules={[{ required: true, message: '请输入用户名' }]}
              >
                <Input placeholder="请输入用户名" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="password"
            label="密码"
            rules={[
              { required: !editingDataSource, message: '请输入密码' },
              { min: 1, message: '请输入密码' }
            ]}
          >
            <Input.Password placeholder={editingDataSource ? '不修改请留空' : '请输入密码'} />
          </Form.Item>

          <Form.Item
            name="connectionParams"
            label="连接参数"
            rules={[{ max: 1000, message: '连接参数不能超过1000个字符' }]}
          >
            <TextArea
              rows={3}
              placeholder="可选，如：useSSL=false&serverTimezone=UTC"
            />
          </Form.Item>

          <Divider />

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={hideModal}>取消</Button>
              <Button type="primary" htmlType="submit">
                {editingDataSource ? '更新' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default DataSourceManagement

