import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  server: {
    port: 3002,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          antd: ['antd', '@ant-design/icons'],
          utils: ['lodash-es', 'dayjs', 'axios']
        }
      }
    }
  },
  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
        modifyVars: {
          'primary-color': '#1890FF',
          'link-color': '#1890FF',
          'success-color': '#52C41A',
          'warning-color': '#FAAD14',
          'error-color': '#F5222D',
          'font-size-base': '14px',
          'heading-color': '#262626',
          'text-color': '#595959',
          'text-color-secondary': '#8C8C8C',
          'disabled-color': '#BFBFBF',
          'border-radius-base': '4px',
          'border-color-base': '#D9D9D9',
          'box-shadow-base': '0 2px 8px rgba(0, 0, 0, 0.1)'
        }
      }
    }
  }
})

