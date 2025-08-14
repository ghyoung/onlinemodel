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
  Row,
  Col,
  Statistic,
  Progress,
  Modal,
  Form,
  Tabs,
  List,
  Alert
} from 'antd'
import { 
  SearchOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  SettingOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined
} from '@ant-design/icons'

const { Search } = Input
const { Option } = Select


interface GovernanceRule {
  id: number
  name: string
  description: string
  type: string
  status: string
  priority: string
  lastRunTime: string
  successRate: number
  totalChecks: number
  failedChecks: number
  createdBy: string
  createdAt: string
}

interface GovernanceResult {
  id: number
  ruleName: string
  tableName: string
  fieldName: string
  issueType: string
  severity: string
  description: string
  suggestion: string
  status: string
  createdAt: string
}

const DataGovernance: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [selectedType, setSelectedType] = useState<string>('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [ruleModalVisible, setRuleModalVisible] = useState(false)
  const [editingRule, setEditingRule] = useState<GovernanceRule | null>(null)
  const [runningRules, setRunningRules] = useState<number[]>([])

  // 模拟数据
  const [rules, setRules] = useState<GovernanceRule[]>([])
  const [results, setResults] = useState<GovernanceResult[]>([])

  useEffect(() => {
    // 模拟治理规则数据
    setRules([
      {
        id: 1,
        name: '字段命名规范检查',
        description: '检查字段命名是否符合驼峰命名规范',
        type: 'naming',
        status: 'active',
        priority: 'high',
        lastRunTime: '2024-01-15 10:30:00',
        successRate: 95.2,
        totalChecks: 1250,
        failedChecks: 60,
        createdBy: 'admin',
        createdAt: '2024-01-01 09:00:00'
      },
      {
        id: 2,
        name: '数据类型一致性检查',
        description: '检查相同语义字段的数据类型是否一致',
        type: 'consistency',
        status: 'active',
        priority: 'medium',
        lastRunTime: '2024-01-15 09:15:00',
        successRate: 87.5,
        totalChecks: 890,
        failedChecks: 111,
        createdBy: 'admin',
        createdAt: '2024-01-01 09:00:00'
      },
      {
        id: 3,
        name: '主键完整性检查',
        description: '检查表是否包含主键约束',
        type: 'integrity',
        status: 'inactive',
        priority: 'high',
        lastRunTime: '2024-01-14 16:45:00',
        successRate: 92.1,
        totalChecks: 456,
        failedChecks: 36,
        createdBy: 'admin',
        createdAt: '2024-01-01 09:00:00'
      }
    ])

    // 模拟治理结果数据
    setResults([
      {
        id: 1,
        ruleName: '字段命名规范检查',
        tableName: 'user_profile_dwd',
        fieldName: 'user_name',
        issueType: '命名不规范',
        severity: 'warning',
        description: '字段名不符合驼峰命名规范',
        suggestion: '建议将字段名改为 user_name 或 userName',
        status: 'open',
        createdAt: '2024-01-15 10:30:00'
      },
      {
        id: 2,
        ruleName: '数据类型一致性检查',
        tableName: 'order_master_dwd',
        fieldName: 'order_amount',
        issueType: '类型不一致',
        severity: 'error',
        description: '相同语义字段在不同表中的数据类型不一致',
        suggestion: '建议统一使用 DECIMAL(18,2) 类型',
        status: 'open',
        createdAt: '2024-01-15 09:15:00'
      }
    ])
  }, [])

  // 规则类型选项
  const ruleTypeOptions = [
    { value: 'naming', label: '命名规范' },
    { value: 'consistency', label: '一致性检查' },
    { value: 'integrity', label: '完整性检查' },
    { value: 'quality', label: '数据质量' },
    { value: 'security', label: '安全合规' }
  ]

  // 规则状态选项
  const ruleStatusOptions = [
    { value: 'active', label: '启用' },
    { value: 'inactive', label: '停用' },
    { value: 'draft', label: '草稿' }
  ]

  // 优先级选项
  const priorityOptions = [
    { value: 'high', label: '高' },
    { value: 'medium', label: '中' },
    { value: 'low', label: '低' }
  ]

  const getTypeTag = (type: string) => {
    const typeMap: Record<string, { color: string; label: string }> = {
      'naming': { color: 'blue', label: '命名规范' },
      'consistency': { color: 'green', label: '一致性检查' },
      'integrity': { color: 'orange', label: '完整性检查' },
      'quality': { color: 'purple', label: '数据质量' },
      'security': { color: 'red', label: '安全合规' }
    }
    
    const config = typeMap[type] || { color: 'default', label: type }
    return <Tag color={config.color}>{config.label}</Tag>
  }

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'active':
        return <Tag color="success">启用</Tag>
      case 'inactive':
        return <Tag color="default">停用</Tag>
      case 'draft':
        return <Tag color="processing">草稿</Tag>
      default:
        return <Tag color="default">未知</Tag>
    }
  }

  const getPriorityTag = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Tag color="error">高</Tag>
      case 'medium':
        return <Tag color="warning">中</Tag>
      case 'low':
        return <Tag color="default">低</Tag>
      default:
        return <Tag color="default">未知</Tag>
    }
  }

  const getSeverityTag = (severity: string) => {
    switch (severity) {
      case 'error':
        return <Tag color="error">错误</Tag>
      case 'warning':
        return <Tag color="warning">警告</Tag>
      case 'info':
        return <Tag color="blue">信息</Tag>
      default:
        return <Tag color="default">未知</Tag>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircleOutlined style={{ color: '#52C41A' }} />
      case 'inactive':
        return <PauseCircleOutlined style={{ color: '#8C8C8C' }} />
      case 'draft':
        return <FileTextOutlined style={{ color: '#1890FF' }} />
      default:
        return <ExclamationCircleOutlined style={{ color: '#FAAD14' }} />
    }
  }

  const ruleColumns = [
    {
      title: '规则名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (text: string) => <strong>{text}</strong>
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      width: 250,
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text}>
          <span>{text}</span>
        </Tooltip>
      )
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string) => getTypeTag(type)
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => getStatusTag(status)
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority: string) => getPriorityTag(priority)
    },
    {
      title: '成功率',
      key: 'successRate',
      width: 150,
      render: (record: GovernanceRule) => (
        <div>
          <Progress
            percent={record.successRate}
            size="small"
            status={record.successRate >= 90 ? 'success' : record.successRate >= 70 ? 'normal' : 'exception'}
          />
          <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
            {record.successRate}% ({record.totalChecks - record.failedChecks}/{record.totalChecks})
          </div>
        </div>
      )
    },
    {
      title: '最后运行',
      dataIndex: 'lastRunTime',
      key: 'lastRunTime',
      width: 160,
      render: (text: string) => (
        <span style={{ fontSize: '12px' }}>{text}</span>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right' as const,
      render: (record: GovernanceRule) => (
        <Space size="small">
          {record.status === 'active' ? (
            <Button
              type="text"
              size="small"
              icon={<PauseCircleOutlined />}
              onClick={() => handleToggleRule(record.id, 'inactive')}
            >
              停用
            </Button>
          ) : (
            <Button
              type="text"
              size="small"
              icon={<PlayCircleOutlined />}
              onClick={() => handleToggleRule(record.id, 'active')}
            >
              启用
            </Button>
          )}
          <Button
            type="text"
            size="small"
            icon={<PlayCircleOutlined />}
            onClick={() => handleRunRule(record.id)}
            loading={runningRules.includes(record.id)}
          >
            运行
          </Button>
          <Button
            type="text"
            size="small"
            icon={<SettingOutlined />}
            onClick={() => {
              setEditingRule(record)
              setRuleModalVisible(true)
            }}
          >
            编辑
          </Button>
        </Space>
      )
    }
  ]

  const resultColumns = [
    {
      title: '规则名称',
      dataIndex: 'ruleName',
      key: 'ruleName',
      width: 200
    },
    {
      title: '表名',
      dataIndex: 'tableName',
      key: 'tableName',
      width: 150
    },
    {
      title: '字段名',
      dataIndex: 'fieldName',
      key: 'fieldName',
      width: 120
    },
    {
      title: '问题类型',
      dataIndex: 'issueType',
      key: 'issueType',
      width: 120,
      render: (text: string) => <Tag color="orange">{text}</Tag>
    },
    {
      title: '严重程度',
      dataIndex: 'severity',
      key: 'severity',
      width: 100,
      render: (severity: string) => getSeverityTag(severity)
    },
    {
      title: '问题描述',
      dataIndex: 'description',
      key: 'description',
      width: 200,
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text}>
          <span>{text}</span>
        </Tooltip>
      )
    },
    {
      title: '修复建议',
      dataIndex: 'suggestion',
      key: 'suggestion',
      width: 200,
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text}>
          <span>{text}</span>
        </Tooltip>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={status === 'open' ? 'processing' : 'success'}>
          {status === 'open' ? '待处理' : '已处理'}
        </Tag>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (text: string) => (
        <span style={{ fontSize: '12px' }}>{text}</span>
      )
    }
  ]

  const handleSearch = (value: string) => {
    setSearchText(value)
    // TODO: 实现搜索逻辑
  }

  const handleToggleRule = (id: number, status: string) => {
    setRules(rules.map(rule => 
      rule.id === id ? { ...rule, status } : rule
    ))
    message.success(`规则已${status === 'active' ? '启用' : '停用'}`)
  }

  const handleRunRule = async (id: number) => {
    setRunningRules(prev => [...prev, id])
    try {
      // TODO: 调用运行规则API
      await new Promise(resolve => setTimeout(resolve, 2000)) // 模拟API调用
      message.success('规则运行完成')
    } catch (error) {
      message.error('规则运行失败')
    } finally {
      setRunningRules(prev => prev.filter(ruleId => ruleId !== id))
    }
  }

  const handleAddRule = (values: any) => {
    const newRule: GovernanceRule = {
      id: Date.now(),
      ...values,
      status: 'draft',
      lastRunTime: '-',
      successRate: 0,
      totalChecks: 0,
      failedChecks: 0,
      createdBy: 'current_user',
      createdAt: new Date().toLocaleString()
    }
    setRules([...rules, newRule])
    setRuleModalVisible(false)
    message.success('规则添加成功')
  }

  const handleEditRule = (values: any) => {
    if (editingRule) {
      setRules(rules.map(rule => 
        rule.id === editingRule.id ? { ...rule, ...values } : rule
      ))
      setRuleModalVisible(false)
      setEditingRule(null)
      message.success('规则更新成功')
    }
  }

  // 治理概览统计
  const governanceStats = {
    totalRules: rules.length,
    activeRules: rules.filter(r => r.status === 'active').length,
    totalIssues: results.length,
    openIssues: results.filter(r => r.status === 'open').length,
    avgSuccessRate: rules.length > 0 ? 
      rules.reduce((sum, rule) => sum + rule.successRate, 0) / rules.length : 0
  }

  // 定义 Tabs 的 items
  const tabItems = [
    {
      key: 'rules',
      label: '治理规则',
      children: (
        <>
          {/* 搜索和筛选 */}
          <Card style={{ marginBottom: 16 }}>
            <Space wrap style={{ width: '100%' }}>
              <Search
                placeholder="搜索规则名称..."
                style={{ width: 300 }}
                onSearch={handleSearch}
                enterButton={<SearchOutlined />}
              />
              <Select
                placeholder="选择规则类型"
                style={{ width: 150 }}
                allowClear
                value={selectedType}
                onChange={setSelectedType}
              >
                {ruleTypeOptions.map(option => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
              <Select
                placeholder="选择规则状态"
                style={{ width: 150 }}
                allowClear
                value={selectedStatus}
                onChange={setSelectedStatus}
              >
                {ruleStatusOptions.map(option => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </Space>
          </Card>

          {/* 规则列表 */}
          <Table
            columns={ruleColumns}
            dataSource={rules}
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
        </>
      )
    },
    {
      key: 'results',
      label: '治理结果',
      children: (
        <>
          {/* 结果统计 */}
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={8}>
              <Card>
                <Statistic
                  title="待处理问题"
                  value={governanceStats.openIssues}
                  valueStyle={{ color: '#FAAD14' }}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="已处理问题"
                  value={governanceStats.totalIssues - governanceStats.openIssues}
                  valueStyle={{ color: '#52C41A' }}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="处理率"
                  value={governanceStats.totalIssues > 0 ? 
                    ((governanceStats.totalIssues - governanceStats.openIssues) / governanceStats.totalIssues * 100).toFixed(1) : 0}
                  suffix="%"
                  valueStyle={{ color: '#1890FF' }}
                />
              </Card>
            </Col>
          </Row>

          {/* 结果列表 */}
          <Table
            columns={resultColumns}
            dataSource={results}
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
        </>
      )
    }
  ]

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 16
      }}>
        <h1>数据治理</h1>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              setLoading(true)
              setTimeout(() => setLoading(false), 1000)
            }}
            loading={loading}
          >
            刷新
          </Button>
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={() => {
              // TODO: 批量运行所有启用规则
              message.info('开始批量运行治理规则...')
            }}
          >
            批量运行
          </Button>
          <Button
            icon={<SettingOutlined />}
            onClick={() => setRuleModalVisible(true)}
          >
            添加规则
          </Button>
        </Space>
      </div>

      {/* 治理概览 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总规则数"
              value={governanceStats.totalRules}
              valueStyle={{ color: '#1890FF' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="启用规则数"
              value={governanceStats.activeRules}
              valueStyle={{ color: '#52C41A' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="总问题数"
              value={governanceStats.totalIssues}
              valueStyle={{ color: '#FAAD14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="平均成功率"
              value={governanceStats.avgSuccessRate.toFixed(1)}
              suffix="%"
              valueStyle={{ color: '#722ED1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 治理规则和结果 */}
      <Tabs defaultActiveKey="rules" items={tabItems} />

      {/* 添加/编辑规则模态框 */}
      <Modal
        title={editingRule ? '编辑治理规则' : '添加治理规则'}
        open={ruleModalVisible}
        onCancel={() => {
          setRuleModalVisible(false)
          setEditingRule(null)
        }}
        footer={null}
        width={600}
      >
        <Form
          layout="vertical"
          initialValues={editingRule || {}}
          onFinish={editingRule ? handleEditRule : handleAddRule}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="规则名称"
                rules={[{ required: true, message: '请输入规则名称' }]}
              >
                <Input placeholder="规则名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="type"
                label="规则类型"
                rules={[{ required: true, message: '请选择规则类型' }]}
              >
                <Select placeholder="选择规则类型">
                  {ruleTypeOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="priority"
                label="优先级"
                rules={[{ required: true, message: '请选择优先级' }]}
              >
                <Select placeholder="选择优先级">
                  {priorityOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="status"
                label="状态"
                rules={[{ required: true, message: '请选择状态' }]}
              >
                <Select placeholder="选择状态">
                  {ruleStatusOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="description"
            label="规则描述"
            rules={[{ required: true, message: '请输入规则描述' }]}
          >
            <Input.TextArea rows={3} placeholder="规则描述" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingRule ? '更新' : '添加'}
              </Button>
              <Button onClick={() => {
                setRuleModalVisible(false)
                setEditingRule(null)
              }}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default DataGovernance

