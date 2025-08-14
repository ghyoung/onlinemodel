// 环境配置
export const config = {
  // API基础URL
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  
  // 应用信息
  APP_TITLE: import.meta.env.VITE_APP_TITLE || '湖仓建模工具',
  APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0-alpha',
  
  // 开发环境标识
  IS_DEV: import.meta.env.DEV,
  IS_PROD: import.meta.env.PROD,
  
  // 请求配置
  REQUEST_TIMEOUT: 10000,
  REQUEST_RETRY_COUNT: 3,
  
  // 分页配置
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: ['10', '20', '50', '100'],
  
  // 文件上传配置
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: ['.sql', '.txt', '.csv', '.xlsx', '.xls'],
  
  // 缓存配置
  CACHE_EXPIRE_TIME: 5 * 60 * 1000, // 5分钟
  
  // 主题配置
  THEME: {
    PRIMARY_COLOR: '#1890ff',
    SUCCESS_COLOR: '#52c41a',
    WARNING_COLOR: '#faad14',
    ERROR_COLOR: '#f5222d',
  }
}

// 获取完整的API URL
export const getApiUrl = (endpoint: string): string => {
  return `${config.API_BASE_URL}${endpoint}`
}

// 检查是否为开发环境
export const isDevelopment = (): boolean => {
  return config.IS_DEV || window.location.hostname === 'localhost'
}

// 获取环境标识
export const getEnvironment = (): string => {
  if (config.IS_DEV) return 'development'
  if (config.IS_PROD) return 'production'
  return 'unknown'
}
