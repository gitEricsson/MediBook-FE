import { apiClient } from '@/lib/api/client'
import { unwrapApiResponse, PageResponse, toPageableParams } from '@/lib/api/contracts'
import { ConsultationNoteResponse } from './consultation-notes.service'

export interface AccessGrantResponse {
  id: number
  patientId: number
  doctorId: number
  doctorName: string
  doctorEmail: string
  doctorDepartment?: string
  status: 'PENDING' | 'APPROVED' | 'REVOKED'
  grantedAt: string
  revokedAt?: string
  reason?: string
}

export const AccessGrantService = {
  // ── Patient: direct grant ────────────────────────────────────────────────
  grantPatientAccess: async (patientId: number, doctorId: number, reason?: string): Promise<AccessGrantResponse> => {
    const response = await apiClient.post(`/api/v1/patients/${patientId}/access-grants`, { doctorId, reason })
    return unwrapApiResponse<AccessGrantResponse>(response.data)
  },

  // ── Patient: view their approved grants ──────────────────────────────────
  getPatientGrants: async (patientId: number, page = 0, size = 20): Promise<PageResponse<AccessGrantResponse>> => {
    const response = await apiClient.get(`/api/v1/patients/${patientId}/access-grants`, {
      params: toPageableParams({ page, size }),
    })
    return unwrapApiResponse<PageResponse<AccessGrantResponse>>(response.data)
  },

  revokeAccess: async (patientId: number, grantId: number): Promise<void> => {
    await apiClient.delete(`/api/v1/patients/${patientId}/access-grants/${grantId}`)
  },

  // ── Patient: incoming doctor requests ────────────────────────────────────
  getIncomingRequests: async (page = 0, size = 20): Promise<PageResponse<AccessGrantResponse>> => {
    const response = await apiClient.get('/api/v1/access-requests/incoming', {
      params: toPageableParams({ page, size }),
    })
    return unwrapApiResponse<PageResponse<AccessGrantResponse>>(response.data)
  },

  approveRequest: async (grantId: number): Promise<AccessGrantResponse> => {
    const response = await apiClient.post(`/api/v1/access-requests/${grantId}/approve`)
    return unwrapApiResponse<AccessGrantResponse>(response.data)
  },

  denyRequest: async (grantId: number): Promise<AccessGrantResponse> => {
    const response = await apiClient.post(`/api/v1/access-requests/${grantId}/deny`)
    return unwrapApiResponse<AccessGrantResponse>(response.data)
  },

  // ── Doctor: request access to patient notes ──────────────────────────────
  requestAccess: async (patientId: number, reason?: string): Promise<AccessGrantResponse> => {
    const response = await apiClient.post('/api/v1/access-requests', { patientId, reason })
    return unwrapApiResponse<AccessGrantResponse>(response.data)
  },

  getOutgoingRequests: async (page = 0, size = 20): Promise<PageResponse<AccessGrantResponse>> => {
    const response = await apiClient.get('/api/v1/access-requests/outgoing', {
      params: toPageableParams({ page, size }),
    })
    return unwrapApiResponse<PageResponse<AccessGrantResponse>>(response.data)
  },

  // ── Doctor: view patient notes after approval ────────────────────────────
  getPatientNotes: async (patientId: number): Promise<ConsultationNoteResponse[]> => {
    const response = await apiClient.get(`/api/v1/consultation-notes/patient/${patientId}`)
    return unwrapApiResponse<ConsultationNoteResponse[]>(response.data)
  },
}
