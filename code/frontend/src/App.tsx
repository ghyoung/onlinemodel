import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
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
import ErrorPage from '@/pages/Error'

// 受保护的路由组件
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore()
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  return <>{children}</>
}

const App: React.FC = () => {
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
      </Route>
      
      {/* 404路由 */}
      <Route path="*" element={<Navigate to="/error" replace />} />
    </Routes>
  )
}

export default App

