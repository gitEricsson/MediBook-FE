import { apiClient } from '@/lib/api/client';
import { toPageableParams, unwrapApiResponse, type PageResponse } from '@/lib/api/contracts';

export interface DepartmentResponse {
  id: number;
  name: string;
  code: string;
  description?: string;
  createdAt?: string;
  active?: boolean;
}

export interface DepartmentAdminResponse {
  id: number;
  name: string;
  code: string;
  doctorsCount: number;
  apptCount90d: number;
  status: boolean;
}

export interface DepartmentRequest {
  name: string;
  code: string;
  description?: string;
}

export const DepartmentsService = {
  getActiveDepartments: async () => {
    const response = await apiClient.get('/api/v1/departments');
    return unwrapApiResponse<DepartmentResponse[]>(response.data);
  },

  getDepartmentById: async (id: string) => {
    const response = await apiClient.get(`/api/v1/departments/${id}`);
    return unwrapApiResponse<DepartmentResponse>(response.data);
  },

  getAdminDepartmentById: async (id: string) => {
    const response = await apiClient.get(`/api/v1/admin/departments/${id}`);
    return unwrapApiResponse<DepartmentResponse>(response.data);
  },

  getAdminDepartmentStats: async (params?: { q?: string; status?: boolean; page?: number; size?: number }) => {
    const response = await apiClient.get('/api/v1/admin/departments', {
      params: {
        q: params?.q,
        status: params?.status,
        ...toPageableParams({ page: params?.page, size: params?.size ?? 50 }),
      },
    });
    const page = unwrapApiResponse<PageResponse<DepartmentAdminResponse>>(response.data);
    return page.content;
  },

  createDepartment: async (payload: DepartmentRequest) => {
    const response = await apiClient.post('/api/v1/admin/departments', payload);
    return unwrapApiResponse<DepartmentResponse>(response.data);
  },

  updateDepartment: async (id: string, payload: DepartmentRequest) => {
    const response = await apiClient.patch(`/api/v1/admin/departments/${id}`, payload);
    return unwrapApiResponse<DepartmentResponse>(response.data);
  },

  deactivateDepartment: async (id: string) => {
    await apiClient.post(`/api/v1/admin/departments/${id}/deactivate`);
  },

  reactivateDepartment: async (id: string) => {
    await apiClient.post(`/api/v1/admin/departments/${id}/reactivate`);
  },

  exportDepartmentsCsv: async () => {
    const response = await apiClient.get('/api/v1/admin/departments/export.csv', {
      responseType: 'blob',
    });
    return response.data;
  },
};

