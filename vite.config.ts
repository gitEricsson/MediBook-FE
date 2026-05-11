import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 3000,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) return 'vendor-react'
            if (id.includes('@tanstack/react-query')) return 'vendor-query'
            if (id.includes('@tanstack/react-virtual')) return 'vendor-virtual'
            if (id.includes('zustand')) return 'vendor-state'
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
})
