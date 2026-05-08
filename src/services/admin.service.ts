import { apiClient } from '@/lib/api/client';
import { UserRole } from '@/types/domain';
import { PageResponse, normalizeUserRole, toPageableParams, unwrapApiResponse } from '@/lib/api/contracts';

export interface Department {
  id: string;
  name: string;
  doctorCount?: number;
  appointmentCount?: number;
  isActive: boolean;
  code?: string;
  description?: string;
}

export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  lastLogin?: string;
}

export const AdminService = {
  // Department Management
  getDepartments: async () => {
    const response = await apiClient.get('/api/v1/admin/departments', {
      params: toPageableParams({ page: 0, size: 50 }),
    });
    const page = unwrapApiResponse<PageResponse<{ id: number; name: string; code: string; doctorsCount: number; apptCount90d: number; status: boolean }>>(response.data);
    return page.content.map((dept) => ({
      id: String(dept.id),
      name: dept.name,
      code: dept.code,
      doctorCount: dept.doctorsCount,
      appointmentCount: dept.apptCount90d,
      isActive: dept.status,
    }));
  },

  createDepartment: async (data: Partial<Department> & { name: string; code: string }) => {
    const response = await apiClient.post('/api/v1/admin/departments', {
      name: data.name,
      code: data.code,
      description: data.description,
    });
    const dept = unwrapApiResponse<{ id: number; name: string; code: string; active: boolean }>(response.data);
    return {
      id: String(dept.id),
      name: dept.name,
      code: dept.code,
      isActive: dept.active,
    };
  },

  updateDepartment: async (id: string, data: Partial<Department>) => {
    const response = await apiClient.patch(`/api/v1/admin/departments/${id}`, data);
    const dept = unwrapApiResponse<{ id: number; name: string; code: string; active: boolean }>(response.data);
    return {
      id: String(dept.id),
      name: dept.name,
      code: dept.code,
      isActive: dept.active,
    };
  },

  deactivateDepartment: async (id: string) => {
    await apiClient.post(`/api/v1/admin/departments/${id}/deactivate`);
  },

  // User Management
  getUsers: async () => {
    const response = await apiClient.get('/api/v1/users', {
      params: toPageableParams({ page: 0, size: 100 }),
    });
    const page = unwrapApiResponse<PageResponse<{ id: number; email: string; firstName: string; lastName: string; role: string }>>(response.data);
    return page.content.map((user): AdminUser => ({
      id: String(user.id),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: normalizeUserRole(user.role),
    }));
  },

  updateUserRole: async (id: string, role: UserRole) => {
    const roleMap: Record<UserRole, string> = {
      patient: 'ROLE_PATIENT',
      doctor: 'ROLE_DOCTOR',
      admin: 'ROLE_ADMIN',
    };
    const response = await apiClient.patch(`/api/v1/users/${id}/role`, { role: roleMap[role] });
    return unwrapApiResponse(response.data);
  },

  revokeUserSessions: async (id: string) => {
    await apiClient.post(`/api/v1/users/${id}/revoke-sessions`);
  },

  // System Health
  getHealth: async () => {
    const response = await apiClient.get('/health');
    return response.data;
  },

  getVersion: async () => {
    const response = await apiClient.get('/version');
    return response.data;
  }
};
