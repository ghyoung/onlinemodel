import axios from 'axios'

// API基础配置 - 直接使用 /api，通过 Vite 代理转发
const API_BASE_URL = '/api'

console.log('🔧 API配置信息:', {
  API_BASE_URL: API_BASE_URL
})

// 创建axios实例
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器：添加token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      console.log('🔑 添加认证令牌:', token.substring(0, 20) + '...')
    } else {
      console.log('⚠️ 未找到认证令牌')
    }
    
    console.log('📡 API请求:', config.method?.toUpperCase(), config.url)
    return config
  },
  (error) => {
    console.error('❌ 请求拦截器错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器：处理token过期和错误
api.interceptors.response.use(
  (response) => {
    console.log('✅ API响应成功:', response.config.url, response.status)
    return response
  },
  (error) => {
    console.error('❌ API请求错误:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message,
      response: error.response?.data
    })
    
    if (error.response?.status === 401) {
      console.log('🔒 认证失败，清除本地存储')
      // Token过期，清除本地存储
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
      
      // 使用更优雅的方式跳转，避免页面刷新
      if (window.location.pathname !== '/login') {
        // 使用replace避免在历史记录中留下当前页面
        window.location.replace('/login')
      }
    }
    return Promise.reject(error)
  }
)

// 导出API实例
export default api

// 导出API基础URL
export { API_BASE_URL }

// 通用API函数
export const getApiUrl = (endpoint: string) => `${API_BASE_URL}${endpoint}`
