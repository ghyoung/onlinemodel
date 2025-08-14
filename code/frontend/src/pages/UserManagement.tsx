import React, { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  message,
  Popconfirm,
  Card,
  Row,
  Col,
  Statistic,
  Input as AntInput,
  Tag,
  Tooltip
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  UserOutlined,
  MailOutlined,
  LockOutlined,
  EyeOutlined
} from '@ant-design/icons'
import api from '@/config/api'
import { useAuthStore } from '@/stores/authStore'
import type { User } from '@/stores/authStore'

const { Option } = Select
const { Search } = AntInput

interface UserFormData {
  username: string
  email: string
  password?: string
  role: 'admin' | 'user'
  status: 'active' | 'inactive' | 'locked'
}

const UserManagement: React.FC = () => {
  const { user: currentUser } = useAuthStore()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [form] = Form.useForm()
  const [stats, setStats] = useState<any>({})
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  })
  const [searchText, setSearchText] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')

  // 获取用户列表
  const fetchUsers = async (page = 1, pageSize = 10) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString()
      })
      
      if (searchText) {
        params.append('search', searchText)
      }
      if (roleFilter) {
        params.append('role', roleFilter)
      }
      if (statusFilter) {
        params.append('status', statusFilter)
      }

      const response = await api.get(`/auth/users?${params.toString()}`)
      
      if (response.data.success) {
        setUsers(response.data.data)
        setPagination({
          current: page,
          pageSize,
          total: response.data.pagination.total
        })
      }
    } catch (error) {
      message.error('获取用户列表失败')
      console.error('获取用户列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 获取统计信息
  const fetchStats = async () => {
    try {
      // 这里可以添加获取用户统计信息的API调用
      const totalUsers = users.length
      const activeUsers = users.filter(u => u.status === 'active').length
      const adminUsers = users.filter(u => u.role === 'admin').length
      
      setStats({
        total: totalUsers,
        active: activeUsers,
        admin: adminUsers
      })
    } catch (error) {
      console.error('获取统计信息失败:', error)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    fetchStats()
  }, [users])

  // 显示创建/编辑模态框
  const showModal = (user?: User) => {
    if (user) {
      setEditingUser(user)
      form.setFieldsValue({
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
        password: undefined
      })
    } else {
      setEditingUser(null)
      form.resetFields()
    }
    setModalVisible(true)
  }

  // 隐藏模态框
  const hideModal = () => {
    setModalVisible(false)
    setEditingUser(null)
    form.resetFields()
  }

  // 处理表单提交
  const handleSubmit = async (values: UserFormData) => {
    try {
      if (editingUser) {
        // 更新用户
        const response = await api.put(`/auth/users/${editingUser.id}`, values)
        if (response.data.success) {
          message.success('用户更新成功')
          hideModal()
          fetchUsers(pagination.current, pagination.pageSize)
        }
      } else {
        // 创建用户
        const response = await api.post('/auth/users', values)
        if (response.data.success) {
          message.success('用户创建成功')
          hideModal()
          fetchUsers(pagination.current, pagination.pageSize)
        }
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || '操作失败'
      message.error(errorMessage)
    }
  }

  // 删除用户
  const handleDelete = async (userId: number) => {
    try {
      const response = await api.delete(`/auth/users/${userId}`)
      if (response.data.success) {
        message.success('用户删除成功')
        fetchUsers(pagination.current, pagination.pageSize)
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || '删除失败'
      message.error(errorMessage)
    }
  }

  // 处理分页变化
  const handleTableChange = (pagination: any) => {
    fetchUsers(pagination.current, pagination.pageSize)
  }

  // 处理搜索
  const handleSearch = (value: string) => {
    setSearchText(value)
    fetchUsers(1, pagination.pageSize)
  }

  // 处理筛选
  const handleFilter = () => {
    fetchUsers(1, pagination.pageSize)
  }

  // 重置筛选
  const resetFilters = () => {
    setSearchText('')
    setRoleFilter('')
    setStatusFilter('')
    fetchUsers(1, pagination.pageSize)
  }

  // 表格列定义
  const columns = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      render: (text: string) => (
        <Space>
          <UserOutlined />
          {text}
        </Space>
      )
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      render: (text: string) => (
        <Space>
          <MailOutlined />
          {text}
        </Space>
      )
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <Tag color={role === 'admin' ? 'red' : 'blue'}>
          {role === 'admin' ? '管理员' : '普通用户'}
        </Tag>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusConfig = {
          active: { color: 'green', text: '正常' },
          inactive: { color: 'orange', text: '禁用' },
          locked: { color: 'red', text: '锁定' },
          deleted: { color: 'default', text: '已删除' }
        }
        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active
        return <Tag color={config.color}>{config.text}</Tag>
      }
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text: string) => new Date(text).toLocaleString('zh-CN')
    },
    {
      title: '最后登录',
      dataIndex: 'last_login_at',
      key: 'last_login_at',
      render: (text: string) => text ? new Date(text).toLocaleString('zh-CN') : '从未登录'
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: User) => (
        <Space size="middle">
          <Tooltip title="查看详情">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => showModal(record)}
            />
          </Tooltip>
          <Tooltip title="编辑用户">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => showModal(record)}
            />
          </Tooltip>
          {record.id !== currentUser?.id && (
            <Tooltip title="删除用户">
              <Popconfirm
                title="确定要删除这个用户吗？"
                onConfirm={() => handleDelete(record.id)}
                okText="确定"
                cancelText="取消"
              >
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                />
              </Popconfirm>
            </Tooltip>
          )}
        </Space>
      )
    }
  ]

  return (
    <div style={{ padding: '24px' }}>
      <Card title="用户管理" style={{ marginBottom: '24px' }}>
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col span={6}>
            <Statistic
              title="总用户数"
              value={stats.total || 0}
              prefix={<UserOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="活跃用户"
              value={stats.active || 0}
              valueStyle={{ color: '#3f8600' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="管理员"
              value={stats.admin || 0}
              valueStyle={{ color: '#cf1322' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="在线用户"
              value={stats.online || 0}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
        </Row>

        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col span={8}>
            <Search
              placeholder="搜索用户名或邮箱"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onSearch={handleSearch}
              enterButton
            />
          </Col>
          <Col span={4}>
            <Select
              placeholder="选择角色"
              value={roleFilter}
              onChange={setRoleFilter}
              style={{ width: '100%' }}
              allowClear
            >
              <Option value="admin">管理员</Option>
              <Option value="user">普通用户</Option>
            </Select>
          </Col>
          <Col span={4}>
            <Select
              placeholder="选择状态"
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: '100%' }}
              allowClear
            >
              <Option value="active">正常</Option>
              <Option value="inactive">禁用</Option>
              <Option value="locked">锁定</Option>
            </Select>
          </Col>
          <Col span={4}>
            <Button onClick={handleFilter}>筛选</Button>
          </Col>
          <Col span={4}>
            <Button onClick={resetFilters}>重置</Button>
          </Col>
        </Row>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => showModal()}
          style={{ marginBottom: '16px' }}
        >
          添加用户
        </Button>

        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
          }}
          onChange={handleTableChange}
        />
      </Card>

      <Modal
        title={editingUser ? '编辑用户' : '添加用户'}
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
            role: 'user',
            status: 'active'
          }}
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, message: '用户名至少3个字符' },
              { max: 50, message: '用户名不能超过50个字符' },
              { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线' }
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="请输入用户名"
              disabled={!!editingUser}
            />
          </Form.Item>

          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="请输入邮箱"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="密码"
            rules={[
              { required: !editingUser, message: '请输入密码' },
              { min: 6, message: '密码至少6个字符' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder={editingUser ? '留空则不修改密码' : '请输入密码'}
            />
          </Form.Item>

          <Form.Item
            name="role"
            label="角色"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select placeholder="请选择角色">
              <Option value="user">普通用户</Option>
              <Option value="admin">管理员</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="status"
            label="状态"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select placeholder="请选择状态">
              <Option value="active">正常</Option>
              <Option value="inactive">禁用</Option>
              <Option value="locked">锁定</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingUser ? '更新' : '创建'}
              </Button>
              <Button onClick={hideModal}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default UserManagement
