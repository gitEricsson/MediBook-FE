import { describe, it, expect, beforeEach } from 'vitest';
import { BookingService } from '../booking.service';
import { server } from '@/test/server';
import { http, HttpResponse } from 'msw';

describe('BookingService Unit Tests', () => {
  beforeEach(() => {
    server.resetHandlers();
  });

  describe('Hold Slot', () => {
    it('should hold appointment slot', async () => {
      server.use(
        http.post('*/api/v1/appointments/holds', () => {
          return HttpResponse.json({
            success: true,
            data: {
              holdId: 'hold-abc-123',
              expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
            }
          });
        })
      );

      const result = await BookingService.holdSlot({
        doctorId: 1,
        scheduledAt: '2024-06-15T10:00:00Z',
        scheduledEnd: '2024-06-15T10:30:00Z',
      });

      expect(result.holdId).toBeDefined();
      expect(result.expiresAt).toBeDefined();
    });

    it('should parse hold response correctly', async () => {
      const expiryTime = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      server.use(
        http.post('*/api/v1/appointments/holds', () => {
          return HttpResponse.json({
            success: true,
            data: {
              holdId: 'hold-123',
              expiresAt: expiryTime,
            }
          });
        })
      );

      const result = await BookingService.holdSlot({
        doctorId: 1,
        scheduledAt: '2024-06-15T10:00:00Z',
        scheduledEnd: '2024-06-15T10:30:00Z',
      });

      expect(typeof result.holdId).toBe('string');
      expect(new Date(result.expiresAt).getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('Confirm Booking', () => {
    it('should confirm appointment with hold', async () => {
      server.use(
        http.post('*/api/v1/appointments$', () => {
          return HttpResponse.json({
            success: true,
            data: {
              id: 'appt-123',
              doctorId: 1,
              doctorName: 'Dr. Smith',
              patientName: 'John Doe',
              scheduledAt: '2024-06-15T10:00:00Z',
              scheduledEnd: '2024-06-15T10:30:00Z',
              status: 'PENDING',
              type: 'IN_PERSON',
            }
          });
        })
      );

      const result = await BookingService.confirmBooking({
        holdId: 'hold-123',
        doctorId: 1,
        scheduledAt: '2024-06-15T10:00:00Z',
        scheduledEnd: '2024-06-15T10:30:00Z',
      });

      expect(result.id).toBe('appt-123');
      expect(result.status).toBe('PENDING');
    });

    it('should include all appointment details', async () => {
      server.use(
        http.post('*/api/v1/appointments$', () => {
          return HttpResponse.json({
            success: true,
            data: {
              id: 'appt-456',
              doctorId: 2,
              doctorName: 'Dr. Jones',
              patientName: 'Jane Doe',
              patientEmail: 'jane@example.com',
              patientPhone: '+1234567890',
              scheduledAt: '2024-06-20T14:00:00Z',
              scheduledEnd: '2024-06-20T14:30:00Z',
              status: 'PENDING',
              type: 'TELEHEALTH',
              reason: 'Follow-up consultation',
              createdAt: new Date().toISOString(),
            }
          });
        })
      );

      const result = await BookingService.confirmBooking({
        holdId: 'hold-456',
        doctorId: 2,
        scheduledAt: '2024-06-20T14:00:00Z',
        scheduledEnd: '2024-06-20T14:30:00Z',
      });

      expect(result.patientName).toBe('Jane Doe');
      expect(result.type).toBe('TELEHEALTH');
      expect(result.reason).toBe('Follow-up consultation');
    });
  });

  describe('Cancel Appointment', () => {
    it('should cancel appointment', async () => {
      server.use(
        http.post('*/api/v1/appointments/*/cancel', () => {
          return HttpResponse.json({
            success: true,
            data: {
              id: 'appt-123',
              status: 'CANCELLED',
              cancelledAt: new Date().toISOString(),
            }
          });
        })
      );

      const result = await BookingService.cancel('appt-123');

      expect(result.status).toBe('CANCELLED');
    });

    it('should include cancellation reason', async () => {
      let capturedReason = '';
      server.use(
        http.post('*/api/v1/appointments/*/cancel', async ({ request }) => {
          const body = await request.json() as any;
          capturedReason = body.reason;
          return HttpResponse.json({
            success: true,
            data: { id: 'appt-123', status: 'CANCELLED' }
          });
        })
      );

      await BookingService.cancel('appt-123', 'Patient request');

      expect(capturedReason).toBe('Patient request');
    });
  });

  describe('Reschedule Appointment', () => {
    it('should reschedule to new time', async () => {
      server.use(
        http.post('*/api/v1/appointments/*/reschedule', () => {
          return HttpResponse.json({
            success: true,
            data: {
              id: 'appt-123',
              scheduledAt: '2024-07-15T10:00:00Z',
              scheduledEnd: '2024-07-15T10:30:00Z',
              status: 'PENDING',
            }
          });
        })
      );

      const result = await BookingService.reschedule(
        'appt-123',
        '2024-07-15T10:00:00Z',
        '2024-07-15T10:30:00Z'
      );

      expect(result.scheduledAt).toBe('2024-07-15T10:00:00Z');
      expect(result.scheduledEnd).toBe('2024-07-15T10:30:00Z');
    });

    it('should include hold ID when rescheduling', async () => {
      let capturedHoldId = '';
      server.use(
        http.post('*/api/v1/appointments/*/reschedule', async ({ request }) => {
          const body = await request.json() as any;
          capturedHoldId = body.holdId;
          return HttpResponse.json({
            success: true,
            data: { id: 'appt-123', status: 'PENDING' }
          });
        })
      );

      await BookingService.reschedule(
        'appt-123',
        '2024-07-15T10:00:00Z',
        '2024-07-15T10:30:00Z',
        'new-hold-123'
      );

      expect(capturedHoldId).toBe('new-hold-123');
    });
  });

  describe('Recurring Appointments', () => {
    it('should create recurring series with proper payload', async () => {
      let capturedPayload: any = null;
      server.use(
        http.post('*/api/v1/appointments/recurring', async ({ request }) => {
          capturedPayload = await request.json();
          return HttpResponse.json({
            success: true,
            data: { id: 'recurring-123' }
          });
        })
      );

      await BookingService.createRecurringSeries({
        doctorId: 1,
        recurrenceType: 'WEEKLY',
        startDate: '2024-06-15',
        timeOfDay: { hour: 10, minute: 30 },
        appointmentType: 'IN_PERSON',
      });

      expect(capturedPayload.doctorId).toBe(1);
      expect(capturedPayload.recurrenceType).toBe('WEEKLY');
      expect(capturedPayload.timeOfDay).toBe('10:30');
    });

    it('should format timeOfDay with leading zeros', async () => {
      let capturedTimeOfDay = '';
      server.use(
        http.post('*/api/v1/appointments/recurring', async ({ request }) => {
          const body = await request.json() as any;
          capturedTimeOfDay = body.timeOfDay;
          return HttpResponse.json({
            success: true,
            data: { id: 'recurring-123' }
          });
        })
      );

      await BookingService.createRecurringSeries({
        doctorId: 1,
        recurrenceType: 'WEEKLY',
        startDate: '2024-06-15',
        timeOfDay: { hour: 8, minute: 5 },
        appointmentType: 'IN_PERSON',
      });

      expect(capturedTimeOfDay).toBe('08:05');
    });

    it('should include all optional fields when provided', async () => {
      let capturedPayload: any = null;
      server.use(
        http.post('*/api/v1/appointments/recurring', async ({ request }) => {
          capturedPayload = await request.json();
          return HttpResponse.json({
            success: true,
            data: { id: 'recurring-456' }
          });
        })
      );

      await BookingService.createRecurringSeries({
        doctorId: 2,
        recurrenceType: 'MONTHLY',
        recurrenceInterval: 2,
        startDate: '2024-06-15',
        endDate: '2024-12-31',
        maxOccurrences: 10,
        timeOfDay: { hour: 14, minute: 0 },
        durationMins: 45,
        appointmentType: 'TELEHEALTH',
        reason: 'Regular follow-up',
      });

      expect(capturedPayload.recurrenceInterval).toBe(2);
      expect(capturedPayload.endDate).toBe('2024-12-31');
      expect(capturedPayload.maxOccurrences).toBe(10);
      expect(capturedPayload.durationMins).toBe(45);
      expect(capturedPayload.reason).toBe('Regular follow-up');
    });

    it('should retrieve recurring series', async () => {
      server.use(
        http.get('*/api/v1/appointments/recurring/my', () => {
          return HttpResponse.json({
            success: true,
            data: {
              content: [
                {
                  id: 1,
                  doctorName: 'Dr. Smith',
                  recurrenceType: 'WEEKLY',
                  startDate: '2024-06-15',
                  status: 'ACTIVE',
                  appointmentType: 'IN_PERSON',
                }
              ],
              totalElements: 1,
            }
          });
        })
      );

      const result = await BookingService.getMySeries(0, 20);

      expect(result.content).toBeDefined();
      expect(result.content.length).toBeGreaterThan(0);
      expect(result.content[0].recurrenceType).toBe('WEEKLY');
    });

    it('should cancel recurring series', async () => {
      server.use(
        http.delete('*/api/v1/appointments/recurring/*', () => {
          return new HttpResponse(null, { status: 204 });
        })
      );

      await BookingService.cancelSeries('recurring-123');

      expect(true).toBe(true);
    });
  });

  describe('Get Appointments', () => {
    it('should retrieve upcoming appointments', async () => {
      server.use(
        http.get('*/api/v1/me/appointments', ({ request }) => {
          const url = new URL(request.url);
          const tab = url.searchParams.get('tab');

          if (tab === 'upcoming') {
            return HttpResponse.json({
              success: true,
              data: {
                content: [
                  {
                    id: 'appt-1',
                    doctorName: 'Dr. Smith',
                    scheduledAt: '2024-06-15T10:00:00Z',
                    status: 'CONFIRMED',
                  }
                ],
                totalElements: 1,
              }
            });
          }
          return HttpResponse.json({ success: true, data: { content: [] } });
        })
      );

      const result = await BookingService.getMyAppointments('upcoming');

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].doctorName).toBe('Dr. Smith');
    });

    it('should retrieve past appointments', async () => {
      server.use(
        http.get('*/api/v1/me/appointments', ({ request }) => {
          const url = new URL(request.url);
          const tab = url.searchParams.get('tab');

          if (tab === 'past') {
            return HttpResponse.json({
              success: true,
              data: {
                content: [
                  {
                    id: 'appt-old',
                    doctorName: 'Dr. Brown',
                    scheduledAt: '2024-05-15T10:00:00Z',
                    status: 'COMPLETED',
                  }
                ],
                totalElements: 1,
              }
            });
          }
          return HttpResponse.json({ success: true, data: { content: [] } });
        })
      );

      const result = await BookingService.getMyAppointments('past');

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].status).toBe('COMPLETED');
    });

    it('should default to upcoming appointments', async () => {
      let capturedTab = '';
      server.use(
        http.get('*/api/v1/me/appointments', ({ request }) => {
          const url = new URL(request.url);
          capturedTab = url.searchParams.get('tab') || '';
          return HttpResponse.json({
            success: true,
            data: { content: [] }
          });
        })
      );

      await BookingService.getMyAppointments();

      expect(capturedTab).toBe('upcoming');
    });
  });

  describe('Response Parsing', () => {
    it('should handle appointment with all fields', async () => {
      server.use(
        http.post('*/api/v1/appointments$', () => {
          return HttpResponse.json({
            success: true,
            data: {
              id: 'appt-full',
              doctorId: 1,
              doctorName: 'Dr. Complete',
              patientId: 100,
              patientName: 'Complete Patient',
              patientEmail: 'patient@example.com',
              patientPhone: '+1234567890',
              scheduledAt: '2024-06-15T10:00:00Z',
              scheduledEnd: '2024-06-15T10:30:00Z',
              status: 'PENDING',
              type: 'IN_PERSON',
              reason: 'Checkup',
              notes: 'Important notes',
              createdAt: '2024-06-01T00:00:00Z',
              updatedAt: '2024-06-01T00:00:00Z',
            }
          });
        })
      );

      const result = await BookingService.confirmBooking({
        holdId: 'hold-123',
        doctorId: 1,
        scheduledAt: '2024-06-15T10:00:00Z',
        scheduledEnd: '2024-06-15T10:30:00Z',
      });

      expect(result.id).toBeDefined();
      expect(result.doctorId).toBeDefined();
      expect(result.patientName).toBeDefined();
      expect(result.reason).toBeDefined();
      expect(result.type).toBeDefined();
    });
  });
});
