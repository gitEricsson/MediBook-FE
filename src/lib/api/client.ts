/**
 * Centralised HTTP client + auth-aware response interceptor.
 *
 * Auth contract (canonical JWT pattern — see also AuthProvider.tsx):
 *
 *   1. The request interceptor stamps every outgoing call with the in-memory
 *      access token (if present).
 *
 *   2. The response interceptor handles 401s for non-refresh requests:
 *        - First 401 in flight → start a single refresh, mark `isRefreshing`.
 *        - Subsequent 401s arriving while a refresh is already in flight →
 *          park their continuation in `failedQueue` and resolve once the
 *          refresh lands. This guarantees **at most one /auth/refresh call
 *          per access-token-expiry event**, which is what stops the backend's
 *          rotation lock from rejecting parallel callers as TOKEN_REUSE_DETECTED.
 *
 *   3. Refresh outcomes:
 *        • 200 → store rotated tokens, retry the original request.
 *        • 401/403 → the refresh token itself is bad. Dispatch `auth:logout`
 *          with a "Session expired" message; the AuthProvider listener clears
 *          state and toasts the user. This is the **only** path that should
 *          ever log the user out involuntarily.
 *        • Network / 5xx → do NOT log the user out. The session may still be
 *          valid; the user simply has a transient connectivity issue. Reject
 *          the original request and let upstream React Query / call sites
 *          surface a retry affordance.
 *
 *   4. NOTHING outside this file should call /auth/refresh directly. The
 *      AuthProvider calls /me on bootstrap; if the access token is missing or
 *      expired the interceptor here transparently refreshes and retries. Any
 *      caller invoking AuthService.refresh themselves bypasses the single-
 *      rotation gate and can re-introduce TOKEN_REUSE_DETECTED.
 */
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { env } from '@/config/env';
import { unwrapApiResponse } from './contracts';
import { useAuthStore } from '@/store/authStore';

interface FailedRequest {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}

let isRefreshing = false;
let failedQueue: FailedRequest[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token!);
  });
  failedQueue = [];
};

export const apiClient = axios.create({
  baseURL: env.VITE_API_URL,
  timeout: env.VITE_API_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
  withCredentials: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
});

// ── Request: stamp Bearer header ──────────────────────────────────────────
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response: 401 → single rotation → retry ───────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Never try to refresh-on-401 for any auth endpoint — the refresh endpoint
    // would loop, and the login endpoint would swallow "wrong credentials" 401s
    // and replace them with a misleading "No refresh token available" error.
    const isAuthEndpoint = originalRequest.url?.includes('/api/v1/auth/');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      // Another caller is already refreshing — wait in line and reuse the rotated token.
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { refreshToken, setTokens } = useAuthStore.getState();
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }
        const response = await apiClient.post('/api/v1/auth/refresh', { refreshToken });
        const { accessToken, refreshToken: rotatedRefreshToken } =
          unwrapApiResponse<{ accessToken: string; refreshToken: string }>(response.data);
        setTokens(accessToken, rotatedRefreshToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        processQueue(null, accessToken);
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);

        // Only dispatch the logout event when the refresh itself was rejected
        // by the auth server (i.e. the refresh token is truly invalid). A
        // network error or 5xx is a transport problem — the session may still
        // be valid; do NOT log the user out for those.
        const refreshStatus = (refreshError as AxiosError)?.response?.status;
        const isAuthFailure = refreshStatus === 401 || refreshStatus === 403;
        if (isAuthFailure) {
          window.dispatchEvent(
            new CustomEvent('auth:logout', { detail: { message: 'Session expired' } }),
          );
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle 403 Forbidden (Access Denied) — separate UX from session-expired.
    if (error.response?.status === 403) {
      window.dispatchEvent(
        new CustomEvent('auth:access-denied', { detail: { message: 'Access denied' } }),
      );
      return Promise.reject(error);
    }

    return Promise.reject(error);
  },
);
