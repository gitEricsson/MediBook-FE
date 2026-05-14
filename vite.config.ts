import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: {
    host: 'localhost',
    port: 3000,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    sourcemap: mode === 'production' ? false : true,
    minify: 'esbuild',
    target: 'es2022',
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) return 'vendor-react'
            if (id.includes('@tanstack/react-query')) return 'vendor-query'
            if (id.includes('@tanstack/react-virtual')) return 'vendor-virtual'
            if (id.includes('zustand')) return 'vendor-state'
            if (id.includes('twilio-video')) return 'vendor-twilio'
            if (id.includes('@stomp')) return 'vendor-stomp'
            return 'vendor'
          }
          if (id.includes('src/features/auth')) return 'feature-auth'
          if (id.includes('src/features/patient')) return 'feature-patient'
          if (id.includes('src/features/doctor')) return 'feature-doctor'
          if (id.includes('src/features/admin')) return 'feature-admin'
        },
      },
    },
  },
}))
