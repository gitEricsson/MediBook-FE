import { apiClient } from '@/lib/api/client'
import { unwrapApiResponse } from '@/lib/api/contracts'

export interface CopilotSoap {
  subjective: string
  objective: string
  assessment: string
  plan: string
}

export interface CopilotBrief {
  chiefComplaint: string
  hpi: string
  redFlags: string[]
  differentials: string[]
  suggestedIcd: string[]
  rxDraft: string[]
  soap: CopilotSoap
}

export interface CopilotState {
  id: number
  telemedicineSessionId: number
  appointmentId: number
  doctorId: number
  patientId: number
  transcript?: string
  brief?: CopilotBrief
  redFlags?: string
  finalized: boolean
  finalizedAt?: string
  consultationNoteId?: number
  updatedAt?: string
}

export interface FinalizeRequest {
  diagnosis?: string
  treatmentPlan?: string
  prescriptions?: string
  followUpDate?: string
}

const unwrap = <T>(r: { data: unknown }) => unwrapApiResponse<T>(r.data)

export const CopilotService = {
  async start(telemedicineSessionId: number) {
    const r = await apiClient.post(`/api/v1/copilot/start/${telemedicineSessionId}`)
    return unwrap<CopilotState>(r)
  },
  async append(copilotId: number, chunk: string) {
    const r = await apiClient.post(`/api/v1/copilot/${copilotId}/transcript`, { chunk })
    return unwrap<CopilotState>(r)
  },
  async refreshBrief(copilotId: number) {
    const r = await apiClient.post(`/api/v1/copilot/${copilotId}/brief`)
    return unwrap<CopilotState>(r)
  },
  async get(copilotId: number) {
    const r = await apiClient.get(`/api/v1/copilot/${copilotId}`)
    return unwrap<CopilotState>(r)
  },
  async finalize(copilotId: number, body: FinalizeRequest) {
    const r = await apiClient.post(`/api/v1/copilot/${copilotId}/finalize`, body)
    return unwrap<CopilotState>(r)
  },
}
