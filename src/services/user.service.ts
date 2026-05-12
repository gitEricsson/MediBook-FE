import { apiClient } from '@/lib/api/client';
import { normalizeUserRole, PageResponse, toPageableParams, unwrapApiResponse } from '@/lib/api/contracts';
import type { UserRole } from '@/types/domain';

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  phone?: string;
  role: UserRole;
  enabled: boolean;
  twoFactorEnabled?: boolean;
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  locale?: string;
  avatarUrl?: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface AuditLogEntry {
  actorId: number;
  occurredAt: string;
  eventId: string;
  action: string;
  actorEmail?: string;
  entityType?: string;
  entityId?: string;
  ipAddress?: string;
  correlationId?: string;
}

type UserApiResponse = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  phone?: string;
  role: string;
  enabled: boolean;
  twoFactorEnabled?: boolean;
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  locale?: string;
};

const mapUser = (user: {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  phone?: string;
  role: string;
  enabled: boolean;
  twoFactorEnabled?: boolean;
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  locale?: string;
  avatarUrl?: string;
}): UserProfile => ({
  id: String(user.id),
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  fullName: user.fullName,
  phone: user.phone,
  role: normalizeUserRole(user.role),
  enabled: user.enabled,
  twoFactorEnabled: user.twoFactorEnabled,
  emailNotifications: user.emailNotifications,
  smsNotifications: user.smsNotifications,
  locale: user.locale,
  avatarUrl: user.avatarUrl,
});

export const UserService = {
  getMe: async () => {
    const response = await apiClient.get('/api/v1/me');
    return mapUser(unwrapApiResponse(response.data));
  },

  updateMe: async (payload: UpdateProfileRequest) => {
    const response = await apiClient.put('/api/v1/me', payload);
    return mapUser(unwrapApiResponse(response.data));
  },

  changePassword: async (payload: ChangePasswordRequest) => {
    await apiClient.post('/api/v1/me/change-password', payload);
  },

  updateLocale: async (locale: string) => {
    const response = await apiClient.patch('/api/v1/me/locale', { language: locale });
    return mapUser(unwrapApiResponse(response.data));
  },

  updateNotificationPrefs: async (preferences: Record<string, boolean>) => {
    const response = await apiClient.patch('/api/v1/me/notifications', preferences);
    return mapUser(unwrapApiResponse(response.data));
  },

  enable2FA: async () => {
    await apiClient.post('/api/v1/me/2fa/enable');
  },

  listUsers: async (page = 0, size = 50) => {
    const response = await apiClient.get('/api/v1/users', {
      params: toPageableParams({ page, size }),
    });
    const pageData = unwrapApiResponse<PageResponse<UserApiResponse>>(response.data);
    return pageData.content.map(mapUser);
  },

  getUserById: async (id: string) => {
    const response = await apiClient.get(`/api/v1/users/${id}`);
    return mapUser(unwrapApiResponse(response.data));
  },

  getMyUserProfile: async () => {
    const response = await apiClient.get('/api/v1/users/me');
    return mapUser(unwrapApiResponse(response.data));
  },

  getUserAuditLog: async (id: string) => {
    const response = await apiClient.get(`/api/v1/users/${id}/audit`);
    return unwrapApiResponse<AuditLogEntry[]>(response.data);
  },

  changeUserRole: async (id: string, role: UserRole) => {
    const roleMap: Record<UserRole, string> = {
      patient: 'ROLE_PATIENT',
      doctor: 'ROLE_DOCTOR',
      admin: 'ROLE_ADMIN',
      super_admin: 'ROLE_SUPER_ADMIN',
    };
    const response = await apiClient.patch(`/api/v1/users/${id}/role`, { role: roleMap[role] });
    return mapUser(unwrapApiResponse(response.data));
  },

  disableUser: async (id: string) => {
    await apiClient.patch(`/api/v1/users/${id}/disable`);
  },

  enableUser: async (id: string) => {
    const response = await apiClient.patch(`/api/v1/users/${id}/enable`);
    return mapUser(unwrapApiResponse(response.data));
  },

  revokeSessions: async (id: string) => {
    await apiClient.post(`/api/v1/users/${id}/revoke-sessions`);
  },

  uploadAvatar: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post('/api/v1/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return mapUser(unwrapApiResponse(response.data));
  },
};
