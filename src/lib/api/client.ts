import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { env } from '@/config/env';
import { unwrapApiResponse } from './contracts';
import { useAuthStore } from '@/store/authStore';

// Types for the refresh queue
interface FailedRequest {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}

let isRefreshing = false;
let failedQueue: FailedRequest[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
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

// Request Interceptor
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 Unauthorized (Expired Access Token or Session Expired)
    const isRefreshRequest = originalRequest.url?.includes('/api/v1/auth/refresh');
    if (error.response?.status === 401 && !originalRequest._retry && !isRefreshRequest) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
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
        const { accessToken, refreshToken: rotatedRefreshToken } = unwrapApiResponse<{ accessToken: string; refreshToken: string }>(response.data);
        setTokens(accessToken, rotatedRefreshToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        processQueue(null, accessToken);
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Check if the API error indicates session expired
        const errorData = (refreshError as AxiosError)?.response?.data as Record<string, unknown> | undefined;
        const errorCode = errorData?.['code'];
        const message = errorCode === 'SESSION_EXPIRED' ? 'Session expired' : 'Session expired';
        window.dispatchEvent(new CustomEvent('auth:logout', { detail: { message } }));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle 403 Forbidden (Access Denied)
    if (error.response?.status === 403) {
      window.dispatchEvent(new CustomEvent('auth:access-denied', { detail: { message: 'Access denied' } }));
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);
