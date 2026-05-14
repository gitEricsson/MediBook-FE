import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BookingService } from '@/services/booking.service';
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

describe('Appointment Booking Integration Tests', () => {
  beforeEach(() => {
    useAuthStore.getState().setUnauthenticated();
    queryClient.clear();
    server.resetHandlers();
  });

  describe('Hold Slot', () => {
    it('should hold slot and return holdId with expiry', async () => {
      server.use(
        http.post('*/api/v1/appointments/holds', () => {
          const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
          return HttpResponse.json({
            success: true,
            data: {
              holdId: 'hold-123-abc',
              expiresAt: expiresAt.toISOString(),
            }
          });
        })
      );

      const holdData = {
        doctorId: 1,
        scheduledAt: '2024-06-15T10:00:00Z',
        scheduledEnd: '2024-06-15T10:30:00Z',
      };

      const result = await BookingService.holdSlot(holdData);

      expect(result.holdId).toBeDefined();
      expect(result.holdId).toBe('hold-123-abc');
      expect(result.expiresAt).toBeDefined();

      // Verify expiry is approximately 10 minutes from now
      const expiryTime = new Date(result.expiresAt).getTime();
      const now = Date.now();
      const diffMinutes = (expiryTime - now) / (1000 * 60);
      expect(diffMinutes).toBeGreaterThan(9);
      expect(diffMinutes).toBeLessThanOrEqual(10);
    });

    it('should handle hold slot failure', async () => {
      server.use(
        http.post('*/api/v1/appointments/holds', () => {
          return HttpResponse.json(
            { success: false, error: 'Doctor slot not available' },
            { status: 400 }
          );
        })
      );

      const holdData = {
        doctorId: 999,
        scheduledAt: '2024-06-15T10:00:00Z',
        scheduledEnd: '2024-06-15T10:30:00Z',
      };

      try {
        await BookingService.holdSlot(holdData);
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should return expired holdId for past times', async () => {
      const pastTime = new Date(Date.now() - 1000).toISOString();

      server.use(
        http.post('*/api/v1/appointments/holds', () => {
          return HttpResponse.json({
            success: true,
            data: {
              holdId: 'expired-hold-456',
              expiresAt: pastTime,
            }
          });
        })
      );

      const holdData = {
        doctorId: 1,
        scheduledAt: '2024-01-01T10:00:00Z',
        scheduledEnd: '2024-01-01T10:30:00Z',
      };

      const result = await BookingService.holdSlot(holdData);
      expect(result.holdId).toBeDefined();
      expect(new Date(result.expiresAt).getTime()).toBeLessThan(Date.now());
    });
  });

  describe('Confirm Booking', () => {
    it('should confirm booking with valid hold', async () => {
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
              reason: 'General Checkup',
              createdAt: new Date().toISOString(),
            }
          });
        })
      );

      const confirmData = {
        holdId: 'hold-123-abc',
        doctorId: 1,
        scheduledAt: '2024-06-15T10:00:00Z',
        scheduledEnd: '2024-06-15T10:30:00Z',
      };

      const result = await BookingService.confirmBooking(confirmData);

      expect(result.id).toBe('appt-123');
      expect(result.status).toBe('PENDING');
      expect(result.doctorId).toBe(1);
      expect(result.patientName).toBe('John Doe');
    });

    it('should reject booking without valid hold', async () => {
      server.use(
        http.post('*/api/v1/appointments$', () => {
          return HttpResponse.json(
            { success: false, error: 'Hold expired or invalid' },
            { status: 400 }
          );
        })
      );

      const confirmData = {
        holdId: 'invalid-hold',
        doctorId: 1,
        scheduledAt: '2024-06-15T10:00:00Z',
        scheduledEnd: '2024-06-15T10:30:00Z',
      };

      try {
        await BookingService.confirmBooking(confirmData);
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should reject double-booking', async () => {
      server.use(
        http.post('*/api/v1/appointments$', () => {
          return HttpResponse.json(
            { success: false, error: 'Slot already booked' },
            { status: 409 }
          );
        })
      );

      const confirmData = {
        holdId: 'hold-123-abc',
        doctorId: 1,
        scheduledAt: '2024-06-15T10:00:00Z',
        scheduledEnd: '2024-06-15T10:30:00Z',
      };

      try {
        await BookingService.confirmBooking(confirmData);
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Cancel Appointment', () => {
    it('should cancel appointment with CANCELLED status', async () => {
      server.use(
        http.post('*/api/v1/appointments/*/cancel', () => {
          return HttpResponse.json({
            success: true,
            data: {
              id: 'appt-123',
              status: 'CANCELLED',
              doctorId: 1,
              doctorName: 'Dr. Smith',
              scheduledAt: '2024-06-15T10:00:00Z',
              scheduledEnd: '2024-06-15T10:30:00Z',
              reason: 'Patient request',
              cancelledAt: new Date().toISOString(),
            }
          });
        })
      );

      const result = await BookingService.cancel('appt-123', 'Patient request');

      expect(result.id).toBe('appt-123');
      expect(result.status).toBe('CANCELLED');
    });

    it('should handle cancel with reason', async () => {
      let capturedReason = '';
      server.use(
        http.post('*/api/v1/appointments/*/cancel', async ({ request }) => {
          const body = await request.json() as any;
          capturedReason = body.reason;
          return HttpResponse.json({
            success: true,
            data: {
              id: 'appt-123',
              status: 'CANCELLED',
            }
          });
        })
      );

      await BookingService.cancel('appt-123', 'Scheduling conflict');

      expect(capturedReason).toBe('Scheduling conflict');
    });

    it('should fail for non-existent appointment', async () => {
      server.use(
        http.post('*/api/v1/appointments/*/cancel', () => {
          return HttpResponse.json(
            { success: false, error: 'Appointment not found' },
            { status: 404 }
          );
        })
      );

      try {
        await BookingService.cancel('non-existent-appt');
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Recurring Appointments', () => {
    it('should format timeOfDay as HH:mm string', async () => {
      let capturedPayload: any = null;
      server.use(
        http.post('*/api/v1/appointments/recurring', async ({ request }) => {
          capturedPayload = await request.json();
          return HttpResponse.json({
            success: true,
            data: {
              id: 'recurring-123',
              doctorId: 1,
              status: 'ACTIVE',
            }
          });
        })
      );

      await BookingService.createRecurringSeries({
        doctorId: 1,
        timeOfDay: { hour: 9, minute: 30 },
        appointmentType: 'IN_PERSON',
        recurrenceType: 'WEEKLY',
        startDate: '2024-06-15',
      });

      expect(capturedPayload).toBeDefined();
      expect(capturedPayload.timeOfDay).toBe('09:30');
      expect(typeof capturedPayload.timeOfDay).toBe('string');
    });

    it('should pad single digit hours and minutes', async () => {
      let capturedPayload: any = null;
      server.use(
        http.post('*/api/v1/appointments/recurring', async ({ request }) => {
          capturedPayload = await request.json();
          return HttpResponse.json({
            success: true,
            data: { id: 'recurring-456', status: 'ACTIVE' }
          });
        })
      );

      await BookingService.createRecurringSeries({
        doctorId: 1,
        timeOfDay: { hour: 8, minute: 5 },
        appointmentType: 'IN_PERSON',
        recurrenceType: 'WEEKLY',
        startDate: '2024-06-15',
      });

      expect(capturedPayload.timeOfDay).toBe('08:05');
    });

    it('should handle 24-hour format correctly', async () => {
      let capturedPayload: any = null;
      server.use(
        http.post('*/api/v1/appointments/recurring', async ({ request }) => {
          capturedPayload = await request.json();
          return HttpResponse.json({
            success: true,
            data: { id: 'recurring-789', status: 'ACTIVE' }
          });
        })
      );

      await BookingService.createRecurringSeries({
        doctorId: 1,
        timeOfDay: { hour: 17, minute: 45 },
        appointmentType: 'TELEHEALTH',
        recurrenceType: 'MONTHLY',
        startDate: '2024-06-15',
      });

      expect(capturedPayload.timeOfDay).toBe('17:45');
    });

    it('should include all required fields for recurring series', async () => {
      let capturedPayload: any = null;
      server.use(
        http.post('*/api/v1/appointments/recurring', async ({ request }) => {
          capturedPayload = await request.json();
          return HttpResponse.json({
            success: true,
            data: { id: 'recurring-999', status: 'ACTIVE' }
          });
        })
      );

      await BookingService.createRecurringSeries({
        doctorId: 5,
        timeOfDay: { hour: 14, minute: 0 },
        appointmentType: 'IN_PERSON',
        recurrenceType: 'WEEKLY',
        recurrenceInterval: 2,
        startDate: '2024-06-15',
        endDate: '2024-12-31',
        maxOccurrences: 26,
        durationMins: 30,
        reason: 'Follow-up',
      });

      expect(capturedPayload.doctorId).toBe(5);
      expect(capturedPayload.recurrenceType).toBe('WEEKLY');
      expect(capturedPayload.recurrenceInterval).toBe(2);
      expect(capturedPayload.startDate).toBe('2024-06-15');
      expect(capturedPayload.endDate).toBe('2024-12-31');
      expect(capturedPayload.maxOccurrences).toBe(26);
      expect(capturedPayload.durationMins).toBe(30);
      expect(capturedPayload.reason).toBe('Follow-up');
    });

    it('should cancel recurring series', async () => {
      server.use(
        http.delete('*/api/v1/appointments/recurring/*', () => {
          return new HttpResponse(null, { status: 204 });
        })
      );

      await BookingService.cancelSeries('recurring-123');

      // If no error thrown, test passes
      expect(true).toBe(true);
    });

    it('should retrieve my recurring series', async () => {
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
                },
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
  });

  describe('Get My Appointments', () => {
    it('should retrieve upcoming appointments', async () => {
      server.use(
        http.get('*/api/v1/me/appointments', () => {
          return HttpResponse.json({
            success: true,
            data: {
              content: [
                {
                  id: 'appt-1',
                  doctorName: 'Dr. Smith',
                  scheduledAt: '2024-06-15T10:00:00Z',
                  status: 'PENDING',
                },
                {
                  id: 'appt-2',
                  doctorName: 'Dr. Jones',
                  scheduledAt: '2024-06-20T14:00:00Z',
                  status: 'CONFIRMED',
                },
              ],
              totalElements: 2,
            }
          });
        })
      );

      const appointments = await BookingService.getMyAppointments('upcoming');

      expect(appointments).toBeDefined();
      expect(appointments.length).toBe(2);
      expect(appointments[0].doctorName).toBe('Dr. Smith');
    });

    it('should retrieve past appointments', async () => {
      server.use(
        http.get('*/api/v1/me/appointments', () => {
          return HttpResponse.json({
            success: true,
            data: {
              content: [
                {
                  id: 'appt-old-1',
                  doctorName: 'Dr. Brown',
                  scheduledAt: '2024-05-15T10:00:00Z',
                  status: 'COMPLETED',
                },
              ],
              totalElements: 1,
            }
          });
        })
      );

      const appointments = await BookingService.getMyAppointments('past');

      expect(appointments).toBeDefined();
      expect(appointments[0].status).toBe('COMPLETED');
    });
  });

  describe('Reschedule Appointment', () => {
    it('should reschedule appointment with new time', async () => {
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
        '2024-07-15T10:30:00Z',
        'hold-new-123'
      );

      expect(result.id).toBe('appt-123');
      expect(result.scheduledAt).toBe('2024-07-15T10:00:00Z');
    });

    it('should reject reschedule if slot unavailable', async () => {
      server.use(
        http.post('*/api/v1/appointments/*/reschedule', () => {
          return HttpResponse.json(
            { success: false, error: 'New slot not available' },
            { status: 400 }
          );
        })
      );

      try {
        await BookingService.reschedule(
          'appt-123',
          '2024-07-15T10:00:00Z',
          '2024-07-15T10:30:00Z'
        );
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
});
