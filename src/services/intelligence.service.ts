/**
 * Intelligence Service — AI-assisted clinical features.
 *
 * ⚠️  IMPORTANT DISCLAIMER:
 * These endpoints return STUB/AI-assisted OUTPUT ONLY.
 * Results are NOT a diagnosis, NOT a medical recommendation,
 * and MUST be reviewed by a qualified medical professional.
 * Never display triage output without the backend's own disclaimer.
 */
import { apiClient } from '@/lib/api/client';
import { unwrapApiResponse } from '@/lib/api/contracts';

export interface TriageResult {
  summary: string;
  possibleConsiderations: string[];
  urgencyIndicator: string;   // e.g. "LOW" | "MEDIUM" | "HIGH" | "EMERGENCY"
  status: string;
  requiresDoctorReview: boolean;
  disclaimer: string;
  provider: string;           // "stub" in development
}

export interface NoShowRisk {
  score: number;   // 0.0–1.0
  level: string;   // "LOW" | "MEDIUM" | "HIGH"
  explanation: string;
}

export const IntelligenceService = {
  /**
   * Symptom triage.
   * @param symptoms  Array of free-text symptom strings, e.g. ["chest pain", "shortness of breath"]
   * @param patientId Required — used for context only, not stored
   * @param patientAge Optional age string for context
   * @param patientGender Optional gender string for context
   */
  triageSymptoms: async (
    symptoms: string[],
    patientId: number,
    patientAge?: string,
    patientGender?: string,
  ): Promise<TriageResult> => {
    const response = await apiClient.post(
      '/api/v1/intelligence/symptom-triage',
      symptoms,
      { params: { patientId, ...(patientAge && { patientAge }), ...(patientGender && { patientGender }) } },
    );
    return unwrapApiResponse<TriageResult>(response.data);
  },

  /**
   * No-show risk prediction.
   * For scheduling optimisation ONLY — never used in clinical decisions.
   */
  predictNoShowRisk: async (
    patientId: number,
    doctorId: number,
    scheduledAt: string,   // ISO 8601 date-time
  ): Promise<NoShowRisk> => {
    const response = await apiClient.get('/api/v1/intelligence/no-show-risk', {
      params: { patientId, doctorId, scheduledAt },
    });
    return unwrapApiResponse<NoShowRisk>(response.data);
  },
};
