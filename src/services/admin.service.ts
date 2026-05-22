import { apiClient } from '@/lib/api/client';
import { UserRole } from '@/types/domain';
import { PageResponse, normalizeUserRole, toPageableParams, unwrapApiResponse } from '@/lib/api/contracts';
import type { DoctorResponse } from '@/types/api';

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
  enabled?: boolean;
}

export interface AppointmentAnalytics {
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  cancellationRatePercent: number;
  noShowRatePercent: number;
  appointmentsByDepartment: Record<string, number>;
  appointmentsByType: Record<string, number>;
}

export interface RevenueAnalytics {
  totalRevenue: number;
  totalRefunds: number;
  netRevenue: number;
  successfulPayments: number;
  failedPayments: number;
  refundedPayments: number;
}

export interface DoctorUtilizationEntry {
  doctorId: number;
  doctorName: string;
  department: string;
  totalSlots: number;
  bookedSlots: number;
  utilizationRate: number;
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
    const dept = unwrapApiResponse<{ id: number; name: string; code: string; isActive?: boolean; active?: boolean }>(response.data);
    return {
      id: String(dept.id),
      name: dept.name,
      code: dept.code,
      isActive: dept.isActive ?? dept.active ?? true,
    };
  },

  updateDepartment: async (id: string, data: Partial<Department>) => {
    const response = await apiClient.patch(`/api/v1/admin/departments/${id}`, data);
    const dept = unwrapApiResponse<{ id: number; name: string; code: string; isActive?: boolean; active?: boolean }>(response.data);
    return {
      id: String(dept.id),
      name: dept.name,
      code: dept.code,
      isActive: dept.isActive ?? dept.active ?? true,
      description: data.description,
    };
  },

  deactivateDepartment: async (id: string) => {
    await apiClient.post(`/api/v1/admin/departments/${id}/deactivate`);
  },

  reactivateDepartment: async (id: string) => {
    await apiClient.post(`/api/v1/admin/departments/${id}/reactivate`);
  },

  // User Management
  getUsers: async () => {
    const response = await apiClient.get('/api/v1/users', {
      params: toPageableParams({ page: 0, size: 100 }),
    });
    const page = unwrapApiResponse<PageResponse<{ id: number; email: string; firstName: string; lastName: string; role: string; enabled: boolean }>>(response.data);
    return page.content.map((user): AdminUser => ({
      id: String(user.id),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: normalizeUserRole(user.role),
      enabled: user.enabled,
    }));
  },

  getDoctors: async (page = 0, size = 50) => {
    const response = await apiClient.get('/api/v1/doctors', {
      params: toPageableParams({ page, size }),
    });
    const pageData = unwrapApiResponse<PageResponse<DoctorResponse>>(response.data);
    return pageData.content;
  },

  createDoctor: async (data: {
    firstName: string;
    lastName: string;
    email: string;
    departmentId: string;
    specialization?: string;
    licenseNumber?: string;
    defaultStartTime?: string;
    defaultEndTime?: string;
  }) => {
    const response = await apiClient.post('/api/v1/admin/doctors', data);
    return unwrapApiResponse<DoctorResponse>(response.data);
  },

  updateUserRole: async (id: string, role: UserRole) => {
    const roleMap: Record<UserRole, string> = {
      patient: 'ROLE_PATIENT',
      doctor: 'ROLE_DOCTOR',
      admin: 'ROLE_ADMIN',
      super_admin: 'ROLE_SUPER_ADMIN',
    };
    const response = await apiClient.patch(`/api/v1/users/${id}/role`, { role: roleMap[role] });
    return unwrapApiResponse(response.data);
  },

  revokeUserSessions: async (id: string) => {
    await apiClient.post(`/api/v1/users/${id}/revoke-sessions`);
  },

  // Analytics
  getAppointmentAnalytics: async (from: string, to: string): Promise<AppointmentAnalytics> => {
    const formatDateTime = (date: string) => date.includes('T') ? date : `${date}T00:00:00`;
    const response = await apiClient.get('/api/v1/admin/analytics/appointments', { params: { from: formatDateTime(from), to: formatDateTime(to) } });
    return unwrapApiResponse<AppointmentAnalytics>(response.data);
  },

  getRevenueAnalytics: async (from: string, to: string): Promise<RevenueAnalytics> => {
    const formatDateTime = (date: string) => date.includes('T') ? date : `${date}T00:00:00`;
    const response = await apiClient.get('/api/v1/admin/analytics/revenue', { params: { from: formatDateTime(from), to: formatDateTime(to) } });
    return unwrapApiResponse<RevenueAnalytics>(response.data);
  },

  getDoctorUtilization: async (from: string, to: string): Promise<DoctorUtilizationEntry[]> => {
    const formatDateTime = (date: string) => date.includes('T') ? date : `${date}T00:00:00`;
    const response = await apiClient.get('/api/v1/admin/analytics/doctor-utilization', { params: { from: formatDateTime(from), to: formatDateTime(to) } });
    const raw = unwrapApiResponse<{ doctors: Array<{ doctorId: number; doctorName: string; specialization: string; totalAppointments: number; completedAppointments: number; utilizationPercent: number }> }>(response.data);
    const transformed = (raw.doctors || []).map((doc) => ({
      doctorId: doc.doctorId,
      doctorName: doc.doctorName,
      department: doc.specialization,
      totalSlots: doc.totalAppointments,
      bookedSlots: doc.completedAppointments,
      utilizationRate: doc.utilizationPercent,
    }));
    return transformed;
  },

  // Capacity
  getDailyCapacity: async (date: string) => {
    const response = await apiClient.get('/api/v1/admin/analytics/capacity', { params: { date } });
    return unwrapApiResponse(response.data);
  },

  // Department CSV export
  exportDepartmentsCsv: async () => {
    const response = await apiClient.get('/api/v1/admin/departments/export.csv', {
      responseType: 'text',
    });
    return new Blob([response.data], { type: 'text/csv' });
  },

  // Doctor Leave (admin view)
  getDoctorLeaves: async (doctorId: string) => {
    const response = await apiClient.get(`/api/v1/doctors/${doctorId}/leaves`);
    return unwrapApiResponse<Array<{ id: number; startDate: string; endDate: string; reason?: string; leaveType: string; status: string }>>(response.data);
  },

  createDoctorLeave: async (doctorId: string, payload: {
    startDate: string;
    endDate: string;
    reason?: string;
    leaveType?: 'PERSONAL' | 'SICK' | 'CONFERENCE' | 'HOLIDAY';
  }) => {
    const response = await apiClient.post(`/api/v1/doctors/${doctorId}/leaves`, payload);
    return unwrapApiResponse(response.data);
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
