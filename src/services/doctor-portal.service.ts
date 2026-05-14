import { apiClient } from '@/lib/api/client';
import { Appointment } from '@/types/api';
import { unwrapApiResponse } from '@/lib/api/contracts';
import type { AppointmentStatus } from '@/types/domain';

export interface WorkingHours {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface FreeSlot { start: string; end: string; }

export interface ScheduleAppt {
  id: string;
  name: string;
  reason: string;
  status: AppointmentStatus;
  tone: string;
  dur?: number;
  next?: boolean;
  patientId?: string;
  scheduledAt?: string;
}

export interface PatientSummary {
  patientId: number;
  fullName: string;
  dateOfBirth?: string;
  bloodGroup?: string;
  allergies?: string;
  medicalHistory?: string;
  lastVisitDate?: string;
  lastVisitDiagnosis?: string;
}

export interface ConsultationNoteRequest {
  appointmentId: string;
  diagnosis: string;
  treatmentPlan: string;
  prescriptions?: string;
  followUpDate?: string;
}

export interface BackendScheduleResponse {
  date: string;
  workStart: string;
  workEnd: string;
  freeSlots: FreeSlot[];
  appointments: Array<Appointment & { scheduledAt: string }>;
}

export interface DailyScheduleDetails {
  appointments: Record<string, ScheduleAppt>;
  workStart: string;
  workEnd: string;
  freeSlots: FreeSlot[];
}

export const DoctorPortalService = {
  getScheduleSummary: async () => {
    const response = await apiClient.get('/api/v1/me/schedule/summary');
    return unwrapApiResponse(response.data);
  },

  getDailySchedule: async (date: string): Promise<DailyScheduleDetails> => {
    const response = await apiClient.get(`/api/v1/me/schedule`, { params: { date } });
    const scheduleData = unwrapApiResponse<BackendScheduleResponse>(response.data);
    
    const mappedAppointments: Record<string, ScheduleAppt> = {};
    scheduleData.appointments.forEach((appointment, index) => {
      const time = appointment.scheduledAt.slice(11, 16);
      mappedAppointments[time] = {
        id: String(appointment.id),
        name: appointment.patientName,
        reason: appointment.reason ?? 'Consultation',
        status: appointment.status,
        tone: appointment.status === 'COMPLETED' ? 'teal'
              : appointment.status === 'NO_SHOW' ? 'rose'
              : 'primary', // Default tone
        patientId: String(appointment.patientId),
        scheduledAt: appointment.scheduledAt,
        dur: Math.max(1, Math.ceil((appointment.durationMins || 30) / 30)),
        next: index === 0 && appointment.status === 'CONFIRMED',
      };
    });

    return {
      appointments: mappedAppointments,
      workStart: scheduleData.workStart,
      workEnd: scheduleData.workEnd,
      freeSlots: scheduleData.freeSlots,
    };
  },

  getWeeklySchedule: async (weekOf: string) => {
    const response = await apiClient.get('/api/v1/me/schedule/week', { params: { weekOf } });
    return unwrapApiResponse<Record<string, number>>(response.data);
  },

  getUpNext: async () => {
    const response = await apiClient.get('/api/v1/me/schedule/up-next');
    return unwrapApiResponse<Appointment>(response.data);
  },

  getWorkingHours: async () => {
    const response = await apiClient.get('/api/v1/me/schedule/hours');
    const hours = unwrapApiResponse<Array<{ dayOfWeek: number; startTime: string; endTime: string }>>(response.data);
    return hours.map((hour) => ({
      dayOfWeek: hour.dayOfWeek,
      startTime: hour.startTime.slice(0, 5),
      endTime: hour.endTime.slice(0, 5),
      isAvailable: true,
    }));
  },

  updateWorkingHours: async (hours: WorkingHours[]) => {
    const schedule = hours
      .filter((hour) => hour.isAvailable !== false)
      .map((hour) => ({
        dayOfWeek: hour.dayOfWeek,
        startTime: hour.startTime.length === 5 ? `${hour.startTime}:00` : hour.startTime,
        endTime: hour.endTime.length === 5 ? `${hour.endTime}:00` : hour.endTime,
      }));
    const response = await apiClient.put('/api/v1/me/schedule/hours', { schedule });
    return unwrapApiResponse(response.data);
  },

  getPatientSummary: async (patientId: string) => {
    const response = await apiClient.get<PatientSummary>(`/api/v1/patients/${patientId}/summary`);
    return unwrapApiResponse(response.data);
  },

  transitionAppointment: async (id: string, status: 'COMPLETED' | 'NO_SHOW') => {
    const response = await apiClient.post(`/api/v1/appointments/${id}/transition`, { to: status });
    return unwrapApiResponse(response.data);
  },

  saveConsultationNote: async (data: ConsultationNoteRequest) => {
    const response = await apiClient.post(`/api/v1/consultation-notes/appointment/${data.appointmentId}`, {
      diagnosis: data.diagnosis,
      treatmentPlan: data.treatmentPlan,
      prescriptions: data.prescriptions,
      followUpDate: data.followUpDate,
    });
    return unwrapApiResponse(response.data);
  },

  updateConsultationNote: async (noteId: string, data: Omit<ConsultationNoteRequest, 'appointmentId'>) => {
    const response = await apiClient.put(`/api/v1/consultation-notes/${noteId}`, data);
    return unwrapApiResponse(response.data);
  },

  getNoteTemplates: async (doctorId: string) => {
    const response = await apiClient.get(`/api/v1/note-templates/doctors/${doctorId}`);
    return unwrapApiResponse<Array<{ id: number; name: string; templateType: string; content: string }>>(response.data);
  },

  createNoteTemplate: async (doctorId: string, name: string, content: string) => {
    const response = await apiClient.post(`/api/v1/note-templates/doctors/${doctorId}`, { name, templateType: 'CONSULTATION', content });
    return unwrapApiResponse(response.data);
  }
};
