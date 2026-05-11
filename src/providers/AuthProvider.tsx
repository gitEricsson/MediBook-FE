import React, { useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { AuthService } from '@/services/auth.service';
import { useQueryClient } from '@tanstack/react-query';

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { setAuthenticated, setUnauthenticated, setLoading } = useAuthStore();
  const queryClient = useQueryClient();

  const handleLogout = useCallback(() => {
    setUnauthenticated();
    queryClient.clear();
  }, [setUnauthenticated, queryClient]);

  const initAuth = useCallback(async () => {
    const refreshToken = useAuthStore.getState().refreshToken;
    if (!refreshToken) {
      setUnauthenticated();
      return;
    }

    setLoading();
    try {
      // Attempt to refresh the session on boot
      const data = await AuthService.refresh({ refreshToken });
      const userData = await AuthService.getCurrentUser();
      setAuthenticated(userData, data.accessToken, data.refreshToken ?? '');
    } catch {
      setUnauthenticated();
    }
  }, [setAuthenticated, setUnauthenticated, setLoading]);

  useEffect(() => {
    initAuth();

    // Listen for global logout events (e.g. from API interceptors)
    window.addEventListener('auth:logout', handleLogout);
    
    return () => {
      window.removeEventListener('auth:logout', handleLogout);
    };
  }, [initAuth, handleLogout]);

  return <>{children}</>;
};
