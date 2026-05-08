import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/query-client'
import { AuthProvider } from './providers/AuthProvider'
import { RealtimeProvider } from './providers/RealtimeProvider'
import { GlobalErrorBoundary } from './components/feedback/GlobalErrorBoundary'
import { Toaster } from 'sonner'
import './index.css'
import '@/styles/globals.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GlobalErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RealtimeProvider>
            <App />
            <Toaster position="top-right" richColors />
          </RealtimeProvider>
        </AuthProvider>
      </QueryClientProvider>
    </GlobalErrorBoundary>
  </StrictMode>,
)
