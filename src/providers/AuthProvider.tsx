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
    setLoading();
    try {
      // Attempt to refresh the session on boot
      const data = await AuthService.refresh();
      const userData = await AuthService.getCurrentUser();
      // Fix 3: Pass the refreshToken from the refresh response
      setAuthenticated(userData, data.accessToken, data.refreshToken ?? '');
    } catch (error) {
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
