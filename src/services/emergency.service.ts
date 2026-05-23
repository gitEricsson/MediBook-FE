import { apiClient } from '@/lib/api/client';
import { unwrapApiResponse } from '@/lib/api/contracts';

export type EmergencyMedium = 'PHYSICAL' | 'AUDIO' | 'VIDEO';

export interface EmergencyRequest {
  medium: EmergencyMedium;
  symptoms: string;
  departmentId?: number;
  /** Set true only for life-threatening cases — bypasses outstanding-balance check. */
  criticalOverride?: boolean;
}

export interface EmergencyResponse {
  appointmentId: number;
  doctorId: number;
  doctorName: string;
  departmentName: string;
  status: string;
  medium: EmergencyMedium;
  confirmationCode: string;
  createdAt: string;
  sessionId: number | null;
  consultationFee: number;
  message: string;
}

export interface EmergencyFeeEstimate {
  fee: number;
  mediumSurchargeApplied: boolean;
  baseFee: number;
  emergencySurcharge: number;
  mediumSurcharge: number;
  /** Extra applied if the assigned doctor turns out to be a senior consultant. */
  seniorSurchargeIfApplicable: number;
  mediumLabel: string;
  departmentName: string | null;
  currency: string;
}

export const EmergencyService = {
  /**
   * Request an emergency consultation. The backend immediately assigns the
   * least-loaded eligible doctor and creates an EMERGENCY_PENDING_SETTLEMENT
   * appointment — payment is collected after the consultation. The doctor's
   * slot cache is evicted for the next 60 minutes.
   */
  request: async (data: EmergencyRequest): Promise<EmergencyResponse> => {
    const response = await apiClient.post('/api/v1/emergency/request', data);
    return unwrapApiResponse<EmergencyResponse>(response.data);
  },

  /**
   * Preview the fee the patient would owe for an emergency consultation. The
   * breakdown excludes the senior surcharge (we don't know the doctor yet) and
   * surfaces it separately so the FE can render it as a disclaimer.
   */
  estimateFee: async (medium: EmergencyMedium, departmentId?: number) => {
    const response = await apiClient.get('/api/v1/emergency/fee-estimate', {
      params: { medium, ...(departmentId ? { departmentId } : {}) },
    });
    return unwrapApiResponse<EmergencyFeeEstimate>(response.data);
  },
};
