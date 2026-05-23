import { apiClient } from '@/lib/api/client';
import { UserRole } from '@/types/domain';
import { PageResponse, normalizeUserRole, toPageableParams, unwrapApiResponse } from '@/lib/api/contracts';
import type { DoctorResponse } from '@/types/api';

interface RawDepartment {
  id: number;
  name: string;
  code?: string;
  description?: string;
  isActive?: boolean;
  active?: boolean;
  slotDurationMins?: number;
  bufferMins?: number;
  baseConsultationFee?: number | string;
}

function mapDept(dept: RawDepartment): Department {
  return {
    id: String(dept.id),
    name: dept.name,
    code: dept.code,
    description: dept.description,
    isActive: dept.isActive ?? dept.active ?? true,
    slotDurationMins: dept.slotDurationMins,
    bufferMins: dept.bufferMins,
    baseConsultationFee: dept.baseConsultationFee != null ? Number(dept.baseConsultationFee) : undefined,
  };
}

export interface Department {
  id: string;
  name: string;
  doctorCount?: number;
  appointmentCount?: number;
  isActive: boolean;
  code?: string;
  description?: string;
  slotDurationMins?: number;
  bufferMins?: number;
  baseConsultationFee?: number;
}

export interface DepartmentInput {
  name: string;
  code: string;
  description?: string;
  slotDurationMins?: number;
  bufferMins?: number;
  baseConsultationFee?: number;
}

export interface PricingPolicy {
  emergencyMultiplierPct: number;
  followUpDiscountPct: number;
  experiencePremiumPct: number;
  experienceThresholdYears: number;
  mediumSurchargePct: number;
  updatedAt: string;
  updatedBy: number | null;
}

export interface PricingPolicyInput {
  emergencyMultiplierPct?: number;
  followUpDiscountPct?: number;
  experiencePremiumPct?: number;
  experienceThresholdYears?: number;
  mediumSurchargePct?: number;
  /** Optimistic lock token — pass the `updatedAt` from the last GET. */
  ifUnchangedSince: string;
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

export interface AdminLeave {
  id: number;
  doctorId: number;
  doctorName: string | null;
  doctorEmail: string | null;
  departmentName: string | null;
  startDate: string;
  endDate: string;
  reason: string | null;
  leaveType: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdByName: string | null;
  reviewedByName: string | null;
  reviewedAt: string | null;
}

export interface DoctorUtilizationEntry {
  doctorId: number;
  doctorName: string;
  department: string;
  totalSlots: number;
  bookedSlots: number;
  utilizationRate: number;
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  averageRating: number;
}

export const AdminService = {
  // Department Management
  getDepartments: async () => {
    const response = await apiClient.get('/api/v1/admin/departments', {
      params: toPageableParams({ page: 0, size: 50 }),
    });
    const page = unwrapApiResponse<PageResponse<{
      id: number; name: string; code: string;
      doctorsCount: number; apptCount90d: number; status: boolean;
      slotDurationMins?: number; bufferMins?: number; baseConsultationFee?: number;
    }>>(response.data);
    return page.content.map<Department>((dept) => ({
      id: String(dept.id),
      name: dept.name,
      code: dept.code,
      doctorCount: dept.doctorsCount,
      appointmentCount: dept.apptCount90d,
      isActive: dept.status,
      slotDurationMins: dept.slotDurationMins,
      bufferMins: dept.bufferMins,
      baseConsultationFee: dept.baseConsultationFee != null ? Number(dept.baseConsultationFee) : undefined,
    }));
  },

  createDepartment: async (data: DepartmentInput) => {
    const response = await apiClient.post('/api/v1/admin/departments', {
      name: data.name,
      code: data.code,
      description: data.description,
      slotDurationMins: data.slotDurationMins,
      bufferMins: data.bufferMins,
      baseConsultationFee: data.baseConsultationFee,
    });
    return mapDept(unwrapApiResponse(response.data));
  },

  updateDepartment: async (id: string, data: DepartmentInput) => {
    // The backend's update endpoint is a full replace (PATCH semantically, but the
    // DTO requires name/code). Send the whole payload so unspecified fields don't
    // get reset to the @Builder.Default.
    const response = await apiClient.patch(`/api/v1/admin/departments/${id}`, {
      name: data.name,
      code: data.code,
      description: data.description,
      slotDurationMins: data.slotDurationMins,
      bufferMins: data.bufferMins,
      baseConsultationFee: data.baseConsultationFee,
    });
    return mapDept(unwrapApiResponse(response.data));
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

  /**
   * Update a doctor's profile fields. `userId` and `departmentId` are required by
   * the backend DTO; the rest are optional and will overwrite existing values.
   */
  updateDoctor: async (id: string, data: {
    userId: number;
    departmentId: number;
    specialization?: string;
    licenseNumber: string;
    bio?: string;
    slotDurationMins?: number;
    yearsOfExperience?: number;
    consultationFee?: number;
    gender?: 'MALE' | 'FEMALE' | 'OTHER';
    languages?: string;
  }) => {
    const response = await apiClient.put(`/api/v1/doctors/${id}`, data);
    return unwrapApiResponse<DoctorResponse>(response.data);
  },

  /** Soft-delete equivalent — stops the doctor from accepting new appointments. */
  deactivateDoctor: async (id: string) => {
    const response = await apiClient.post(`/api/v1/admin/doctors/${id}/deactivate`);
    return unwrapApiResponse<DoctorResponse>(response.data);
  },

  reactivateDoctor: async (id: string) => {
    const response = await apiClient.post(`/api/v1/admin/doctors/${id}/activate`);
    return unwrapApiResponse<DoctorResponse>(response.data);
  },

  /** Re-send the welcome / set-up-password email to a doctor account. */
  resendDoctorInvite: async (id: string) => {
    await apiClient.post(`/api/v1/admin/doctors/${id}/resend-invite`);
  },

  // ── Doctor leave (admin review) ─────────────────────────────────────────
  getPendingLeaves: async (): Promise<AdminLeave[]> => {
    const response = await apiClient.get('/api/v1/admin/leaves/pending');
    return unwrapApiResponse<AdminLeave[]>(response.data);
  },

  /** All leave requests with optional status filter (PENDING / APPROVED / REJECTED). */
  listLeaves: async (status?: 'PENDING' | 'APPROVED' | 'REJECTED'): Promise<AdminLeave[]> => {
    const response = await apiClient.get('/api/v1/admin/leaves', {
      params: status ? { status } : undefined,
    });
    return unwrapApiResponse<AdminLeave[]>(response.data);
  },

  approveLeave: async (leaveId: number): Promise<AdminLeave> => {
    const response = await apiClient.post(`/api/v1/admin/leaves/${leaveId}/approve`);
    return unwrapApiResponse<AdminLeave>(response.data);
  },

  rejectLeave: async (leaveId: number): Promise<AdminLeave> => {
    const response = await apiClient.post(`/api/v1/admin/leaves/${leaveId}/reject`);
    return unwrapApiResponse<AdminLeave>(response.data);
  },

  // ── Pricing policy (hospital-wide knobs) ────────────────────────────────
  getPricingPolicy: async (): Promise<PricingPolicy> => {
    const response = await apiClient.get('/api/v1/admin/pricing-policy');
    return unwrapApiResponse<PricingPolicy>(response.data);
  },

  updatePricingPolicy: async (data: PricingPolicyInput): Promise<PricingPolicy> => {
    const response = await apiClient.patch('/api/v1/admin/pricing-policy', data);
    return unwrapApiResponse<PricingPolicy>(response.data);
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
    const raw = unwrapApiResponse<{ doctors: Array<{ doctorId: number; doctorName: string; specialization: string; totalAppointments: number; completedAppointments: number; cancelledAppointments?: number; utilizationPercent: number; averageRating?: number }> }>(response.data);
    const transformed = (raw.doctors || []).map<DoctorUtilizationEntry>((doc) => ({
      doctorId: doc.doctorId,
      doctorName: doc.doctorName,
      department: doc.specialization,
      // Keep the legacy field aliases for the analytics screen, but also expose
      // the raw counts so the performance dashboard has the full picture.
      totalSlots: doc.totalAppointments,
      bookedSlots: doc.completedAppointments,
      utilizationRate: doc.utilizationPercent,
      totalAppointments: doc.totalAppointments,
      completedAppointments: doc.completedAppointments,
      cancelledAppointments: doc.cancelledAppointments ?? 0,
      averageRating: doc.averageRating ?? 0,
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
      responseType: 'blob',
    });
    return response.data as Blob;
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
