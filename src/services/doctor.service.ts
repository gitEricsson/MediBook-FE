import { apiClient } from '@/lib/api/client';
import { Doctor, Specialization } from '@/types/domain';
import { DoctorAvailability } from '@/types/api';
import { PageResponse, toPageableParams, unwrapApiResponse } from '@/lib/api/contracts';

export interface DoctorSearchParams {
  q?: string;
  departmentId?: number[];
  specialisation?: string[];
  availability?: string;
  visitType?: string;
  acceptingNew?: boolean;
  page?: number;
  size?: number;
}

interface DoctorApiResponse {
  id: number;
  fullName: string;
  specialization?: string;
  bio?: string;
  departmentName?: string;
}

interface AvailabilityGridResponse {
  days: Array<{
    date: string;
    slots: Array<{
      start: string;
      end: string;
      status: string;
    }>;
  }>;
}

const mapDoctor = (doctor: DoctorApiResponse): Doctor => {
  const specialization = doctor.specialization ?? 'General Practice';
  const department = doctor.departmentName ?? 'General Medicine';
  return {
    id: String(doctor.id),
    name: doctor.fullName,
    spec: specialization,
    specialization,
    dept: department,
    department,
    bio: doctor.bio,
    tone: 'primary',
    next: '',
    city: 'Bay General',
  };
};

export const DoctorService = {
  search: async (params: DoctorSearchParams) => {
    const response = await apiClient.get('/api/v1/doctors/search', {
      params: {
        ...params,
        ...toPageableParams({ page: params.page, size: params.size }),
      },
    });
    const page = unwrapApiResponse<PageResponse<DoctorApiResponse>>(response.data);
    return page.content.map(mapDoctor);
  },

  getById: async (id: string) => {
    const response = await apiClient.get(`/api/v1/doctors/${id}`);
    return mapDoctor(unwrapApiResponse<DoctorApiResponse>(response.data));
  },

  getAvailability: async (id: string, from?: string, to?: string, tz?: string) => {
    const start = from ?? new Date().toISOString().split('T')[0];
    const end = to ?? start;
    const response = await apiClient.get(`/api/v1/doctors/${id}/availability`, {
      params: { from: start, to: end, tz },
    });
    const availabilityGrid = unwrapApiResponse<AvailabilityGridResponse>(response.data);
    return availabilityGrid.days.map<DoctorAvailability>((day) => ({
      date: day.date,
      slots: day.slots.map((slot) => ({
        id: `${slot.start}-${slot.end}`,
        startTime: new Date(slot.start).toISOString().slice(11, 16),
        endTime: new Date(slot.end).toISOString().slice(11, 16),
        isAvailable: slot.status === 'AVAILABLE',
      })),
    }));
  },

  getSpecializations: async () => {
    const response = await apiClient.get('/api/v1/specialisations');
    const specializations = unwrapApiResponse<string[]>(response.data);
    return specializations.map<Specialization>((name, index) => ({
      id: String(index + 1),
      name,
    }));
  },
};
