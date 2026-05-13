import { apiClient } from '@/lib/api/client';
import { PageResponse, toPageableParams, unwrapApiResponse } from '@/lib/api/contracts';

export interface AdminAccount {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  enabled: boolean;
  phone?: string;
}

interface AdminApiResponse {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  enabled: boolean;
  phone?: string;
}

const mapAdmin = (a: AdminApiResponse): AdminAccount => ({
  id: String(a.id),
  email: a.email,
  firstName: a.firstName,
  lastName: a.lastName,
  enabled: a.enabled ?? true,
  phone: a.phone,
});

export const SuperAdminService = {
  listAdmins: async (): Promise<AdminAccount[]> => {
    const response = await apiClient.get('/api/v1/admin/admins', {
      params: toPageableParams({ page: 0, size: 100 }),
    });
    const page = unwrapApiResponse<PageResponse<AdminApiResponse>>(response.data);
    return page.content.map(mapAdmin);
  },

  createAdmin: async (data: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    password: string;
  }): Promise<AdminAccount> => {
    const response = await apiClient.post('/api/v1/admin/admins', data);
    return mapAdmin(unwrapApiResponse<AdminApiResponse>(response.data));
  },

  activateAdmin: async (id: string): Promise<void> => {
    await apiClient.post(`/api/v1/admin/admins/${id}/activate`);
  },

  deactivateAdmin: async (id: string): Promise<void> => {
    await apiClient.post(`/api/v1/admin/admins/${id}/deactivate`);
  },

  deleteAdmin: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/v1/admin/admins/${id}`);
  },

  resetAdminPassword: async (id: string, newPassword: string): Promise<void> => {
    await apiClient.post(`/api/v1/admin/admins/${id}/reset-password`, { newPassword });
  },

  updateAdmin: async (id: string, data: { firstName: string; lastName: string; phone?: string }): Promise<AdminAccount> => {
    const response = await apiClient.patch(`/api/v1/admin/admins/${id}`, data);
    return mapAdmin(unwrapApiResponse<AdminApiResponse>(response.data));
  },
};
