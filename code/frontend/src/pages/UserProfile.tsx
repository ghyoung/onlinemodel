import React, { useState, useEffect } from 'react'
import {
  Card,
  Form,
  Input,
  Button,
  message,
  Row,
  Col,
  Divider,
  Descriptions,
  Avatar,
  Tag,
  Space,
  Alert
} from 'antd'
import {
  UserOutlined,
  MailOutlined,
  LockOutlined,
  CalendarOutlined,
  SafetyOutlined
} from '@ant-design/icons'
import api from '@/config/api'
import { useAuthStore } from '@/stores/authStore'

const UserProfile: React.FC = () => {
  const { user, checkAuth } = useAuthStore()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [userInfo, setUserInfo] = useState(user)

  useEffect(() => {
    if (user) {
      setUserInfo(user)
      form.setFieldsValue({
        username: user.username,
        email: user.email
      })
    }
  }, [user, form])

  // 处理表单提交
  const handleSubmit = async (values: any) => {
    setLoading(true)
    try {
      const response = await api.put('/auth/me', values)
      
      if (response.data.success) {
        message.success('个人信息更新成功')
        setEditing(false)
        // 重新获取用户信息
        await checkAuth()
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || '更新失败'
      message.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // 处理密码修改
  const handlePasswordChange = async (values: any) => {
    setLoading(true)
    try {
      const response = await api.put('/auth/me', {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword
      })
      
      if (response.data.success) {
        message.success('密码修改成功')
        form.resetFields(['currentPassword', 'newPassword', 'confirmPassword'])
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || '密码修改失败'
      message.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (!userInfo) {
    return <div>加载中...</div>
  }

  return (
    <div style={{ padding: '24px' }}>
      <Row gutter={24}>
        <Col span={16}>
          {/* 基本信息 */}
          <Card 
            title="基本信息" 
            extra={
              <Button 
                type={editing ? "default" : "primary"}
                onClick={() => setEditing(!editing)}
              >
                {editing ? '取消' : '编辑'}
              </Button>
            }
            style={{ marginBottom: '24px' }}
          >
            {editing ? (
              <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                initialValues={{
                  username: userInfo.username,
                  email: userInfo.email
                }}
              >
                <Form.Item
                  name="username"
                  label="用户名"
                  rules={[
                    { required: true, message: '请输入用户名' },
                    { min: 3, message: '用户名至少3个字符' }
                  ]}
                >
                  <Input
                    prefix={<UserOutlined />}
                    placeholder="用户名"
                    disabled
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
                    placeholder="邮箱"
                  />
                </Form.Item>

                <Form.Item>
                  <Space>
                    <Button type="primary" htmlType="submit" loading={loading}>
                      保存
                    </Button>
                    <Button onClick={() => setEditing(false)}>
                      取消
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            ) : (
              <Descriptions column={1}>
                <Descriptions.Item label="用户名">
                  <Space>
                    <UserOutlined />
                    {userInfo.username}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="邮箱">
                  <Space>
                    <MailOutlined />
                    {userInfo.email}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="角色">
                  <Tag color={userInfo.role === 'admin' ? 'red' : 'blue'}>
                    {userInfo.role === 'admin' ? '管理员' : '普通用户'}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="状态">
                  <Tag color={userInfo.status === 'active' ? 'green' : 'orange'}>
                    {userInfo.status === 'active' ? '正常' : '禁用'}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="创建时间">
                  <Space>
                    <CalendarOutlined />
                    {new Date(userInfo.created_at).toLocaleString('zh-CN')}
                  </Space>
                </Descriptions.Item>
                {userInfo.last_login_at && (
                  <Descriptions.Item label="最后登录">
                    <Space>
                      <CalendarOutlined />
                      {new Date(userInfo.last_login_at).toLocaleString('zh-CN')}
                    </Space>
                  </Descriptions.Item>
                )}
              </Descriptions>
            )}
          </Card>

          {/* 修改密码 */}
          <Card title="修改密码" style={{ marginBottom: '24px' }}>
            <Form
              layout="vertical"
              onFinish={handlePasswordChange}
            >
              <Form.Item
                name="currentPassword"
                label="当前密码"
                rules={[
                  { required: true, message: '请输入当前密码' },
                  { min: 6, message: '密码至少6个字符' }
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="请输入当前密码"
                />
              </Form.Item>

              <Form.Item
                name="newPassword"
                label="新密码"
                rules={[
                  { required: true, message: '请输入新密码' },
                  { min: 6, message: '密码至少6个字符' }
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="请输入新密码"
                />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                label="确认新密码"
                dependencies={['newPassword']}
                rules={[
                  { required: true, message: '请确认新密码' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) {
                        return Promise.resolve()
                      }
                      return Promise.reject(new Error('两次输入的密码不一致'))
                    },
                  }),
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="请确认新密码"
                />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading}>
                  修改密码
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col span={8}>
          {/* 用户头像和统计信息 */}
          <Card title="账户信息" style={{ marginBottom: '24px' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <Avatar 
                size={80} 
                icon={<UserOutlined />}
                style={{ backgroundColor: '#1890ff' }}
              />
              <div style={{ marginTop: '16px' }}>
                <h3>{userInfo.username}</h3>
                <Tag color={userInfo.role === 'admin' ? 'red' : 'blue'}>
                  {userInfo.role === 'admin' ? '管理员' : '普通用户'}
                </Tag>
              </div>
            </div>

            <Divider />

            <Descriptions column={1} size="small">
              <Descriptions.Item label="账户状态">
                <Tag color={userInfo.status === 'active' ? 'green' : 'orange'}>
                  {userInfo.status === 'active' ? '正常' : '禁用'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="注册时间">
                {new Date(userInfo.created_at).toLocaleDateString('zh-CN')}
              </Descriptions.Item>
              {userInfo.last_login_at && (
                <Descriptions.Item label="最后登录">
                  {new Date(userInfo.last_login_at).toLocaleDateString('zh-CN')}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>

          {/* 安全提示 */}
          <Card title="安全提示">
            <Alert
              message="账户安全"
              description="请定期修改密码，不要将密码告诉他人。如发现异常登录，请及时联系管理员。"
              type="info"
              showIcon
              style={{ marginBottom: '16px' }}
            />
            
            <Alert
              message="密码要求"
              description="密码至少6位，建议包含字母、数字和特殊字符，提高安全性。"
              type="warning"
              showIcon
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default UserProfile
