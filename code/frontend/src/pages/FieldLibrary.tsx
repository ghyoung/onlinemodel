import React, { useState, useEffect } from 'react'
import { 
  Card, 
  Button, 
  Space, 
  Input, 
  Select, 
  Table, 
  Tag, 
  Tooltip, 
  message,
  Modal,
  Form,
  Row,
  Col,
  Tree,
  Drawer
} from 'antd'
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  BookOutlined,
  SearchOutlined,
  FolderOutlined,
  FileOutlined
} from '@ant-design/icons'

const { Search } = Input
const { Option } = Select

interface StandardField {
  id: number
  fieldNameEn: string
  fieldNameZh: string
  dataType: string
  fieldLength?: number
  fieldPrecision?: number
  fieldScale?: number
  isNullable: boolean
  defaultValue?: string
  fieldDescription: string
  businessDomain: string
  usageCount: number
  isActive: boolean
  createdBy: string
  createdAt: string
}

interface FieldCategory {
  title: string
  key: string
  children?: FieldCategory[]
}

const FieldLibrary: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [selectedDomain, setSelectedDomain] = useState<string>('')
  const [selectedDataType, setSelectedDataType] = useState<string>('')
  const [addModalVisible, setAddModalVisible] = useState(false)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [editingField, setEditingField] = useState<StandardField | null>(null)
  const [categoryDrawerVisible, setCategoryDrawerVisible] = useState(false)

  // 模拟数据
  const [fields, setFields] = useState<StandardField[]>([])

  useEffect(() => {
    setFields([
      {
        id: 1,
        fieldNameEn: 'user_id',
        fieldNameZh: '用户ID',
        dataType: 'BIGINT',
        fieldLength: 20,
        isNullable: false,
        fieldDescription: '用户唯一标识符',
        businessDomain: '用户域',
        usageCount: 156,
        isActive: true,
        createdBy: 'admin',
        createdAt: '2024-01-01 09:00:00'
      },
      {
        id: 2,
        fieldNameEn: 'user_name',
        fieldNameZh: '用户姓名',
        dataType: 'VARCHAR',
        fieldLength: 50,
        isNullable: true,
        fieldDescription: '用户真实姓名',
        businessDomain: '用户域',
        usageCount: 142,
        isActive: true,
        createdBy: 'admin',
        createdAt: '2024-01-01 09:00:00'
      },
      {
        id: 3,
        fieldNameEn: 'order_id',
        fieldNameZh: '订单ID',
        dataType: 'BIGINT',
        fieldLength: 20,
        isNullable: false,
        fieldDescription: '订单唯一标识符',
        businessDomain: '订单域',
        usageCount: 98,
        isActive: true,
        createdBy: 'admin',
        createdAt: '2024-01-01 09:00:00'
      },
      {
        id: 4,
        fieldNameEn: 'product_id',
        fieldNameZh: '商品ID',
        dataType: 'BIGINT',
        fieldLength: 20,
        isNullable: false,
        fieldDescription: '商品唯一标识符',
        businessDomain: '商品域',
        usageCount: 87,
        isActive: true,
        createdBy: 'admin',
        createdAt: '2024-01-01 09:00:00'
      }
    ])
  }, [])

  // 字段分类树
  const categoryTree: FieldCategory[] = [
    {
      title: '用户域',
      key: 'user',
      children: [
        { title: '基础信息', key: 'user_basic' },
        { title: '行为数据', key: 'user_behavior' },
        { title: '偏好设置', key: 'user_preference' }
      ]
    },
    {
      title: '订单域',
      key: 'order',
      children: [
        { title: '订单信息', key: 'order_info' },
        { title: '支付信息', key: 'order_payment' },
        { title: '物流信息', key: 'order_logistics' }
      ]
    },
    {
      title: '商品域',
      key: 'product',
      children: [
        { title: '商品信息', key: 'product_info' },
        { title: '分类信息', key: 'product_category' },
        { title: '库存信息', key: 'product_inventory' }
      ]
    }
  ]

  // 数据类型选项
  const dataTypeOptions = [
    { value: 'VARCHAR', label: 'VARCHAR' },
    { value: 'INT', label: 'INT' },
    { value: 'BIGINT', label: 'BIGINT' },
    { value: 'DECIMAL', label: 'DECIMAL' },
    { value: 'DATETIME', label: 'DATETIME' },
    { value: 'BOOLEAN', label: 'BOOLEAN' }
  ]

  // 业务域选项
  const domainOptions = [
    { value: '用户域', label: '用户域' },
    { value: '订单域', label: '订单域' },
    { value: '商品域', label: '商品域' },
    { value: '营销域', label: '营销域' },
    { value: '财务域', label: '财务域' }
  ]

  const getDataTypeTag = (type: string) => {
    const typeMap: Record<string, { color: string; label: string }> = {
      'VARCHAR': { color: 'blue', label: 'VARCHAR' },
      'INT': { color: 'green', label: 'INT' },
      'BIGINT': { color: 'purple', label: 'BIGINT' },
      'DECIMAL': { color: 'orange', label: 'DECIMAL' },
      'DATETIME': { color: 'red', label: 'DATETIME' },
      'BOOLEAN': { color: 'cyan', label: 'BOOLEAN' }
    }
    
    const config = typeMap[type] || { color: 'default', label: type }
    return <Tag color={config.color}>{config.label}</Tag>
  }

  const getDomainTag = (domain: string) => {
    return <Tag color="blue">{domain}</Tag>
  }

  const getUsageTag = (count: number) => {
    if (count > 100) {
      return <Tag color="success">高频使用</Tag>
    } else if (count > 50) {
      return <Tag color="processing">中频使用</Tag>
    } else {
      return <Tag color="default">低频使用</Tag>
    }
  }

  const columns = [
    {
      title: '字段英文名',
      dataIndex: 'fieldNameEn',
      key: 'fieldNameEn',
      width: 150,
      render: (text: string) => <strong>{text}</strong>
    },
    {
      title: '字段中文名',
      dataIndex: 'fieldNameZh',
      key: 'fieldNameZh',
      width: 150
    },
    {
      title: '数据类型',
      dataIndex: 'dataType',
      key: 'dataType',
      width: 120,
      render: (type: string) => getDataTypeTag(type)
    },
    {
      title: '长度/精度',
      key: 'length',
      width: 120,
      render: (record: StandardField) => {
        if (record.dataType === 'DECIMAL') {
          return `${record.fieldPrecision},${record.fieldScale}`
        }
        return record.fieldLength || '-'
      }
    },
    {
      title: '是否为空',
      dataIndex: 'isNullable',
      key: 'isNullable',
      width: 100,
      render: (nullable: boolean) => (
        <Tag color={nullable ? 'default' : 'error'}>
          {nullable ? '是' : '否'}
        </Tag>
      )
    },
    {
      title: '默认值',
      dataIndex: 'defaultValue',
      key: 'defaultValue',
      width: 120,
      render: (text: string) => text || '-'
    },
    {
      title: '字段描述',
      dataIndex: 'fieldDescription',
      key: 'fieldDescription',
      width: 200,
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text}>
          <span>{text}</span>
        </Tooltip>
      )
    },
    {
      title: '业务域',
      dataIndex: 'businessDomain',
      key: 'businessDomain',
      width: 100,
      render: (domain: string) => getDomainTag(domain)
    },
    {
      title: '使用次数',
      dataIndex: 'usageCount',
      key: 'usageCount',
      width: 120,
      render: (count: number) => (
        <Space>
          <span>{count}</span>
          {getUsageTag(count)}
        </Space>
      )
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 80,
      render: (active: boolean) => (
        <Tag color={active ? 'success' : 'default'}>
          {active ? '启用' : '停用'}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right' as const,
      render: (record: StandardField) => (
        <Space size="small">
          <Tooltip title="编辑">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => {
                setEditingField(record)
                setEditModalVisible(true)
              }}
            />
          </Tooltip>
          <Tooltip title="删除">
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteField(record.id)}
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

  const handleAddField = (values: any) => {
    const newField: StandardField = {
      id: Date.now(),
      ...values,
      usageCount: 0,
      isActive: true,
      createdBy: 'current_user',
      createdAt: new Date().toLocaleString()
    }
    setFields([...fields, newField])
    setAddModalVisible(false)
    message.success('字段添加成功')
  }

  const handleEditField = (values: any) => {
    if (editingField) {
      setFields(fields.map(f => 
        f.id === editingField.id ? { ...f, ...values } : f
      ))
      setEditModalVisible(false)
      setEditingField(null)
      message.success('字段更新成功')
    }
  }

  const handleDeleteField = (id: number) => {
    setFields(fields.filter(f => f.id !== id))
    message.success('字段删除成功')
  }

  const filteredFields = fields.filter(field => {
    if (searchText && !field.fieldNameEn.toLowerCase().includes(searchText.toLowerCase()) && 
        !field.fieldNameZh.toLowerCase().includes(searchText.toLowerCase())) {
      return false
    }
    if (selectedDomain && field.businessDomain !== selectedDomain) {
      return false
    }
    if (selectedDataType && field.dataType !== selectedDataType) {
      return false
    }
    return true
  })

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 16
      }}>
        <h1>标准字段库</h1>
        <Space>
          <Button
            icon={<BookOutlined />}
            onClick={() => setCategoryDrawerVisible(true)}
          >
            分类管理
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setAddModalVisible(true)}
          >
            添加字段
          </Button>
        </Space>
      </div>

      {/* 搜索和筛选 */}
      <Card style={{ marginBottom: 16 }}>
        <Space wrap style={{ width: '100%' }}>
          <Search
            placeholder="搜索字段名称..."
            style={{ width: 300 }}
            onSearch={handleSearch}
            enterButton={<SearchOutlined />}
          />
          <Select
            placeholder="选择业务域"
            style={{ width: 150 }}
            allowClear
            value={selectedDomain}
            onChange={setSelectedDomain}
          >
            {domainOptions.map(option => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
          <Select
            placeholder="选择数据类型"
            style={{ width: 150 }}
            allowClear
            value={selectedDataType}
            onChange={setSelectedDataType}
          >
            {dataTypeOptions.map(option => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
        </Space>
      </Card>

      {/* 字段列表 */}
      <Table
        columns={columns}
        dataSource={filteredFields}
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

      {/* 添加字段模态框 */}
      <Modal
        title="添加标准字段"
        open={addModalVisible}
        onCancel={() => setAddModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          layout="vertical"
          onFinish={handleAddField}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="fieldNameEn"
                label="字段英文名"
                rules={[{ required: true, message: '请输入字段英文名' }]}
              >
                <Input placeholder="字段英文名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="fieldNameZh"
                label="字段中文名"
                rules={[{ required: true, message: '请输入字段中文名' }]}
              >
                <Input placeholder="字段中文名" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="dataType"
                label="数据类型"
                rules={[{ required: true, message: '请选择数据类型' }]}
              >
                <Select placeholder="选择数据类型">
                  {dataTypeOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="businessDomain"
                label="业务域"
                rules={[{ required: true, message: '请选择业务域' }]}
              >
                <Select placeholder="选择业务域">
                  {domainOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="fieldDescription"
            label="字段描述"
            rules={[{ required: true, message: '请输入字段描述' }]}
          >
            <Input.TextArea rows={3} placeholder="字段描述" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                添加
              </Button>
              <Button onClick={() => setAddModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑字段模态框 */}
      <Modal
        title="编辑标准字段"
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false)
          setEditingField(null)
        }}
        footer={null}
        width={600}
      >
        {editingField && (
          <Form
            layout="vertical"
            initialValues={editingField}
            onFinish={handleEditField}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="fieldNameEn"
                  label="字段英文名"
                  rules={[{ required: true, message: '请输入字段英文名' }]}
                >
                  <Input placeholder="字段英文名" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="fieldNameZh"
                  label="字段中文名"
                  rules={[{ required: true, message: '请输入字段中文名' }]}
                >
                  <Input placeholder="字段中文名" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="dataType"
                  label="数据类型"
                  rules={[{ required: true, message: '请选择数据类型' }]}
                >
                  <Select placeholder="选择数据类型">
                    {dataTypeOptions.map(option => (
                      <Option key={option.value} value={option.value}>
                        {option.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="businessDomain"
                  label="业务域"
                  rules={[{ required: true, message: '请选择业务域' }]}
                >
                  <Select placeholder="选择业务域">
                    {domainOptions.map(option => (
                      <Option key={option.value} value={option.value}>
                        {option.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Form.Item
              name="fieldDescription"
              label="字段描述"
              rules={[{ required: true, message: '请输入字段描述' }]}
            >
              <Input.TextArea rows={3} placeholder="字段描述" />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">
                  更新
                </Button>
                <Button onClick={() => {
                  setEditModalVisible(false)
                  setEditingField(null)
                }}>
                  取消
                </Button>
              </Space>
            </Form.Item>
          </Form>
        )}
      </Modal>

      {/* 分类管理抽屉 */}
      <Drawer
        title="字段分类管理"
        placement="right"
        width={400}
        open={categoryDrawerVisible}
        onClose={() => setCategoryDrawerVisible(false)}
      >
        <Tree
          treeData={categoryTree}
          defaultExpandAll
          showIcon
          icon={({ expanded }) => 
            expanded ? <FolderOutlined /> : <FileOutlined />
          }
        />
      </Drawer>
    </div>
  )
}

export default FieldLibrary

