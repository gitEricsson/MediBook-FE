import { apiClient } from '@/lib/api/client';
import { unwrapApiResponse } from '@/lib/api/contracts';

export interface SlotBlockResponse {
  id: number;
  doctorId: number | null;
  doctorName: string | null;
  departmentName: string | null;
  blockDate: string;
  /** "HH:mm" */
  startTime: string;
  /** "HH:mm" */
  endTime: string;
  reason: string;
  createdByName: string | null;
  createdAt: string;
}

export interface SlotBlockRequest {
  blockDate: string;   // YYYY-MM-DD
  startTime: string;   // HH:mm
  endTime: string;     // HH:mm
  reason: string;
}

/**
 * Ad-hoc slot unavailability — single-day, time-bounded, reason-attached.
 * Distinct from a leave (multi-day off) and aligned with the philosophy
 * behind `acceptingNew` (both restrict availability, just at different
 * granularities: doctor-wide vs. specific window on a specific day).
 */
export const SlotBlocksService = {
  /** Logged-in doctor's blocks in a date window (inclusive). */
  listMine: async (from: string, to: string): Promise<SlotBlockResponse[]> => {
    const response = await apiClient.get('/api/v1/me/slot-blocks', { params: { from, to } });
    return unwrapApiResponse<SlotBlockResponse[]>(response.data);
  },

  createMine: async (data: SlotBlockRequest): Promise<SlotBlockResponse> => {
    const response = await apiClient.post('/api/v1/me/slot-blocks', data);
    return unwrapApiResponse<SlotBlockResponse>(response.data);
  },

  removeMine: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/v1/me/slot-blocks/${id}`);
  },

  /** Admin audit — list blocks across all doctors. */
  listAdmin: async (from: string, to: string): Promise<SlotBlockResponse[]> => {
    const response = await apiClient.get('/api/v1/admin/slot-blocks', { params: { from, to } });
    return unwrapApiResponse<SlotBlockResponse[]>(response.data);
  },

  removeAdmin: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/v1/admin/slot-blocks/${id}`);
  },
};
