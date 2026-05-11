import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { UserRole } from '@/types/domain';

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated' | '2fa_required';

interface User {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
}

interface AuthState {
  user: User | null;
  status: AuthStatus;
  accessToken: string | null;
  refreshToken: string | null;
  
  // Actions
  setAuthenticated: (user: User, accessToken: string, refreshToken: string) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUnauthenticated: () => void;
  set2FARequired: () => void;
  setLoading: () => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        status: 'idle',
        accessToken: null,
        refreshToken: null,

        setAuthenticated: (user, accessToken, refreshToken) => 
          set({ user, accessToken, refreshToken, status: 'authenticated' }, false, 'auth/setAuthenticated'),

        setTokens: (accessToken, refreshToken) =>
          set({ accessToken, refreshToken }, false, 'auth/setTokens'),

        setUnauthenticated: () => 
          set({ user: null, accessToken: null, refreshToken: null, status: 'unauthenticated' }, false, 'auth/setUnauthenticated'),

        set2FARequired: () => 
          set({ status: '2fa_required' }, false, 'auth/set2FARequired'),

        setLoading: () => 
          set({ status: 'loading' }, false, 'auth/setLoading'),

        updateUser: (updates) => 
          set((state) => ({
            user: state.user ? { ...state.user, ...updates } : null
          }), false, 'auth/updateUser'),
      }),
      {
        name: 'medibook-auth',
        partialize: (state) => ({ refreshToken: state.refreshToken }), // only persist token, not user/accessToken
      }
    ),
    { name: 'MediBook Auth Store' }
  )
);
