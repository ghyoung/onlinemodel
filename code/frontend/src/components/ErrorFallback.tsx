import React from 'react'
import { Button, Result } from 'antd'
import { useNavigate } from 'react-router-dom'

interface ErrorFallbackProps {
  error: Error
  resetErrorBoundary: () => void
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetErrorBoundary }) => {
  const navigate = useNavigate()

  const handleGoHome = () => {
    navigate('/dashboard')
    resetErrorBoundary()
  }

  const handleRetry = () => {
    resetErrorBoundary()
  }

  return (
    <Result
      status="error"
      title="应用出现错误"
      subTitle="抱歉，应用遇到了一个意外错误。请尝试刷新页面或返回首页。"
      extra={[
        <Button type="primary" key="retry" onClick={handleRetry}>
          重试
        </Button>,
        <Button key="home" onClick={handleGoHome}>
          返回首页
        </Button>
      ]}
    >
      {process.env.NODE_ENV === 'development' && (
        <details style={{ marginTop: 16 }}>
          <summary>错误详情</summary>
          <pre style={{ 
            background: '#f5f5f5', 
            padding: 16, 
            borderRadius: 4,
            overflow: 'auto',
            fontSize: 12
          }}>
            {error.stack}
          </pre>
        </details>
      )}
    </Result>
  )
}

export default ErrorFallback

