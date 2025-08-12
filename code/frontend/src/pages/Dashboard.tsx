import React from 'react'
import { Row, Col, Card, Statistic, Table, List, Avatar, Space, Tag, Button } from 'antd'
import {
  DatabaseOutlined,
  TableOutlined,
  UserOutlined,
  FileTextOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons'

const Dashboard: React.FC = () => {
  // 统计数据
  const stats = [
    {
      title: '数据源总数',
      value: 12,
      icon: <DatabaseOutlined style={{ fontSize: 24, color: '#1890FF' }} />,
      color: '#1890FF'
    },
    {
      title: '模型总数',
      value: 156,
      icon: <TableOutlined style={{ fontSize: 24, color: '#52C41A' }} />,
      color: '#52C41A'
    },
    {
      title: '字段总数',
      value: 2847,
      icon: <FileTextOutlined style={{ fontSize: 24, color: '#FAAD14' }} />,
      color: '#FAAD14'
    },
    {
      title: '活跃用户',
      value: 8,
      icon: <UserOutlined style={{ fontSize: 24, color: '#722ED1' }} />,
      color: '#722ED1'
    }
  ]

  // 最近活动数据
  const recentActivities = [
    {
      id: 1,
      user: '张三',
      action: '创建了模型',
      target: 'user_profile_dwd',
      time: '2分钟前',
      status: 'success'
    },
    {
      id: 2,
      user: '李四',
      action: '导入了DDL',
      target: 'order_master',
      time: '15分钟前',
      status: 'success'
    },
    {
      id: 3,
      user: '王五',
      action: '更新了字段',
      target: 'product_dim',
      time: '1小时前',
      status: 'warning'
    },
    {
      id: 4,
      user: '赵六',
      action: '同步了数据源',
      target: 'MySQL_Production',
      time: '2小时前',
      status: 'success'
    }
  ]

  // 系统状态数据
  const systemStatus = [
    {
      name: 'PostgreSQL数据库',
      status: 'healthy',
      lastCheck: '1分钟前'
    },
    {
      name: 'Redis缓存',
      status: 'healthy',
      lastCheck: '1分钟前'
    },
    {
      name: 'Elasticsearch',
      status: 'warning',
      lastCheck: '5分钟前'
    },
    {
      name: '数据源连接池',
      status: 'healthy',
      lastCheck: '1分钟前'
    }
  ]

  // 快速操作
  const quickActions = [
    { name: '新建模型', icon: <TableOutlined />, color: '#1890FF' },
    { name: '导入DDL', icon: <FileTextOutlined />, color: '#52C41A' },
    { name: '管理数据源', icon: <DatabaseOutlined />, color: '#FAAD14' },
    { name: '查看血缘', icon: <SyncOutlined />, color: '#722ED1' }
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircleOutlined style={{ color: '#52C41A' }} />
      case 'warning':
        return <ExclamationCircleOutlined style={{ color: '#FAAD14' }} />
      case 'error':
        return <ExclamationCircleOutlined style={{ color: '#F5222D' }} />
      default:
        return <SyncOutlined style={{ color: '#8C8C8C' }} />
    }
  }

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Tag color="success">正常</Tag>
      case 'warning':
        return <Tag color="warning">警告</Tag>
      case 'error':
        return <Tag color="error">错误</Tag>
      default:
        return <Tag color="default">未知</Tag>
    }
  }

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>仪表板</h1>
      
      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {stats.map((stat, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card>
              <Space>
                {stat.icon}
                <Statistic
                  title={stat.title}
                  value={stat.value}
                  valueStyle={{ color: stat.color }}
                />
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 快速操作 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Card title="快速操作">
            <Space wrap>
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  type="default"
                  icon={action.icon}
                  size="large"
                  style={{ color: action.color, borderColor: action.color }}
                >
                  {action.name}
                </Button>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* 最近活动 */}
        <Col xs={24} lg={12}>
          <Card title="最近活动" extra={<Button type="link">查看全部</Button>}>
            <List
              dataSource={recentActivities}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar icon={<UserOutlined />} />}
                    title={
                      <Space>
                        <span>{item.user}</span>
                        <span>{item.action}</span>
                        <Tag color="blue">{item.target}</Tag>
                      </Space>
                    }
                    description={item.time}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* 系统状态 */}
        <Col xs={24} lg={12}>
          <Card title="系统状态" extra={<Button type="link">刷新</Button>}>
            <List
              dataSource={systemStatus}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={getStatusIcon(item.status)}
                    title={
                      <Space>
                        <span>{item.name}</span>
                        {getStatusTag(item.status)}
                      </Space>
                    }
                    description={`最后检查: ${item.lastCheck}`}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard

