import React, { useState, useEffect } from 'react'
import { Form, Input, Button, Card, message, Tabs, Divider, Spin } from 'antd'
import { UserOutlined, LockOutlined, MailOutlined, UserAddOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import type { LoginRequest, RegisterRequest } from '@/stores/authStore'

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
  const [pageLoading, setPageLoading] = useState(true)

  // 添加调试日志
  console.log('🔍 Login组件渲染 - pageLoading:', pageLoading)
  console.log('🔍 Login组件渲染 - isAuthenticated:', isAuthenticated)
  console.log('🔍 Login组件渲染 - isLoading:', isLoading)

  // 页面初始化
  useEffect(() => {
    console.log('🚀 Login组件初始化 - 开始设置定时器')
    
    // 立即设置加载状态为false（调试用）
    console.log('🔧 立即设置pageLoading为false（调试）')
    setPageLoading(false)
    
    // 模拟页面加载完成
    const timer = setTimeout(() => {
      console.log('⏰ 定时器触发 - 设置pageLoading为false')
      setPageLoading(false)
    }, 500)
    
    console.log('⏰ 定时器已设置，500ms后执行')
    
    return () => {
      console.log('🧹 清理定时器')
      clearTimeout(timer)
    }
  }, [])

  // 监听pageLoading状态变化
  useEffect(() => {
    console.log('📊 pageLoading状态变化:', pageLoading)
  }, [pageLoading])

  // 如果已经认证，跳转到首页
  useEffect(() => {
    console.log('🔐 认证状态检查 - isAuthenticated:', isAuthenticated)
    if (isAuthenticated) {
      console.log('🔄 用户已认证，跳转到dashboard')
      navigate('/dashboard')
    }
  }, [isAuthenticated, navigate])

  // 清除错误信息
  useEffect(() => {
    console.log('❌ 错误状态检查 - error:', error)
    if (error) {
      message.error(error)
      clearError()
    }
  }, [error, clearError])

  // 强制设置加载状态为false（调试用）
  const forceSetLoaded = () => {
    console.log('🔧 强制设置加载状态为false')
    setPageLoading(false)
  }

  // 强制刷新页面（调试用）
  const forceRefresh = () => {
    console.log('🔄 强制刷新页面')
    window.location.reload()
  }

  // 检查所有状态（调试用）
  const checkAllStates = () => {
    console.log('🔍 当前所有状态:')
    console.log('  - pageLoading:', pageLoading)
    console.log('  - isAuthenticated:', isAuthenticated)
    console.log('  - isLoading:', isLoading)
    console.log('  - error:', error)
    console.log('  - activeTab:', activeTab)
    console.log('  - localStorage token:', localStorage.getItem('auth_token'))
    console.log('  - localStorage user:', localStorage.getItem('auth_user'))
  }

  // 处理登录
  const handleLogin = async (values: LoginRequest) => {
    try {
      const success = await login(values)
      if (success) {
        message.success('登录成功')
        navigate('/dashboard')
      }
    } catch (error) {
      console.error('登录失败:', error)
      message.error('登录失败，请重试')
    }
  }

  // 处理注册
  const handleRegister = async (values: RegisterRequest) => {
    try {
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
    } catch (error) {
      console.error('注册失败:', error)
      message.error('注册失败，请重试')
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

  // 如果页面还在加载，显示加载状态
  if (pageLoading) {
    console.log('⏳ 显示加载状态')
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column'
      }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px', color: 'white' }}>正在加载...</div>
        
        {/* 调试按钮 */}
        <div style={{ marginTop: '20px' }}>
          <Button 
            type="primary" 
            onClick={forceSetLoaded}
            style={{ background: '#ff4d4f', borderColor: '#ff4d4f', marginRight: '10px' }}
          >
            强制加载完成
          </Button>
          <Button 
            onClick={checkAllStates}
            style={{ marginRight: '10px' }}
          >
            检查状态
          </Button>
          <Button 
            onClick={forceRefresh}
            type="dashed"
          >
            刷新页面
          </Button>
        </div>
        
        <div style={{ marginTop: '10px', color: '#ffccc7', fontSize: '12px' }}>
          如果页面一直加载，请点击上方按钮进行调试
        </div>
        
        {/* 显示当前状态信息 */}
        <div style={{ marginTop: '20px', padding: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}>
          <div style={{ color: '#fff', fontSize: '12px', textAlign: 'left' }}>
            <div>pageLoading: {pageLoading.toString()}</div>
            <div>isAuthenticated: {isAuthenticated.toString()}</div>
            <div>isLoading: {isLoading.toString()}</div>
            <div>error: {error || 'null'}</div>
          </div>
        </div>
        
        {/* 测试渲染 */}
        <div style={{ marginTop: '20px', padding: '10px', background: 'rgba(255,255,255,0.2)', borderRadius: '4px' }}>
          <div style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>
            测试渲染 - 如果你能看到这个，说明组件正在工作
          </div>
          <div style={{ color: '#fff', fontSize: '12px', marginTop: '5px' }}>
            当前时间: {new Date().toLocaleString()}
          </div>
        </div>
      </div>
    )
  }

  console.log('✅ 显示登录页面内容')

  // 定义 Tabs 的 items
  const tabItems = [
    {
      key: 'login',
      label: (
        <span>
          <UserOutlined />
          登录
        </span>
      ),
      children: (
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
      )
    },
    {
      key: 'register',
      label: (
        <span>
          <UserAddOutlined />
          注册
        </span>
      ),
      children: (
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
      )
    }
  ]

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
        styles={{ body: { padding: '32px' } }}
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
          items={tabItems}
        />

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

