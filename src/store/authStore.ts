import { create } from 'zustand'
import { logger } from '@/lib/logger'
import type { UserRole } from '@/types/domain'

interface AuthState {
  userId: string | null
  role: UserRole | null
  email: string | null
  isAuthenticated: boolean
  login: (userId: string, role: UserRole, email: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  userId: null,
  role: null,
  email: null,
  isAuthenticated: false,

  login: (userId, role, email) => {
    logger.info('auth:login', { userId, role })
    set({ userId, role, email, isAuthenticated: true })
  },

  logout: () => {
    logger.info('auth:logout')
    set({ userId: null, role: null, email: null, isAuthenticated: false })
  },
}))
