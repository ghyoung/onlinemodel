import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ErrorBoundary } from 'react-error-boundary'
import zhCN from 'antd/locale/zh_CN'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'

import App from './App'
import ErrorFallback from './components/ErrorFallback'
import './styles/index.css'

// 添加调试日志
console.log('🚀 应用开始初始化')

// 配置dayjs中文语言包
dayjs.locale('zh-cn')
console.log('📅 dayjs中文语言包配置完成')

// 创建React Query客户端
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5分钟
    },
    mutations: {
      retry: 1,
    },
  },
})
console.log('🔍 React Query客户端创建完成')

// 检查DOM元素
const rootElement = document.getElementById('root')
console.log('🎯 查找root元素:', rootElement)

if (!rootElement) {
  console.error('❌ 找不到root元素，无法渲染应用')
  throw new Error('找不到root元素')
}

console.log('✅ 开始渲染React应用')

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <QueryClientProvider client={queryClient}>
        <ConfigProvider locale={zhCN}>
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true
            }}
          >
            <App />
          </BrowserRouter>
        </ConfigProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)

console.log('🎉 React应用渲染完成')

