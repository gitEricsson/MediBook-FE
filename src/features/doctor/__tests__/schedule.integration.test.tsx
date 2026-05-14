import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { DoctorPortalService } from '@/services/doctor-portal.service';
import { ConsultationNotesService } from '@/services/consultation-notes.service';
import { useAuthStore } from '@/store/authStore';
import { server } from '@/test/server';
import { http, HttpResponse } from 'msw';
import React from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('Doctor Schedule Integration Tests', () => {
  beforeEach(() => {
    useAuthStore.getState().setUnauthenticated();
    queryClient.clear();
    server.resetHandlers();

    // Set authenticated doctor user
    useAuthStore.getState().setAuthenticated(
      {
        id: '1',
        email: 'doctor@test.com',
        role: 'doctor',
        firstName: 'Dr',
        lastName: 'Smith',
      },
      'mock-access-token',
      'mock-refresh-token'
    );
  });

  describe('Schedule Loading', () => {
    it('should load schedule for a specific date', async () => {
      server.use(
        http.get('*/api/v1/doctors/*/schedule', () => {
          return HttpResponse.json({
            success: true,
            data: {
              date: '2024-06-15',
              slots: [
                {
                  id: 'slot-1',
                  startTime: '09:00',
                  endTime: '09:30',
                  status: 'AVAILABLE',
                  appointment: null,
                },
                {
                  id: 'slot-2',
                  startTime: '09:30',
                  endTime: '10:00',
                  status: 'BOOKED',
                  appointment: {
                    id: 'appt-1',
                    patientName: 'John Doe',
                    patientEmail: 'john@example.com',
                    status: 'CONFIRMED',
                  },
                },
              ],
            }
          });
        })
      );

      const schedule = await DoctorPortalService.getSchedule('1', '2024-06-15');

      expect(schedule.date).toBe('2024-06-15');
      expect(schedule.slots).toBeDefined();
      expect(schedule.slots.length).toBe(2);
      expect(schedule.slots[0].status).toBe('AVAILABLE');
      expect(schedule.slots[1].status).toBe('BOOKED');
      expect(schedule.slots[1].appointment).toBeDefined();
    });

    it('should handle empty schedule', async () => {
      server.use(
        http.get('*/api/v1/doctors/*/schedule', () => {
          return HttpResponse.json({
            success: true,
            data: {
              date: '2024-06-15',
              slots: [],
            }
          });
        })
      );

      const schedule = await DoctorPortalService.getSchedule('1', '2024-06-15');

      expect(schedule.date).toBe('2024-06-15');
      expect(schedule.slots.length).toBe(0);
    });

    it('should format date correctly for API', async () => {
      let capturedUrl: string = '';
      server.use(
        http.get('*/api/v1/doctors/*/schedule', ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json({
            success: true,
            data: { date: '2024-06-15', slots: [] }
          });
        })
      );

      await DoctorPortalService.getSchedule('1', '2024-06-15');

      expect(capturedUrl).toContain('2024-06-15');
    });
  });

  describe('Week Navigation', () => {
    it('should navigate to previous week', async () => {
      const dates: string[] = [];
      server.use(
        http.get('*/api/v1/doctors/*/schedule', ({ request }) => {
          const url = new URL(request.url);
          const date = url.searchParams.get('date');
          if (date) dates.push(date);
          return HttpResponse.json({
            success: true,
            data: { date: date || '2024-06-15', slots: [] }
          });
        })
      );

      // Load initial week
      await DoctorPortalService.getSchedule('1', '2024-06-15');

      // Load previous week (7 days before)
      const prevDate = new Date('2024-06-15');
      prevDate.setDate(prevDate.getDate() - 7);
      const prevDateStr = prevDate.toISOString().split('T')[0];
      await DoctorPortalService.getSchedule('1', prevDateStr);

      expect(dates.length).toBe(2);
      expect(dates[1]).not.toEqual(dates[0]);
    });

    it('should navigate to next week', async () => {
      const dates: string[] = [];
      server.use(
        http.get('*/api/v1/doctors/*/schedule', ({ request }) => {
          const url = new URL(request.url);
          const date = url.searchParams.get('date');
          if (date) dates.push(date);
          return HttpResponse.json({
            success: true,
            data: { date: date || '2024-06-15', slots: [] }
          });
        })
      );

      // Load initial week
      await DoctorPortalService.getSchedule('1', '2024-06-15');

      // Load next week (7 days later)
      const nextDate = new Date('2024-06-15');
      nextDate.setDate(nextDate.getDate() + 7);
      const nextDateStr = nextDate.toISOString().split('T')[0];
      await DoctorPortalService.getSchedule('1', nextDateStr);

      expect(dates.length).toBe(2);
      expect(dates[1]).not.toEqual(dates[0]);
    });
  });

  describe('Appointment Details', () => {
    it('should retrieve appointment details', async () => {
      server.use(
        http.get('*/api/v1/appointments/*', () => {
          return HttpResponse.json({
            success: true,
            data: {
              id: 'appt-1',
              doctorId: 1,
              doctorName: 'Dr. Smith',
              patientId: 100,
              patientName: 'John Doe',
              patientEmail: 'john@example.com',
              patientPhone: '+1234567890',
              scheduledAt: '2024-06-15T10:00:00Z',
              scheduledEnd: '2024-06-15T10:30:00Z',
              status: 'CONFIRMED',
              type: 'IN_PERSON',
              reason: 'General Checkup',
              notes: '',
            }
          });
        })
      );

      const appointment = await DoctorPortalService.getAppointmentDetails('appt-1');

      expect(appointment.id).toBe('appt-1');
      expect(appointment.patientName).toBe('John Doe');
      expect(appointment.status).toBe('CONFIRMED');
      expect(appointment.type).toBe('IN_PERSON');
    });

    it('should handle appointment not found', async () => {
      server.use(
        http.get('*/api/v1/appointments/*', () => {
          return HttpResponse.json(
            { success: false, error: 'Appointment not found' },
            { status: 404 }
          );
        })
      );

      try {
        await DoctorPortalService.getAppointmentDetails('invalid-appt');
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Consultation Notes', () => {
    it('should create consultation note for appointment', async () => {
      server.use(
        http.post('*/api/v1/consultation-notes', () => {
          return HttpResponse.json({
            success: true,
            data: {
              id: 'note-1',
              appointmentId: 'appt-1',
              diagnosis: 'Hypertension',
              treatment: 'Prescribed medication',
              notes: 'Follow up in 2 weeks',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          });
        })
      );

      const note = await ConsultationNotesService.createNote({
        appointmentId: 'appt-1',
        diagnosis: 'Hypertension',
        treatment: 'Prescribed medication',
        notes: 'Follow up in 2 weeks',
      });

      expect(note.id).toBe('note-1');
      expect(note.diagnosis).toBe('Hypertension');
      expect(note.treatment).toBe('Prescribed medication');
    });

    it('should update consultation note', async () => {
      server.use(
        http.patch('*/api/v1/consultation-notes/*', () => {
          return HttpResponse.json({
            success: true,
            data: {
              id: 'note-1',
              diagnosis: 'Hypertension - Updated',
              treatment: 'Updated treatment plan',
              notes: 'Follow up in 3 weeks',
              updatedAt: new Date().toISOString(),
            }
          });
        })
      );

      const note = await ConsultationNotesService.updateNote('note-1', {
        diagnosis: 'Hypertension - Updated',
        treatment: 'Updated treatment plan',
      });

      expect(note.diagnosis).toBe('Hypertension - Updated');
      expect(note.treatment).toBe('Updated treatment plan');
    });

    it('should retrieve consultation note', async () => {
      server.use(
        http.get('*/api/v1/consultation-notes/*', () => {
          return HttpResponse.json({
            success: true,
            data: {
              id: 'note-1',
              appointmentId: 'appt-1',
              diagnosis: 'Hypertension',
              treatment: 'Prescribed medication',
              notes: 'Follow up in 2 weeks',
              createdAt: '2024-06-15T10:30:00Z',
            }
          });
        })
      );

      const note = await ConsultationNotesService.getNote('note-1');

      expect(note.id).toBe('note-1');
      expect(note.appointmentId).toBe('appt-1');
    });

    it('should delete consultation note', async () => {
      server.use(
        http.delete('*/api/v1/consultation-notes/*', () => {
          return new HttpResponse(null, { status: 204 });
        })
      );

      await ConsultationNotesService.deleteNote('note-1');

      expect(true).toBe(true);
    });

    it('should require appointment ID', async () => {
      server.use(
        http.post('*/api/v1/consultation-notes', () => {
          return HttpResponse.json(
            { success: false, error: 'Appointment ID is required' },
            { status: 400 }
          );
        })
      );

      try {
        await ConsultationNotesService.createNote({
          appointmentId: '',
          diagnosis: 'Test',
        });
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Working Hours', () => {
    it('should retrieve working hours', async () => {
      server.use(
        http.get('*/api/v1/doctors/*/hours', () => {
          return HttpResponse.json({
            success: true,
            data: {
              monday: { startTime: '09:00', endTime: '17:00', isWorking: true },
              tuesday: { startTime: '09:00', endTime: '17:00', isWorking: true },
              wednesday: { startTime: '09:00', endTime: '17:00', isWorking: true },
              thursday: { startTime: '09:00', endTime: '17:00', isWorking: true },
              friday: { startTime: '09:00', endTime: '17:00', isWorking: true },
              saturday: { startTime: null, endTime: null, isWorking: false },
              sunday: { startTime: null, endTime: null, isWorking: false },
            }
          });
        })
      );

      const hours = await DoctorPortalService.getWorkingHours('1');

      expect(hours.monday.isWorking).toBe(true);
      expect(hours.monday.startTime).toBe('09:00');
      expect(hours.monday.endTime).toBe('17:00');
      expect(hours.saturday.isWorking).toBe(false);
    });

    it('should update working hours', async () => {
      server.use(
        http.patch('*/api/v1/doctors/*/hours', () => {
          return HttpResponse.json({
            success: true,
            data: {
              monday: { startTime: '08:00', endTime: '18:00', isWorking: true },
            }
          });
        })
      );

      const updated = await DoctorPortalService.updateWorkingHours('1', {
        monday: { startTime: '08:00', endTime: '18:00', isWorking: true },
      });

      expect(updated.monday.startTime).toBe('08:00');
      expect(updated.monday.endTime).toBe('18:00');
    });
  });

  describe('Doctor Leave', () => {
    it('should retrieve doctor leaves', async () => {
      server.use(
        http.get('*/api/v1/doctors/*/leaves', () => {
          return HttpResponse.json({
            success: true,
            data: [
              {
                id: 1,
                startDate: '2024-07-01',
                endDate: '2024-07-05',
                reason: 'Vacation',
                leaveType: 'PERSONAL',
                status: 'APPROVED',
              },
              {
                id: 2,
                startDate: '2024-08-15',
                endDate: '2024-08-15',
                reason: 'Sick leave',
                leaveType: 'SICK',
                status: 'PENDING',
              },
            ]
          });
        })
      );

      const leaves = await DoctorPortalService.getLeaves('1');

      expect(leaves).toBeDefined();
      expect(leaves.length).toBe(2);
      expect(leaves[0].leaveType).toBe('PERSONAL');
      expect(leaves[1].status).toBe('PENDING');
    });

    it('should create doctor leave', async () => {
      server.use(
        http.post('*/api/v1/doctors/*/leaves', () => {
          return HttpResponse.json({
            success: true,
            data: {
              id: 3,
              startDate: '2024-07-15',
              endDate: '2024-07-20',
              reason: 'Conference',
              leaveType: 'CONFERENCE',
              status: 'PENDING',
            }
          });
        })
      );

      const leave = await DoctorPortalService.createLeave('1', {
        startDate: '2024-07-15',
        endDate: '2024-07-20',
        reason: 'Conference',
        leaveType: 'CONFERENCE',
      });

      expect(leave.id).toBe(3);
      expect(leave.leaveType).toBe('CONFERENCE');
      expect(leave.status).toBe('PENDING');
    });

    it('should handle overlapping leave dates', async () => {
      server.use(
        http.post('*/api/v1/doctors/*/leaves', () => {
          return HttpResponse.json(
            { success: false, error: 'Leave dates overlap with existing leave' },
            { status: 400 }
          );
        })
      );

      try {
        await DoctorPortalService.createLeave('1', {
          startDate: '2024-07-01',
          endDate: '2024-07-05',
          leaveType: 'PERSONAL',
        });
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Appointment Status Updates', () => {
    it('should mark appointment as completed', async () => {
      server.use(
        http.post('*/api/v1/appointments/*/complete', () => {
          return HttpResponse.json({
            success: true,
            data: {
              id: 'appt-1',
              status: 'COMPLETED',
              completedAt: new Date().toISOString(),
            }
          });
        })
      );

      const result = await DoctorPortalService.completeAppointment('appt-1');

      expect(result.status).toBe('COMPLETED');
    });

    it('should mark appointment as no-show', async () => {
      server.use(
        http.post('*/api/v1/appointments/*/no-show', () => {
          return HttpResponse.json({
            success: true,
            data: {
              id: 'appt-1',
              status: 'NO_SHOW',
            }
          });
        })
      );

      const result = await DoctorPortalService.markNoShow('appt-1');

      expect(result.status).toBe('NO_SHOW');
    });
  });

  describe('Appointment List', () => {
    it('should retrieve today\'s appointments', async () => {
      server.use(
        http.get('*/api/v1/doctors/*/appointments/today', () => {
          return HttpResponse.json({
            success: true,
            data: [
              {
                id: 'appt-1',
                patientName: 'John Doe',
                scheduledAt: '2024-06-15T10:00:00Z',
                status: 'CONFIRMED',
                type: 'IN_PERSON',
              },
              {
                id: 'appt-2',
                patientName: 'Jane Smith',
                scheduledAt: '2024-06-15T14:00:00Z',
                status: 'CONFIRMED',
                type: 'TELEHEALTH',
              },
            ]
          });
        })
      );

      const appointments = await DoctorPortalService.getTodayAppointments('1');

      expect(appointments).toBeDefined();
      expect(appointments.length).toBe(2);
      expect(appointments[0].patientName).toBe('John Doe');
    });
  });
});
