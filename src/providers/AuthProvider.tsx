import React, { useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { AuthService } from '@/services/auth.service';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * Standard JWT bootstrap — the canonical "access + refresh" pattern.
 *
 * Reload behaviour:
 *
 *   1. Only the refresh token is persisted (XSS hardening — see authStore).
 *      The access token lives in memory and is gone after reload.
 *
 *   2. On reload, if there is no persisted refresh token → log out
 *      immediately, no network call.
 *
 *   3. Otherwise just call {@code GET /api/v1/me}. The access token is
 *      missing, so the server returns 401. The {@code apiClient} response
 *      interceptor (src/lib/api/client.ts) catches it, calls
 *      {@code /auth/refresh} **once** — its `isRefreshing` + `failedQueue`
 *      pair ensures that even in StrictMode (where this effect mounts → run →
 *      cleanup → run again twice) and even with concurrent requests, exactly
 *      one rotation happens per access-token-expiry event — stores the
 *      rotated tokens, and retries /me transparently. The promise resolves
 *      with the user payload.
 *
 *   4. We **never** call {@code /auth/refresh} eagerly. A refresh token
 *      exists to rescue a failing request, not to drive every cold start.
 *      Eager refresh is what previously tripped the backend's reuse
 *      detector when StrictMode double-mounted in dev — the production
 *      behaviour was the same logical mistake, just less visible because
 *      effects don't run twice. The fix is structural: only the interceptor
 *      ever talks to /auth/refresh, gated by its single-rotation lock.
 *
 *   5. The interceptor distinguishes auth failures from transport failures
 *      when refresh fails: only an actual 401/403 from /auth/refresh
 *      dispatches {@code auth:logout} ("Session expired"). Network errors
 *      reject quietly so we don't kick the user out for a flaky uplink.
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { setAuthenticated, setUnauthenticated, clearAllTokens, setLoading } = useAuthStore();
  const queryClient = useQueryClient();

  const handleLogout = useCallback((event?: Event) => {
    clearAllTokens();
    queryClient.clear();

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
      // Single call. The 401-refresh-retry dance is handled by the apiClient
      // interceptor — see src/lib/api/client.ts. If the refresh token is
      // revoked/expired the interceptor dispatches `auth:logout`, our listener
      // above catches it and clears the store.
      const user = await AuthService.getCurrentUser();
      const { accessToken, refreshToken: latestRefresh } = useAuthStore.getState();
      // accessToken is populated by the interceptor's rotation. Fall back to
      // the persisted refresh token (which may have been rotated to a new
      // value during the /me flow) so the next request keeps working.
      setAuthenticated(user, accessToken ?? '', latestRefresh ?? refreshToken);
    } catch {
      // Either the refresh token was bad (interceptor already cleared via
      // auth:logout) or /me itself failed for a non-auth reason. Either way,
      // treat as logged out.
      setUnauthenticated();
    }
  }, [setAuthenticated, setUnauthenticated, setLoading]);

  useEffect(() => {
    initAuth();

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
