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
  Drawer,
  Form,
  Row,
  Col,
  Divider
} from 'antd'
import { 
  ArrowLeftOutlined,
  SaveOutlined,
  BookOutlined,
  ImportOutlined,
  MoreOutlined,
  EyeOutlined,
  CodeOutlined,
  CheckCircleOutlined
} from '@ant-design/icons'
import { useNavigate, useSearchParams } from 'react-router-dom'

const { TextArea } = Input
const { Option } = Select

interface ModelField {
  id: number
  fieldNameEn: string
  fieldNameZh: string
  isConfigured: boolean
  dataType: string
  fieldLength?: number
  fieldPrecision?: number
  fieldScale?: number
  isNullable: boolean
  isPrimaryKey: boolean
  defaultValue?: string
  fieldDescription?: string
  sourceSystem?: string
  sourceDatabase?: string
  sourceTable?: string
  sourceField?: string
  sourceFieldType?: string
  calcRule?: string
  position: number
}

const OnlineModeling: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [autoSaveTime, setAutoSaveTime] = useState<string>('')
  const [fieldLibraryVisible, setFieldLibraryVisible] = useState(false)
  const [moreMenuVisible, setMoreMenuVisible] = useState(false)
  
  // 获取URL参数
  const modelId = searchParams.get('id')
  const mode = searchParams.get('mode')
  
  // 表单数据
  const [modelInfo, setModelInfo] = useState({
    tableNameEn: '',
    tableNameZh: '',
    overview: '',
    layer: 'DWD',
    domains: []
  })
  
  // 字段数据
  const [fields, setFields] = useState<ModelField[]>([])

  // 模拟数据
  useEffect(() => {
    if (modelId && mode === 'edit') {
      // 编辑模式，加载现有数据
      setModelInfo({
        tableNameEn: 'user_profile_dwd',
        tableNameZh: '用户画像明细表',
        overview: '用户基础信息和行为数据的明细表',
        layer: 'DWD',
        domains: ['用户域']
      })
      
      setFields([
        {
          id: 1,
          fieldNameEn: 'user_id',
          fieldNameZh: '用户ID',
          isConfigured: true,
          dataType: 'BIGINT',
          fieldLength: 20,
          isNullable: false,
          isPrimaryKey: true,
          fieldDescription: '用户唯一标识',
          sourceSystem: '用户系统',
          sourceDatabase: 'user_db',
          sourceTable: 'user_info',
          sourceField: 'id',
          sourceFieldType: 'BIGINT',
          position: 1
        },
        {
          id: 2,
          fieldNameEn: 'user_name',
          fieldNameZh: '用户姓名',
          isConfigured: true,
          dataType: 'VARCHAR',
          fieldLength: 50,
          isNullable: true,
          isPrimaryKey: false,
          fieldDescription: '用户真实姓名',
          sourceSystem: '用户系统',
          sourceDatabase: 'user_db',
          sourceTable: 'user_info',
          sourceField: 'name',
          sourceFieldType: 'VARCHAR',
          position: 2
        }
      ])
    } else if (mode === 'new') {
      // 新建模式，设置默认值
      setModelInfo({
        tableNameEn: '',
        tableNameZh: '',
        overview: '',
        layer: 'DWD',
        domains: []
      })
      setFields([])
    }
  }, [modelId, mode])

  // 自动保存
  useEffect(() => {
    const timer = setInterval(() => {
      if (modelInfo.tableNameEn && fields.length > 0) {
        handleAutoSave()
      }
    }, 2000) // 2秒自动保存

    return () => clearInterval(timer)
  }, [modelInfo, fields])

  const handleAutoSave = async () => {
    try {
      // TODO: 调用自动保存API
      setAutoSaveTime(new Date().toLocaleTimeString())
    } catch (error) {
      console.error('自动保存失败:', error)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // TODO: 调用保存API
      await new Promise(resolve => setTimeout(resolve, 1000)) // 模拟API调用
      message.success('保存成功')
      setAutoSaveTime(new Date().toLocaleTimeString())
    } catch (error) {
      message.error('保存失败')
    } finally {
      setSaving(false)
    }
  }

  const handleAddField = () => {
    const newField: ModelField = {
      id: Date.now(),
      fieldNameEn: '',
      fieldNameZh: '',
      isConfigured: false,
      dataType: 'VARCHAR',
      fieldLength: 255,
      isNullable: true,
      isPrimaryKey: false,
      position: fields.length + 1
    }
    setFields([...fields, newField])
  }

  const handleFieldChange = (id: number, field: Partial<ModelField>) => {
    setFields(fields.map(f => f.id === id ? { ...f, ...field } : f))
  }

  const handleDeleteField = (id: number) => {
    setFields(fields.filter(f => f.id !== id))
  }

  const columns = [
    {
      title: '字段英文名',
      dataIndex: 'fieldNameEn',
      key: 'fieldNameEn',
      width: 150,
      render: (text: string, record: ModelField) => (
        <Input
          value={text}
          onChange={(e) => handleFieldChange(record.id, { fieldNameEn: e.target.value })}
          placeholder="字段英文名"
        />
      )
    },
    {
      title: '字段中文名',
      dataIndex: 'fieldNameZh',
      key: 'fieldNameZh',
      width: 150,
      render: (text: string, record: ModelField) => (
        <Input
          value={text}
          onChange={(e) => handleFieldChange(record.id, { fieldNameZh: e.target.value })}
          placeholder="字段中文名"
        />
      )
    },
    {
      title: '是否已配置',
      dataIndex: 'isConfigured',
      key: 'isConfigured',
      width: 100,
      render: (configured: boolean, record: ModelField) => (
        <Tag color={configured ? 'success' : 'default'}>
          {configured ? '已配置' : '未配置'}
        </Tag>
      )
    },
    {
      title: '字段类型',
      dataIndex: 'dataType',
      key: 'dataType',
      width: 120,
      render: (text: string, record: ModelField) => (
        <Select
          value={text}
          style={{ width: '100%' }}
          onChange={(value) => handleFieldChange(record.id, { dataType: value })}
        >
          <Option value="VARCHAR">VARCHAR</Option>
          <Option value="INT">INT</Option>
          <Option value="BIGINT">BIGINT</Option>
          <Option value="DECIMAL">DECIMAL</Option>
          <Option value="DATETIME">DATETIME</Option>
          <Option value="BOOLEAN">BOOLEAN</Option>
        </Select>
      )
    },
    {
      title: '长度/值',
      key: 'length',
      width: 100,
      render: (record: ModelField) => (
        <Input
          value={record.fieldLength}
          onChange={(e) => handleFieldChange(record.id, { fieldLength: parseInt(e.target.value) || 0 })}
          placeholder="长度"
        />
      )
    },
    {
      title: '是否为空',
      dataIndex: 'isNullable',
      key: 'isNullable',
      width: 100,
      render: (nullable: boolean, record: ModelField) => (
        <Select
          value={nullable}
          style={{ width: '100%' }}
          onChange={(value) => handleFieldChange(record.id, { isNullable: value })}
        >
          <Option value={true}>是</Option>
          <Option value={false}>否</Option>
        </Select>
      )
    },
    {
      title: '默认值',
      dataIndex: 'defaultValue',
      key: 'defaultValue',
      width: 120,
      render: (text: string, record: ModelField) => (
        <Input
          value={text}
          onChange={(e) => handleFieldChange(record.id, { defaultValue: e.target.value })}
          placeholder="默认值"
        />
      )
    },
    {
      title: '是否主键',
      dataIndex: 'isPrimaryKey',
      key: 'isPrimaryKey',
      width: 100,
      render: (isPK: boolean, record: ModelField) => (
        <Select
          value={isPK}
          style={{ width: '100%' }}
          onChange={(value) => handleFieldChange(record.id, { isPrimaryKey: value })}
        >
          <Option value={true}>是</Option>
          <Option value={false}>否</Option>
        </Select>
      )
    },
    {
      title: '字段描述',
      dataIndex: 'fieldDescription',
      key: 'fieldDescription',
      width: 200,
      render: (text: string, record: ModelField) => (
        <Input
          value={text}
          onChange={(e) => handleFieldChange(record.id, { fieldDescription: e.target.value })}
          placeholder="字段描述"
        />
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right' as const,
      render: (record: ModelField) => (
        <Button
          type="text"
          danger
          size="small"
          onClick={() => handleDeleteField(record.id)}
        >
          删除
        </Button>
      )
    }
  ]

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 顶部工具栏 */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center'
        }}>
          <Space>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/model')}
            >
              返回
            </Button>
            <span style={{ fontSize: '16px', fontWeight: 'bold' }}>
              {mode === 'new' ? '新建模型' : '编辑模型'}
            </span>
          </Space>
          
          <Space>
            <span style={{ color: '#8c8c8c', fontSize: '12px' }}>
              {autoSaveTime ? `已自动保存 ${autoSaveTime}` : '正在保存...'}
            </span>
            <Button
              icon={<BookOutlined />}
              onClick={() => setFieldLibraryVisible(true)}
            >
              标准字段库
            </Button>
            <Button
              icon={<ImportOutlined />}
            >
              快速导入
            </Button>
            <Button
              icon={<MoreOutlined />}
              onClick={() => setMoreMenuVisible(true)}
            >
              更多功能
            </Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={saving}
              onClick={handleSave}
            >
              保存
            </Button>
          </Space>
        </div>
      </Card>

      {/* 表头信息 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item label="英文表名">
              <Input
                value={modelInfo.tableNameEn}
                onChange={(e) => setModelInfo({ ...modelInfo, tableNameEn: e.target.value })}
                placeholder="英文表名"
              />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="中文名称">
              <Input
                value={modelInfo.tableNameZh}
                onChange={(e) => setModelInfo({ ...modelInfo, tableNameZh: e.target.value })}
                placeholder="中文名称"
              />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="分层">
              <Select
                value={modelInfo.layer}
                style={{ width: '100%' }}
                onChange={(value) => setModelInfo({ ...modelInfo, layer: value })}
              >
                <Option value="ODS">ODS - 原始数据层</Option>
                <Option value="DWD">DWD - 明细数据层</Option>
                <Option value="DIM">DIM - 维度数据层</Option>
                <Option value="DWS">DWS - 汇总数据层</Option>
                <Option value="ADS">ADS - 应用数据层</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="主题域">
              <Select
                mode="multiple"
                value={modelInfo.domains}
                style={{ width: '100%' }}
                onChange={(value) => setModelInfo({ ...modelInfo, domains: value })}
                placeholder="选择主题域"
              >
                <Option value="用户域">用户域</Option>
                <Option value="订单域">订单域</Option>
                <Option value="商品域">商品域</Option>
                <Option value="营销域">营销域</Option>
                <Option value="财务域">财务域</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
        <Form.Item label="总体概述">
          <TextArea
            value={modelInfo.overview}
            onChange={(e) => setModelInfo({ ...modelInfo, overview: e.target.value })}
            placeholder="模型总体概述"
            rows={2}
          />
        </Form.Item>
      </Card>

      {/* 字段列表 */}
      <Card 
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>字段列表</span>
            <Button type="primary" onClick={handleAddField}>
              添加字段
            </Button>
          </div>
        }
        style={{ flex: 1, overflow: 'hidden' }}
      >
        <Table
          columns={columns}
          dataSource={fields}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200, y: 'calc(100vh - 400px)' }}
          pagination={false}
          size="small"
        />
      </Card>

      {/* 标准字段库抽屉 */}
      <Drawer
        title="标准字段库"
        placement="right"
        width={600}
        open={fieldLibraryVisible}
        onClose={() => setFieldLibraryVisible(false)}
      >
        <div>标准字段库内容</div>
      </Drawer>

      {/* 更多功能抽屉 */}
      <Drawer
        title="更多功能"
        placement="right"
        width={600}
        open={moreMenuVisible}
        onClose={() => setMoreMenuVisible(false)}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Button 
            icon={<EyeOutlined />} 
            block 
            size="large"
            onClick={() => {
              setMoreMenuVisible(false)
              // TODO: 打开模型日志
            }}
          >
            模型日志
          </Button>
          <Button 
            icon={<CodeOutlined />} 
            block 
            size="large"
            onClick={() => {
              setMoreMenuVisible(false)
              // TODO: 生成代码
            }}
          >
            生成代码
          </Button>
          <Button 
            icon={<CheckCircleOutlined />} 
            block 
            size="large"
            onClick={() => {
              setMoreMenuVisible(false)
              // TODO: 规范检查
            }}
          >
            规范检查
          </Button>
        </Space>
      </Drawer>
    </div>
  )
}

export default OnlineModeling

