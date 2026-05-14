import { apiClient } from '@/lib/api/client';
import { unwrapApiResponse } from '@/lib/api/contracts';

export interface DeletedAppointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  appointmentDate: string;
  status: string;
  deletedAt: string;
  deletedBy: string;
}

export interface DeletedConsultationNote {
  id: string;
  appointmentId: string;
  doctorId: string;
  doctorName: string;
  patientId: string;
  patientName: string;
  noteContent: string;
  deletedAt: string;
  deletedBy: string;
}

export interface DeletedInvoice {
  id: string;
  invoiceNumber: string;
  patientId: string;
  patientName: string;
  amount: number;
  currency: string;
  deletedAt: string;
  deletedBy: string;
}

export interface DeletedPayment {
  id: string;
  paymentId: string;
  invoiceId: string;
  patientId: string;
  patientName: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  deletedAt: string;
  deletedBy: string;
}

export interface SoftDeleteStats {
  deletedAppointmentsCount: number;
  deletedConsultationNotesCount: number;
  deletedInvoicesCount: number;
  deletedPaymentsCount: number;
  totalDeletedCount: number;
}

export const SoftDeleteService = {
  getDeletedAppointments: async (startDate?: string, endDate?: string) => {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const response = await apiClient.get('/api/v1/admin/soft-delete/appointments/deleted', { params });
    return unwrapApiResponse<DeletedAppointment[]>(response.data);
  },

  getDeletedConsultationNotes: async (startDate?: string, endDate?: string) => {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const response = await apiClient.get('/api/v1/admin/soft-delete/consultation-notes/deleted', { params });
    return unwrapApiResponse<DeletedConsultationNote[]>(response.data);
  },

  getDeletedInvoices: async (startDate?: string, endDate?: string) => {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const response = await apiClient.get('/api/v1/admin/soft-delete/invoices/deleted', { params });
    return unwrapApiResponse<DeletedInvoice[]>(response.data);
  },

  getDeletedPayments: async (startDate?: string, endDate?: string) => {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const response = await apiClient.get('/api/v1/admin/soft-delete/payments/deleted', { params });
    return unwrapApiResponse<DeletedPayment[]>(response.data);
  },

  getStats: async () => {
    const response = await apiClient.get('/api/v1/admin/soft-delete/stats');
    return unwrapApiResponse<SoftDeleteStats>(response.data);
  },

  restoreAppointment: async (id: string) => {
    const response = await apiClient.post(`/api/v1/admin/soft-delete/appointments/${id}/restore`);
    return unwrapApiResponse(response.data);
  },

  restoreConsultationNote: async (id: string) => {
    const response = await apiClient.post(`/api/v1/admin/soft-delete/consultation-notes/${id}/restore`);
    return unwrapApiResponse(response.data);
  },

  restoreInvoice: async (id: string) => {
    const response = await apiClient.post(`/api/v1/admin/soft-delete/invoices/${id}/restore`);
    return unwrapApiResponse(response.data);
  },

  restorePayment: async (id: string) => {
    const response = await apiClient.post(`/api/v1/admin/soft-delete/payments/${id}/restore`);
    return unwrapApiResponse(response.data);
  },
};
