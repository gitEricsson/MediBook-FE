import { apiClient } from '@/lib/api/client';
import { Doctor, Specialization } from '@/types/domain';
import { DoctorAvailability } from '@/types/api';
import { PageResponse, toPageableParams, unwrapApiResponse } from '@/lib/api/contracts';

export interface DoctorSearchParams {
  q?: string;
  departmentIds?: number[];
  specialisations?: string[];
  acceptingNew?: boolean;
  page?: number;
  size?: number;
}

export interface DoctorApiResponse {
  id: number;
  userId?: number;
  fullName: string;
  email?: string;
  specialization?: string;
  bio?: string;
  licenseNumber?: string;
  departmentId?: number;
  departmentName?: string;
  acceptingNew?: boolean;
  slotDurationMins?: number;
  languages?: string;
  gender?: string;
  telemedicineEnabled?: boolean;
  yearsOfExperience?: number;
  consultationFee?: number;
  seniorConsultant?: boolean;
  averageRating?: number;
  reviewCount?: number;
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

export const mapDoctor = (doctor: DoctorApiResponse): Doctor => {
  const specialization = doctor.specialization ?? 'General Practice';
  const department = doctor.departmentName ?? 'General Medicine';
  return {
    id: String(doctor.id),
    userId: doctor.userId ? String(doctor.userId) : undefined,
    name: doctor.fullName,
    email: doctor.email,
    spec: specialization,
    specialization,
    dept: department,
    department,
    departmentId: doctor.departmentId ? String(doctor.departmentId) : undefined,
    bio: doctor.bio,
    licenseNumber: doctor.licenseNumber,
    acceptingNew: doctor.acceptingNew,
    slotDurationMins: doctor.slotDurationMins,
    languages: doctor.languages,
    gender: doctor.gender,
    telemedicineEnabled: doctor.telemedicineEnabled,
    yearsOfExperience: doctor.yearsOfExperience,
    consultationFee: doctor.consultationFee,
    seniorConsultant: doctor.seniorConsultant,
    averageRating: doctor.averageRating,
    reviewCount: doctor.reviewCount,
    tone: 'primary',
    next: '',
    city: '',
  };
};

export const DoctorService = {
  search: async (params: DoctorSearchParams) => {
    const response = await apiClient.get('/api/v1/doctors/search', {
      params: {
        q: params.q,
        departmentId: params.departmentIds,
        specialisation: params.specialisations,
        acceptingNew: params.acceptingNew,
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

  getAvailability: async (id: string, from?: string, to?: string) => {
    const start = from ?? new Date().toISOString().split('T')[0];
    const end = to ?? start;
    const response = await apiClient.get(`/api/v1/doctors/${id}/availability`, {
      params: { from: start, to: end },
    });
    const availabilityGrid = unwrapApiResponse<AvailabilityGridResponse>(response.data);
    return availabilityGrid.days.map<DoctorAvailability>((day) => ({
      date: day.date,
      slots: day.slots.map((slot) => ({
        id: `${slot.start}-${slot.end}`,
        start: slot.start,
        end: slot.end,
        startTime: slot.start.slice(11, 16),
        endTime: slot.end.slice(11, 16),
        status: slot.status as 'OPEN' | 'HELD' | 'TAKEN' | 'PAST',
        isAvailable: slot.status === 'OPEN',
        isPast: slot.status === 'PAST',
      })),
    }));
  },

  getSpecializations: async () => {
    const response = await apiClient.get('/api/v1/metadata/specialisations');
    const specializations = unwrapApiResponse<string[]>(response.data);
    return specializations.map<Specialization>((name, index) => ({
      id: String(index + 1),
      name,
    }));
  },
};
