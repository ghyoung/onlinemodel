// 前端环境变量配置
export const envConfig = {
  // API基础URL - 使用相对路径，通过Vite代理转发到后端
  API_BASE_URL: '/api',
  
  // 应用信息
  APP_TITLE: '湖仓建模工具',
  APP_VERSION: '1.0.0-alpha',
  
  // 开发环境标识
  IS_DEV: true,
  IS_PROD: false,
  
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
