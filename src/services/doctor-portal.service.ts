import { apiClient } from '@/lib/api/client';
import { Appointment } from '@/types/api';
import { unwrapApiResponse } from '@/lib/api/contracts';

export interface Time { hour: number; minute: number; }
export interface FreeSlot { start: Time; end: Time; }

export interface BackendScheduleResponse {
  date: string;
  workStart: Time;
  workEnd: Time;
  freeSlots: FreeSlot[];
  appointments: Array<Appointment & { scheduledAt: string }>;
}

export interface DailyScheduleDetails {
  appointments: Record<string, ScheduleAppt>;
  workStart: Time;
  workEnd: Time;
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
    scheduleData.appointments.forEach((appointment) => {
      const time = new Date(appointment.scheduledAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      mappedAppointments[time] = {
        name: appointment.patientName,
        reason: appointment.reason ?? 'Consultation',
        status: appointment.status === 'CONFIRMED' ? 'SCHEDULED' : (appointment.status as 'COMPLETED' | 'SCHEDULED' | 'NO_SHOW' | 'CANCELLED'),
        tone: appointment.tone, // Use the tone from the appointment
        patientId: String(appointment.patientId),
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
    const hours = unwrapApiResponse<Array<{ dayOfWeek: number; startTime: { hour: number; minute: number }; endTime: { hour: number; minute: number } }>>(response.data);
    return hours.map((hour) => ({
      dayOfWeek: hour.dayOfWeek,
      startTime: `${String(hour.startTime.hour).padStart(2, '0')}:${String(hour.startTime.minute).padStart(2, '0')}`,
      endTime: `${String(hour.endTime.hour).padStart(2, '0')}:${String(hour.endTime.minute).padStart(2, '0')}`,
      isAvailable: true,
    }));
  },

  updateWorkingHours: async (hours: WorkingHours[]) => {
    const schedule = hours
      .filter((hour) => hour.isAvailable !== false)
      .map((hour) => {
        const [startHour, startMinute] = hour.startTime.split(':').map(Number);
        const [endHour, endMinute] = hour.endTime.split(':').map(Number);
        return {
          dayOfWeek: hour.dayOfWeek,
          startTime: { hour: startHour, minute: startMinute, second: 0, nano: 0 },
          endTime: { hour: endHour, minute: endMinute, second: 0, nano: 0 },
        };
      });
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
  }
};
