import { apiClient } from '@/lib/api/client';
import { unwrapApiResponse } from '@/lib/api/contracts';
import { 
  LoginRequest, 
  LoginResponse, 
  RegisterRequest, 
  RegisterResponse, 
  Verify2FARequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  VerifyEmailRequest,
  RefreshTokenRequest,
  UserResponse,
} from '@/types/api';
import { normalizeUserRole } from '@/lib/api/contracts';
import { useAuthStore } from '@/store/authStore';

const mapUser = (user: UserResponse) => ({
  id: String(user.id),
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  role: normalizeUserRole(user.role),
});

export const AuthService = {
  login: async (data: LoginRequest) => {
    const response = await apiClient.post('/api/v1/auth/login', data);
    const payload = unwrapApiResponse<LoginResponse>(response.data);
    return {
      ...payload,
      user: payload.user ? mapUser(payload.user) : undefined,
      requires2FA: payload.twoFactorRequired ?? false,
    };
  },

  register: async (data: RegisterRequest) => {
    const response = await apiClient.post('/api/v1/auth/register', data);
    const payload = unwrapApiResponse<RegisterResponse & LoginResponse>(response.data);
    return payload.user ? { ...payload, user: mapUser(payload.user) } : payload;
  },

  verify2FA: async (data: Verify2FARequest) => {
    const response = await apiClient.post('/api/v1/auth/2fa/verify', data);
    const payload = unwrapApiResponse<LoginResponse>(response.data);
    return {
      ...payload,
      user: payload.user ? mapUser(payload.user) : undefined,
      requires2FA: payload.twoFactorRequired ?? false,
    };
  },

  refresh: async (data?: RefreshTokenRequest) => {
    const payload = data ?? { refreshToken: useAuthStore.getState().refreshToken ?? '' };
    const response = await apiClient.post('/api/v1/auth/refresh', payload);
    return unwrapApiResponse<LoginResponse>(response.data);
  },

  logout: async () => {
    const { refreshToken } = useAuthStore.getState();
    await apiClient.post('/api/v1/auth/logout', { refreshToken });
  },

  forgotPassword: async (data: ForgotPasswordRequest) => {
    await apiClient.post('/api/v1/auth/forgot-password', data);
  },

  resetPassword: async (data: ResetPasswordRequest) => {
    await apiClient.post('/api/v1/auth/reset-password', data);
  },

  verifyEmail: async (data: VerifyEmailRequest) => {
    await apiClient.post('/api/v1/auth/email/verify', data);
  },

  resendVerification: async (email: string) => {
    await apiClient.post('/api/v1/auth/email/resend', { email });
  },

  getCurrentUser: async () => {
    const response = await apiClient.get('/api/v1/me');
    const user = unwrapApiResponse<UserResponse>(response.data);
    return mapUser(user);
  }
};
