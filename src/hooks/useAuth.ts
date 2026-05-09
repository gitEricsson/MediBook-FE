import { useAuthStore } from '@/store/authStore';
import { AuthService } from '@/services/auth.service';
import { LoginRequest, RegisterRequest, Verify2FARequest } from '@/types/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { normalizeUserRole } from '@/lib/api/contracts';

export const useAuth = () => {
  const { 
    user, 
    status, 
    setAuthenticated, 
    setUnauthenticated, 
    set2FARequired, 
    setLoading 
  } = useAuthStore();
  
  const queryClient = useQueryClient();

  const normalizeUserForStore = (rawUser: any) => ({
    id: String(rawUser.id),
    email: rawUser.email,
    firstName: rawUser.firstName,
    lastName: rawUser.lastName,
    role: typeof rawUser.role === 'string' && rawUser.role.startsWith('ROLE_')
      ? normalizeUserRole(rawUser.role)
      : rawUser.role,
  });

  const loginMutation = useMutation({
    mutationFn: AuthService.login,
    onSuccess: (data) => {
      if (data.requires2FA) {
        set2FARequired();
      } else if (data.accessToken && data.refreshToken && data.user) {
        setAuthenticated(normalizeUserForStore(data.user), data.accessToken, data.refreshToken);
        queryClient.invalidateQueries({ queryKey: ['me'] });
      }
    },
  });

  const registerMutation = useMutation({
    mutationFn: AuthService.register,
    onSuccess: (data) => {
      if (data.accessToken && data.refreshToken && data.user) {
        setAuthenticated(normalizeUserForStore(data.user), data.accessToken, data.refreshToken);
        queryClient.invalidateQueries({ queryKey: ['me'] });
      }
    },
  });

  const verify2FAMutation = useMutation({
    mutationFn: AuthService.verify2FA,
    onSuccess: (data) => {
      if (data.accessToken && data.refreshToken && data.user) {
        setAuthenticated(normalizeUserForStore(data.user), data.accessToken, data.refreshToken);
        queryClient.invalidateQueries({ queryKey: ['me'] });
      }
    },
  });

  const logout = async () => {
    try {
      await AuthService.logout();
    } finally {
      setUnauthenticated();
      queryClient.clear();
    }
  };

  return {
    user,
    status,
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading',
    is2FARequired: status === '2fa_required',
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    register: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,
    verify2FA: verify2FAMutation.mutateAsync,
    isVerifying2FA: verify2FAMutation.isPending,
    logout,
  };
};
