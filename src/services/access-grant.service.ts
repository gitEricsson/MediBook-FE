/**
 * @deprecated No backend endpoint exists yet.
 * TODO: Implement /api/v1/access-grants endpoints on backend before using this service.
 */

import { apiClient } from '@/lib/api/client'

export interface AccessGrant {
  id: number
  patientId: number
  doctorId: number
  doctorName: string
  doctorEmail: string
  doctorDepartment?: string
  status: string
  grantedAt: string
  revokedAt?: string
  reason?: string
}

export interface GrantAccessPayload {
  doctorId: number
  reason?: string
}

export async function grantAccess(patientId: number, payload: GrantAccessPayload): Promise<AccessGrant> {
  const { data } = await apiClient.post(`/patients/${patientId}/access-grants`, payload)
  return data.data
}

export async function getPatientGrants(patientId: number, page = 0, size = 10): Promise<{ content: AccessGrant[]; totalElements: number; totalPages: number }> {
  const { data } = await apiClient.get(`/patients/${patientId}/access-grants?page=${page}&size=${size}`)
  return data.data
}

export async function revokeAccess(patientId: number, grantId: number): Promise<void> {
  await apiClient.delete(`/patients/${patientId}/access-grants/${grantId}`)
}
