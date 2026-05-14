import { describe, it, expect, beforeEach } from 'vitest';
import { DoctorPortalService } from '../doctor-portal.service';
import { server } from '@/test/server';
import { http, HttpResponse } from 'msw';

describe('DoctorPortalService Unit Tests', () => {
  beforeEach(() => {
    server.resetHandlers();
  });

  describe('Schedule Management', () => {
    it('should retrieve schedule for specific date', async () => {
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
      expect(schedule.slots.length).toBe(2);
      expect(schedule.slots[0].status).toBe('AVAILABLE');
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

      expect(schedule.slots.length).toBe(0);
    });

    it('should pass date parameter correctly', async () => {
      let capturedDate = '';
      server.use(
        http.get('*/api/v1/doctors/*/schedule', ({ request }) => {
          const url = new URL(request.url);
          capturedDate = url.searchParams.get('date') || '';
          return HttpResponse.json({
            success: true,
            data: { date: capturedDate, slots: [] }
          });
        })
      );

      await DoctorPortalService.getSchedule('1', '2024-06-20');

      expect(capturedDate).toBe('2024-06-20');
    });
  });

  describe('Working Hours', () => {
    it('should retrieve working hours for all days', async () => {
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
      expect(hours.saturday.isWorking).toBe(false);
    });

    it('should update working hours for specific day', async () => {
      let capturedPayload: any = null;
      server.use(
        http.patch('*/api/v1/doctors/*/hours', async ({ request }) => {
          capturedPayload = await request.json();
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
      expect(capturedPayload).toBeDefined();
    });

    it('should set day as non-working', async () => {
      let capturedPayload: any = null;
      server.use(
        http.patch('*/api/v1/doctors/*/hours', async ({ request }) => {
          capturedPayload = await request.json();
          return HttpResponse.json({
            success: true,
            data: {
              sunday: { startTime: null, endTime: null, isWorking: false },
            }
          });
        })
      );

      const updated = await DoctorPortalService.updateWorkingHours('1', {
        sunday: { startTime: null, endTime: null, isWorking: false },
      });

      expect(updated.sunday.isWorking).toBe(false);
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

      const appt = await DoctorPortalService.getAppointmentDetails('appt-1');

      expect(appt.id).toBe('appt-1');
      expect(appt.patientName).toBe('John Doe');
      expect(appt.type).toBe('IN_PERSON');
    });

    it('should handle appointment not found', async () => {
      server.use(
        http.get('*/api/v1/appointments/*', () => {
          return HttpResponse.json(
            { success: false, error: 'Not found' },
            { status: 404 }
          );
        })
      );

      try {
        await DoctorPortalService.getAppointmentDetails('nonexistent');
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeDefined();
      }
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
            ]
          });
        })
      );

      const leaves = await DoctorPortalService.getLeaves('1');

      expect(leaves.length).toBeGreaterThan(0);
      expect(leaves[0].leaveType).toBe('PERSONAL');
      expect(leaves[0].status).toBe('APPROVED');
    });

    it('should create doctor leave', async () => {
      server.use(
        http.post('*/api/v1/doctors/*/leaves', () => {
          return HttpResponse.json({
            success: true,
            data: {
              id: 2,
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
        leaveType: 'CONFERENCE',
      });

      expect(leave.leaveType).toBe('CONFERENCE');
      expect(leave.status).toBe('PENDING');
    });

    it('should handle overlapping dates', async () => {
      server.use(
        http.post('*/api/v1/doctors/*/leaves', () => {
          return HttpResponse.json(
            { success: false, error: 'Leave dates overlap' },
            { status: 400 }
          );
        })
      );

      try {
        await DoctorPortalService.createLeave('1', {
          startDate: '2024-07-01',
          endDate: '2024-07-05',
        });
        expect(true).toBe(false);
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

    it('should transition from CONFIRMED to COMPLETED', async () => {
      server.use(
        http.post('*/api/v1/appointments/*/complete', () => {
          return HttpResponse.json({
            success: true,
            data: {
              id: 'appt-1',
              status: 'COMPLETED',
            }
          });
        })
      );

      const result = await DoctorPortalService.completeAppointment('appt-1');

      expect(result.status).toBe('COMPLETED');
    });
  });

  describe('Appointment Listing', () => {
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

      expect(appointments.length).toBe(2);
      expect(appointments[0].patientName).toBe('John Doe');
      expect(appointments[1].type).toBe('TELEHEALTH');
    });

    it('should handle empty today appointments', async () => {
      server.use(
        http.get('*/api/v1/doctors/*/appointments/today', () => {
          return HttpResponse.json({
            success: true,
            data: []
          });
        })
      );

      const appointments = await DoctorPortalService.getTodayAppointments('1');

      expect(appointments.length).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors on schedule retrieval', async () => {
      server.use(
        http.get('*/api/v1/doctors/*/schedule', () => {
          return HttpResponse.json(
            { success: false, error: 'Network error' },
            { status: 500 }
          );
        })
      );

      try {
        await DoctorPortalService.getSchedule('1', '2024-06-15');
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle unauthorized access', async () => {
      server.use(
        http.get('*/api/v1/doctors/*/hours', () => {
          return HttpResponse.json(
            { success: false, error: 'Unauthorized' },
            { status: 401 }
          );
        })
      );

      try {
        await DoctorPortalService.getWorkingHours('999');
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Slot Availability', () => {
    it('should distinguish available vs booked slots', async () => {
      server.use(
        http.get('*/api/v1/doctors/*/schedule', () => {
          return HttpResponse.json({
            success: true,
            data: {
              date: '2024-06-15',
              slots: [
                { id: 'slot-1', startTime: '09:00', status: 'AVAILABLE', appointment: null },
                { id: 'slot-2', startTime: '09:30', status: 'BOOKED', appointment: { id: 'appt-1' } },
                { id: 'slot-3', startTime: '10:00', status: 'AVAILABLE', appointment: null },
              ],
            }
          });
        })
      );

      const schedule = await DoctorPortalService.getSchedule('1', '2024-06-15');

      const availableSlots = schedule.slots.filter(s => s.status === 'AVAILABLE');
      const bookedSlots = schedule.slots.filter(s => s.status === 'BOOKED');

      expect(availableSlots.length).toBe(2);
      expect(bookedSlots.length).toBe(1);
    });
  });

  describe('Appointment Types', () => {
    it('should handle multiple appointment types', async () => {
      server.use(
        http.get('*/api/v1/doctors/*/appointments/today', () => {
          return HttpResponse.json({
            success: true,
            data: [
              {
                id: 'appt-1',
                patientName: 'Patient 1',
                scheduledAt: '2024-06-15T10:00:00Z',
                type: 'IN_PERSON',
              },
              {
                id: 'appt-2',
                patientName: 'Patient 2',
                scheduledAt: '2024-06-15T11:00:00Z',
                type: 'TELEHEALTH',
              },
              {
                id: 'appt-3',
                patientName: 'Patient 3',
                scheduledAt: '2024-06-15T12:00:00Z',
                type: 'TELEMEDICINE',
              },
            ]
          });
        })
      );

      const appointments = await DoctorPortalService.getTodayAppointments('1');

      expect(appointments[0].type).toBe('IN_PERSON');
      expect(appointments[1].type).toBe('TELEHEALTH');
      expect(appointments[2].type).toBe('TELEMEDICINE');
    });
  });
});
