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

    // Retry up to 2 times on transient network failures
    const MAX_RETRIES = 2;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const data = await AuthService.refresh({ refreshToken });
        const userData = await AuthService.getCurrentUser();
        setAuthenticated(userData, data.accessToken, data.refreshToken || refreshToken);
        return; // success — exit
      } catch (err: unknown) {
        const isLastAttempt = attempt === MAX_RETRIES;
        // Only retry on network errors, not on 401/403 (invalid token)
        const isNetworkError =
          err instanceof Error &&
          (err.message === 'Network Error' || ('code' in err && (err as Record<string, unknown>).code === 'ERR_NETWORK'));

        if (isLastAttempt || !isNetworkError) {
          setUnauthenticated();
          return;
        }
        // Brief delay before retry
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
      }
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
