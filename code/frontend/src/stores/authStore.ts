import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import axios from 'axios'

// 用户信息接口
export interface User {
  id: number
  username: string
  email: string
  realName?: string
  role: 'ADMIN' | 'USER' | 'GUEST'
  status: 'ACTIVE' | 'INACTIVE' | 'LOCKED' | 'SUSPENDED'
  avatar?: string
  lastLoginAt: string
}

// 登录请求接口
export interface LoginRequest {
  username: string
  password: string
}

// 注册请求接口
export interface RegisterRequest {
  username: string
  password: string
  email: string
  realName?: string
}

// 认证状态接口
interface AuthState {
  // 状态
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  
  // 用户信息
  user: User | null
  token: string | null
  
  // 操作
  login: (credentials: LoginRequest) => Promise<boolean>
  register: (userData: RegisterRequest) => Promise<boolean>
  logout: () => void
  checkAuth: () => Promise<boolean>
  clearError: () => void
  
  // 检查用户名和邮箱是否存在
  checkUsername: (username: string) => Promise<boolean>
  checkEmail: (email: string) => Promise<boolean>
}

// API基础URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'

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
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器：处理token过期
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token过期，清除本地存储
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // 初始状态
      isAuthenticated: false,
      isLoading: false,
      error: null,
      user: null,
      token: null,

      // 登录
      login: async (credentials: LoginRequest): Promise<boolean> => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await api.post('/auth/login', credentials)
          
          if (response.data.success) {
            const userData = response.data.data
            
            // 保存用户信息到本地存储
            localStorage.setItem('auth_user', JSON.stringify(userData))
            
            set({
              isAuthenticated: true,
              user: userData,
              isLoading: false,
              error: null,
            })
            
            return true
          } else {
            set({
              isLoading: false,
              error: response.data.message || '登录失败',
            })
            return false
          }
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || error.message || '登录失败'
          set({
            isLoading: false,
            error: errorMessage,
          })
          return false
        }
      },

      // 注册
      register: async (userData: RegisterRequest): Promise<boolean> => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await api.post('/auth/register', userData)
          
          if (response.data.success) {
            set({
              isLoading: false,
              error: null,
            })
            
            return true
          } else {
            set({
              isLoading: false,
              error: response.data.message || '注册失败',
            })
            return false
          }
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || error.message || '注册失败'
          set({
            isLoading: false,
            error: errorMessage,
          })
          return false
        }
      },

      // 登出
      logout: () => {
        // 清除本地存储
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
        
        set({
          isAuthenticated: false,
          user: null,
          token: null,
          error: null,
        })
        
        // 跳转到登录页
        window.location.href = '/login'
      },

      // 检查认证状态
      checkAuth: async (): Promise<boolean> => {
        const userStr = localStorage.getItem('auth_user')
        if (!userStr) {
          set({ isAuthenticated: false, user: null })
          return false
        }

        try {
          const user = JSON.parse(userStr)
          
          // 验证用户信息
          const response = await api.get(`/auth/profile?userId=${user.id}`)
          
          if (response.data.success) {
            const updatedUser = response.data.data
            
            // 更新本地存储
            localStorage.setItem('auth_user', JSON.stringify(updatedUser))
            
            set({
              isAuthenticated: true,
              user: updatedUser,
              error: null,
            })
            
            return true
          } else {
            // 用户信息无效，清除本地存储
            localStorage.removeItem('auth_user')
            set({
              isAuthenticated: false,
              user: null,
              error: response.data.message,
            })
            return false
          }
        } catch (error: any) {
          // 发生错误，清除本地存储
          localStorage.removeItem('auth_user')
          set({
            isAuthenticated: false,
            user: null,
            error: error.message || '认证检查失败',
          })
          return false
        }
      },

      // 检查用户名是否存在
      checkUsername: async (username: string): Promise<boolean> => {
        try {
          const response = await api.get(`/auth/check-username?username=${encodeURIComponent(username)}`)
          
          if (response.data.success) {
            return response.data.exists
          }
          return false
        } catch (error) {
          console.error('检查用户名失败:', error)
          return false
        }
      },

      // 检查邮箱是否存在
      checkEmail: async (email: string): Promise<boolean> => {
        try {
          const response = await api.get(`/auth/check-email?email=${encodeURIComponent(email)}`)
          
          if (response.data.success) {
            return response.data.exists
          }
          return false
        } catch (error) {
          console.error('检查邮箱失败:', error)
          return false
        }
      },

      // 清除错误
      clearError: () => {
        set({ error: null })
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
      }),
    }
  )
)

// 初始化时检查认证状态
if (typeof window !== 'undefined') {
  const userStr = localStorage.getItem('auth_user')
  if (userStr) {
    try {
      const user = JSON.parse(userStr)
      useAuthStore.setState({
        isAuthenticated: true,
        user: user,
      })
    } catch (error) {
      console.error('解析用户信息失败:', error)
      localStorage.removeItem('auth_user')
    }
  }
}

export default useAuthStore

