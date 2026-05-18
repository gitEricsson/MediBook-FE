import { apiClient } from '@/lib/api/client'
import { unwrapApiResponse } from '@/lib/api/contracts'

export type PrescriptionStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED'

export interface Prescription {
  id: number
  appointmentId: number
  doctorId: number
  doctorName?: string
  patientId: number
  drugName: string
  dosage: string
  route?: string
  frequency: string
  durationDays?: number
  instructions?: string
  status: PrescriptionStatus
  issuedAt: string
  expiresAt?: string
  cancelledAt?: string
  cancelledReason?: string
}

export interface CreatePrescription {
  appointmentId: number
  drugName: string
  dosage: string
  route?: string
  frequency: string
  durationDays?: number
  instructions?: string
}

interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

const u = <T>(r: { data: unknown }) => unwrapApiResponse<T>(r.data)

export const PrescriptionsService = {
  create:  async (body: CreatePrescription)         => u<Prescription>(await apiClient.post('/api/v1/prescriptions', body)),
  update:  async (id: number, body: Partial<CreatePrescription>) =>
              u<Prescription>(await apiClient.patch(`/api/v1/prescriptions/${id}`, body)),
  cancel:  async (id: number, reason?: string)      => u<Prescription>(await apiClient.post(`/api/v1/prescriptions/${id}/cancel`, { reason })),
  getById: async (id: number)                       => u<Prescription>(await apiClient.get(`/api/v1/prescriptions/${id}`)),
  forAppointment: async (apptId: number)            => u<Prescription[]>(await apiClient.get(`/api/v1/prescriptions/appointment/${apptId}`)),
  forPatient: async (patientId: number, status?: PrescriptionStatus, page = 0, size = 20) => {
    const params: Record<string, string | number> = { page, size }
    if (status) params.status = status
    return u<Page<Prescription>>(await apiClient.get(`/api/v1/prescriptions/patient/${patientId}`, { params }))
  },
}
