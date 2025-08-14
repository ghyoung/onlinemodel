import React, { useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

import Layout from '@/components/Layout'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import DataSourceManagement from '@/pages/DataSourceManagement'
import ModelManagement from '@/pages/ModelManagement'
import OnlineModeling from '@/pages/OnlineModeling'
import DDLImport from '@/pages/DDLImport'
import FieldLibrary from '@/pages/FieldLibrary'
import Lineage from '@/pages/Lineage'
import DataGovernance from '@/pages/DataGovernance'
import SystemSettings from '@/pages/SystemSettings'
import UserManagement from '@/pages/UserManagement'
import UserProfile from '@/pages/UserProfile'
import ErrorPage from '@/pages/Error'

// 受保护的路由组件
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, checkAuth } = useAuthStore()
  
  console.log('🔒 ProtectedRoute检查 - isAuthenticated:', isAuthenticated)
  
  // 添加认证状态检查
  useEffect(() => {
    const verifyAuth = async () => {
      if (!isAuthenticated) {
        console.log('🔍 用户未认证，尝试检查认证状态...')
        const authResult = await checkAuth()
        if (!authResult) {
          console.log('🚫 认证检查失败，重定向到登录页')
          // 使用window.location.replace进行重定向，避免useNavigate的问题
          window.location.replace('/login')
        }
      }
    }
    
    verifyAuth()
  }, [isAuthenticated, checkAuth])
  
  if (!isAuthenticated) {
    console.log('🚫 用户未认证，显示加载状态')
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '16px',
        color: '#666'
      }}>
        正在验证身份...
      </div>
    )
  }
  
  console.log('✅ 用户已认证，显示受保护内容')
  return <>{children}</>
}

// 管理员路由组件
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuthStore()
  
  console.log('👑 AdminRoute检查 - user role:', user?.role)
  
  if (user?.role !== 'admin') {
    console.log('🚫 用户不是管理员，重定向到dashboard')
    return <Navigate to="/dashboard" replace />
  }
  
  console.log('✅ 用户是管理员，显示管理员内容')
  return <>{children}</>
}

const App: React.FC = () => {
  console.log('🎭 App组件渲染')
  
  return (
    <Routes>
      {/* 公开路由 */}
      <Route path="/login" element={<Login />} />
      <Route path="/error" element={<ErrorPage />} />
      
      {/* 受保护的路由 */}
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="data-source" element={<DataSourceManagement />} />
        <Route path="model" element={<ModelManagement />} />
        <Route path="modeling" element={<OnlineModeling />} />
        <Route path="ddl-import" element={<DDLImport />} />
        <Route path="field-library" element={<FieldLibrary />} />
        <Route path="lineage" element={<Lineage />} />
        <Route path="data-governance" element={<DataGovernance />} />
        <Route path="system" element={<SystemSettings />} />
        <Route path="profile" element={<UserProfile />} />
        <Route path="user-management" element={
          <AdminRoute>
            <UserManagement />
          </AdminRoute>
        } />
      </Route>
      
      {/* 404路由 */}
      <Route path="*" element={<Navigate to="/error" replace />} />
    </Routes>
  )
}

export default App

