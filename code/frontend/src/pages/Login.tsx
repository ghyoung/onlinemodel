import React, { useState, useEffect } from 'react'
import { Form, Input, Button, Card, message, Tabs, Divider } from 'antd'
import { UserOutlined, LockOutlined, MailOutlined, UserAddOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import type { LoginRequest, RegisterRequest } from '@/stores/authStore'

const { TabPane } = Tabs

const Login: React.FC = () => {
  const navigate = useNavigate()
  const { login, register, isAuthenticated, isLoading, error, clearError } = useAuthStore()
  
  const [loginForm] = Form.useForm()
  const [registerForm] = Form.useForm()
  const [activeTab, setActiveTab] = useState('login')
  const [isCheckingUsername, setIsCheckingUsername] = useState(false)
  const [isCheckingEmail, setIsCheckingEmail] = useState(false)
  const [usernameExists, setUsernameExists] = useState(false)
  const [emailExists, setEmailExists] = useState(false)

  // 如果已经认证，跳转到首页
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard')
    }
  }, [isAuthenticated, navigate])

  // 清除错误信息
  useEffect(() => {
    if (error) {
      message.error(error)
      clearError()
    }
  }, [error, clearError])

  // 处理登录
  const handleLogin = async (values: LoginRequest) => {
    const success = await login(values)
    if (success) {
      message.success('登录成功')
      navigate('/dashboard')
    }
  }

  // 处理注册
  const handleRegister = async (values: RegisterRequest) => {
    // 检查用户名和邮箱是否已存在
    if (usernameExists) {
      message.error('用户名已存在')
      return
    }
    if (emailExists) {
      message.error('邮箱已存在')
      return
    }

    const success = await register(values)
    if (success) {
      message.success('注册成功，请登录')
      setActiveTab('login')
      registerForm.resetFields()
    }
  }

  // 检查用户名是否存在
  const handleUsernameBlur = async (username: string) => {
    if (!username || username.length < 3) return
    
    setIsCheckingUsername(true)
    try {
      const exists = await useAuthStore.getState().checkUsername(username)
      setUsernameExists(exists)
      if (exists) {
        registerForm.setFields([
          {
            name: 'username',
            errors: ['用户名已存在']
          }
        ])
      } else {
        registerForm.setFields([
          {
            name: 'username',
            errors: []
          }
        ])
      }
    } catch (error) {
      console.error('检查用户名失败:', error)
    } finally {
      setIsCheckingUsername(false)
    }
  }

  // 检查邮箱是否存在
  const handleEmailBlur = async (email: string) => {
    if (!email) return
    
    setIsCheckingEmail(true)
    try {
      const exists = await useAuthStore.getState().checkEmail(email)
      setEmailExists(exists)
      if (exists) {
        registerForm.setFields([
          {
            name: 'email',
            errors: ['邮箱已存在']
          }
        ])
      } else {
        registerForm.setFields([
          {
            name: 'email',
            errors: []
          }
        ])
      }
    } catch (error) {
      console.error('检查邮箱失败:', error)
    } finally {
      setIsCheckingEmail(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <Card
        style={{
          width: '100%',
          maxWidth: '400px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          borderRadius: '16px'
        }}
        bodyStyle={{ padding: '32px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1 style={{ 
            fontSize: '28px', 
            fontWeight: 'bold', 
            color: '#1890ff',
            margin: '0 0 8px 0'
          }}>
            湖仓建模工具
          </h1>
          <p style={{ 
            fontSize: '14px', 
            color: '#666',
            margin: 0
          }}>
            一站式湖仓建模平台
          </p>
        </div>

        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          centered
          size="large"
        >
          <TabPane 
            tab={
              <span>
                <UserOutlined />
                登录
              </span>
            } 
            key="login"
          >
            <Form
              form={loginForm}
              onFinish={handleLogin}
              layout="vertical"
              size="large"
            >
              <Form.Item
                name="username"
                rules={[
                  { required: true, message: '请输入用户名' },
                  { min: 3, message: '用户名至少3个字符' }
                ]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="用户名"
                  autoComplete="username"
                />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[
                  { required: true, message: '请输入密码' },
                  { min: 6, message: '密码至少6个字符' }
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="密码"
                  autoComplete="current-password"
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={isLoading}
                  style={{ width: '100%', height: '44px' }}
                >
                  登录
                </Button>
              </Form.Item>
            </Form>
          </TabPane>

          <TabPane 
            tab={
              <span>
                <UserAddOutlined />
                注册
              </span>
            } 
            key="register"
          >
            <Form
              form={registerForm}
              onFinish={handleRegister}
              layout="vertical"
              size="large"
            >
              <Form.Item
                name="username"
                rules={[
                  { required: true, message: '请输入用户名' },
                  { min: 3, message: '用户名至少3个字符' },
                  { max: 50, message: '用户名不能超过50个字符' },
                  { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线' }
                ]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="用户名"
                  autoComplete="username"
                  onBlur={(e) => handleUsernameBlur(e.target.value)}
                  suffix={isCheckingUsername ? '检查中...' : ''}
                />
              </Form.Item>

              <Form.Item
                name="email"
                rules={[
                  { required: true, message: '请输入邮箱' },
                  { type: 'email', message: '请输入有效的邮箱地址' }
                ]}
              >
                <Input
                  prefix={<MailOutlined />}
                  placeholder="邮箱"
                  autoComplete="email"
                  onBlur={(e) => handleEmailBlur(e.target.value)}
                  suffix={isCheckingEmail ? '检查中...' : ''}
                />
              </Form.Item>

              <Form.Item
                name="realName"
                rules={[
                  { max: 100, message: '真实姓名不能超过100个字符' }
                ]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="真实姓名（可选）"
                  autoComplete="name"
                />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[
                  { required: true, message: '请输入密码' },
                  { min: 6, message: '密码至少6个字符' }
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="密码"
                  autoComplete="new-password"
                />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                dependencies={['password']}
                rules={[
                  { required: true, message: '请确认密码' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve()
                      }
                      return Promise.reject(new Error('两次输入的密码不一致'))
                    },
                  }),
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="确认密码"
                  autoComplete="new-password"
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={isLoading}
                  style={{ width: '100%', height: '44px' }}
                >
                  注册
                </Button>
              </Form.Item>
            </Form>
          </TabPane>
        </Tabs>

        <Divider />

        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '12px', color: '#999', margin: 0 }}>
            默认管理员账户：admin / admin123
          </p>
        </div>
      </Card>
    </div>
  )
}

export default Login

