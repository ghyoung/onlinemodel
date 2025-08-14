import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '@/config/api'

// 用户信息接口
export interface User {
  id: number
  username: string
  email: string
  role: 'admin' | 'user'
  status: 'active' | 'inactive' | 'locked' | 'deleted'
  created_at: string
  updated_at: string
  last_login_at?: string
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
  role?: 'admin' | 'user'
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
            const token = response.data.token
            
            // 保存用户信息和token到本地存储
            localStorage.setItem('auth_token', token)
            localStorage.setItem('auth_user', JSON.stringify(userData))
            
            set({
              isAuthenticated: true,
              user: userData,
              token: token,
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
        const token = localStorage.getItem('auth_token')
        const userStr = localStorage.getItem('auth_user')
        
        if (!token || !userStr) {
          set({ isAuthenticated: false, user: null, token: null })
          return false
        }

        try {
          const user = JSON.parse(userStr)
          
          // 验证用户信息
          const response = await api.get('/auth/me')
          
          if (response.data.success) {
            const updatedUser = response.data.data
            
            // 更新本地存储
            localStorage.setItem('auth_user', JSON.stringify(updatedUser))
            
            set({
              isAuthenticated: true,
              user: updatedUser,
              token: token,
              error: null,
            })
            
            return true
          } else {
            // 用户信息无效，但不立即清除本地存储，让API拦截器处理
            console.log('用户信息验证失败:', response.data.message)
            set({
              isAuthenticated: false,
              user: null,
              token: null,
              error: response.data.message,
            })
            return false
          }
        } catch (error: any) {
          // 发生错误，但不立即清除本地存储，让API拦截器处理
          console.log('认证检查出错:', error.message)
          set({
            isAuthenticated: false,
            user: null,
            token: null,
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
        token: state.token,
      }),
    }
  )
)

// 初始化时检查认证状态
if (typeof window !== 'undefined') {
  const token = localStorage.getItem('auth_token')
  const userStr = localStorage.getItem('auth_user')
  
  if (token && userStr) {
    try {
      const user = JSON.parse(userStr)
      // 只在初始化时设置状态，不触发重新渲染
      useAuthStore.setState({
        isAuthenticated: true,
        user: user,
        token: token,
      })
    } catch (error) {
      console.error('解析用户信息失败:', error)
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
    }
  }
}

export default useAuthStore

