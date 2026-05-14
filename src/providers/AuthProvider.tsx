import React, { useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { AuthService } from '@/services/auth.service';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { setAuthenticated, setUnauthenticated, clearAllTokens, setLoading } = useAuthStore();
  const queryClient = useQueryClient();

  const handleLogout = useCallback((event?: Event) => {
    clearAllTokens();
    queryClient.clear();

    // If logout event contains a message, show it as a toast
    const customEvent = event as CustomEvent | undefined;
    if (customEvent?.detail?.message) {
      toast.info(customEvent.detail.message);
    }
  }, [clearAllTokens, queryClient]);

  const handleAccessDenied = useCallback((event?: Event) => {
    const customEvent = event as CustomEvent | undefined;
    const message = customEvent?.detail?.message || 'Access denied';
    toast.error(message);
  }, []);

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
      setAuthenticated(userData, data.accessToken, data.refreshToken || refreshToken);
    } catch {
      setUnauthenticated();
    }
  }, [setAuthenticated, setUnauthenticated, setLoading]);

  useEffect(() => {
    initAuth();

    // Listen for global logout events (e.g. from API interceptors on 401 with SESSION_EXPIRED code)
    const logoutListener = (event: Event) => handleLogout(event);
    const accessDeniedListener = (event: Event) => handleAccessDenied(event);

    window.addEventListener('auth:logout', logoutListener);
    window.addEventListener('auth:access-denied', accessDeniedListener);

    return () => {
      window.removeEventListener('auth:logout', logoutListener);
      window.removeEventListener('auth:access-denied', accessDeniedListener);
    };
  }, [initAuth, handleLogout, handleAccessDenied]);

  return <>{children}</>;
};
