import { apiClient } from '@/lib/api/client';
import { unwrapApiResponse } from '@/lib/api/contracts';

export interface PatientProfileRequest {
  bloodGroup?: string;
  allergies?: string;
  medicalHistory?: string;
  emergencyContact?: string;
  ssn?: string;
}

export interface PatientProfileResponse {
  id: number;
  userId: number;
  bloodGroup?: string;
  allergies?: string;
  medicalHistory?: string;
  emergencyContact?: string;
  ssnMasked?: string;
}

export const PatientProfileService = {
  getMyProfile: async () => {
    const response = await apiClient.get('/api/v1/me/profile');
    return unwrapApiResponse<PatientProfileResponse>(response.data);
  },

  upsertMyProfile: async (payload: PatientProfileRequest) => {
    const response = await apiClient.put('/api/v1/me/profile', payload);
    return unwrapApiResponse<PatientProfileResponse>(response.data);
  },
};

