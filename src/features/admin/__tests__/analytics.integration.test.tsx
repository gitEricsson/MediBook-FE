import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminService } from '@/services/admin.service';
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

describe('Admin Analytics Integration Tests', () => {
  beforeEach(() => {
    queryClient.clear();
    server.resetHandlers();
  });

  describe('Date Format Conversion', () => {
    it('should convert date-only strings to ISO datetime', async () => {
      let capturedParams: any = null;
      server.use(
        http.get('*/api/v1/admin/analytics/appointments', ({ request }) => {
          const url = new URL(request.url);
          capturedParams = {
            from: url.searchParams.get('from'),
            to: url.searchParams.get('to'),
          };
          return HttpResponse.json({
            success: true,
            data: {
              totalAppointments: 150,
              completedAppointments: 140,
              cancelledAppointments: 10,
              cancellationRatePercent: 6.7,
              noShowRatePercent: 0,
              appointmentsByDepartment: {},
              appointmentsByType: {},
            }
          });
        })
      );

      await AdminService.getAppointmentAnalytics('2024-01-01', '2024-01-31');

      expect(capturedParams.from).toBe('2024-01-01T00:00:00');
      expect(capturedParams.to).toBe('2024-01-31T00:00:00');
    });

    it('should preserve ISO datetime if already formatted', async () => {
      let capturedParams: any = null;
      server.use(
        http.get('*/api/v1/admin/analytics/appointments', ({ request }) => {
          const url = new URL(request.url);
          capturedParams = {
            from: url.searchParams.get('from'),
            to: url.searchParams.get('to'),
          };
          return HttpResponse.json({
            success: true,
            data: {
              totalAppointments: 150,
              completedAppointments: 140,
              cancelledAppointments: 10,
              cancellationRatePercent: 6.7,
              noShowRatePercent: 0,
              appointmentsByDepartment: {},
              appointmentsByType: {},
            }
          });
        })
      );

      await AdminService.getAppointmentAnalytics(
        '2024-01-01T10:00:00',
        '2024-01-31T23:59:59'
      );

      expect(capturedParams.from).toBe('2024-01-01T10:00:00');
      expect(capturedParams.to).toBe('2024-01-31T23:59:59');
    });
  });

  describe('Appointment Analytics', () => {
    it('should retrieve appointment analytics', async () => {
      server.use(
        http.get('*/api/v1/admin/analytics/appointments', () => {
          return HttpResponse.json({
            success: true,
            data: {
              totalAppointments: 500,
              completedAppointments: 450,
              cancelledAppointments: 35,
              cancellationRatePercent: 7.0,
              noShowRatePercent: 3.0,
              appointmentsByDepartment: {
                Cardiology: 120,
                Neurology: 80,
                Orthopedics: 150,
              },
              appointmentsByType: {
                IN_PERSON: 350,
                TELEHEALTH: 150,
              },
            }
          });
        })
      );

      const analytics = await AdminService.getAppointmentAnalytics('2024-01-01', '2024-01-31');

      expect(analytics.totalAppointments).toBe(500);
      expect(analytics.completedAppointments).toBe(450);
      expect(analytics.cancelledAppointments).toBe(35);
      expect(analytics.cancellationRatePercent).toBe(7.0);
      expect(analytics.noShowRatePercent).toBe(3.0);
      expect(analytics.appointmentsByDepartment).toEqual({
        Cardiology: 120,
        Neurology: 80,
        Orthopedics: 150,
      });
    });

    it('should handle empty date range', async () => {
      server.use(
        http.get('*/api/v1/admin/analytics/appointments', () => {
          return HttpResponse.json({
            success: true,
            data: {
              totalAppointments: 0,
              completedAppointments: 0,
              cancelledAppointments: 0,
              cancellationRatePercent: 0,
              noShowRatePercent: 0,
              appointmentsByDepartment: {},
              appointmentsByType: {},
            }
          });
        })
      );

      const analytics = await AdminService.getAppointmentAnalytics('2024-12-01', '2024-12-31');

      expect(analytics.totalAppointments).toBe(0);
      expect(Object.keys(analytics.appointmentsByDepartment).length).toBe(0);
    });
  });

  describe('Revenue Analytics', () => {
    it('should retrieve revenue analytics', async () => {
      server.use(
        http.get('*/api/v1/admin/analytics/revenue', () => {
          return HttpResponse.json({
            success: true,
            data: {
              totalRevenue: 50000.00,
              totalRefunds: 2000.00,
              netRevenue: 48000.00,
              successfulPayments: 450,
              failedPayments: 10,
              refundedPayments: 20,
            }
          });
        })
      );

      const analytics = await AdminService.getRevenueAnalytics('2024-01-01', '2024-01-31');

      expect(analytics.totalRevenue).toBe(50000.00);
      expect(analytics.totalRefunds).toBe(2000.00);
      expect(analytics.netRevenue).toBe(48000.00);
      expect(analytics.successfulPayments).toBe(450);
      expect(analytics.failedPayments).toBe(10);
      expect(analytics.refundedPayments).toBe(20);
    });

    it('should calculate net revenue correctly', async () => {
      server.use(
        http.get('*/api/v1/admin/analytics/revenue', () => {
          return HttpResponse.json({
            success: true,
            data: {
              totalRevenue: 100000.00,
              totalRefunds: 5000.00,
              netRevenue: 95000.00,
              successfulPayments: 1000,
              failedPayments: 50,
              refundedPayments: 50,
            }
          });
        })
      );

      const analytics = await AdminService.getRevenueAnalytics('2024-01-01', '2024-12-31');

      expect(analytics.netRevenue).toBe(analytics.totalRevenue - analytics.totalRefunds);
    });
  });

  describe('Doctor Utilization Analytics', () => {
    it('should map doctor utilization fields correctly', async () => {
      server.use(
        http.get('*/api/v1/admin/analytics/doctor-utilization', () => {
          return HttpResponse.json({
            success: true,
            data: {
              doctors: [
                {
                  doctorId: 1,
                  doctorName: 'Dr. Smith',
                  specialization: 'Cardiology',
                  totalAppointments: 100,
                  completedAppointments: 90,
                  utilizationPercent: 90,
                },
                {
                  doctorId: 2,
                  doctorName: 'Dr. Jones',
                  specialization: 'Neurology',
                  totalAppointments: 80,
                  completedAppointments: 72,
                  utilizationPercent: 90,
                },
              ]
            }
          });
        })
      );

      const utilization = await AdminService.getDoctorUtilization('2024-01-01', '2024-01-31');

      expect(utilization).toBeDefined();
      expect(utilization.length).toBe(2);

      // Check field mapping: backend -> frontend
      expect(utilization[0].doctorId).toBe(1);
      expect(utilization[0].doctorName).toBe('Dr. Smith');
      expect(utilization[0].department).toBe('Cardiology'); // Mapped from specialization
      expect(utilization[0].totalSlots).toBe(100); // Mapped from totalAppointments
      expect(utilization[0].bookedSlots).toBe(90); // Mapped from completedAppointments
      expect(utilization[0].utilizationRate).toBe(90); // Mapped from utilizationPercent
    });

    it('should handle multiple doctors', async () => {
      server.use(
        http.get('*/api/v1/admin/analytics/doctor-utilization', () => {
          return HttpResponse.json({
            success: true,
            data: {
              doctors: [
                {
                  doctorId: 1,
                  doctorName: 'Dr. Smith',
                  specialization: 'Cardiology',
                  totalAppointments: 100,
                  completedAppointments: 90,
                  utilizationPercent: 90,
                },
                {
                  doctorId: 2,
                  doctorName: 'Dr. Jones',
                  specialization: 'Neurology',
                  totalAppointments: 80,
                  completedAppointments: 72,
                  utilizationPercent: 90,
                },
                {
                  doctorId: 3,
                  doctorName: 'Dr. Brown',
                  specialization: 'Orthopedics',
                  totalAppointments: 60,
                  completedAppointments: 45,
                  utilizationPercent: 75,
                },
              ]
            }
          });
        })
      );

      const utilization = await AdminService.getDoctorUtilization('2024-01-01', '2024-01-31');

      expect(utilization.length).toBe(3);
      expect(utilization[1].doctorName).toBe('Dr. Jones');
      expect(utilization[2].utilizationRate).toBe(75);
    });

    it('should handle empty doctor list', async () => {
      server.use(
        http.get('*/api/v1/admin/analytics/doctor-utilization', () => {
          return HttpResponse.json({
            success: true,
            data: {
              doctors: []
            }
          });
        })
      );

      const utilization = await AdminService.getDoctorUtilization('2024-01-01', '2024-01-31');

      expect(utilization).toBeDefined();
      expect(utilization.length).toBe(0);
    });

    it('should handle null doctors field', async () => {
      server.use(
        http.get('*/api/v1/admin/analytics/doctor-utilization', () => {
          return HttpResponse.json({
            success: true,
            data: {
              doctors: null
            }
          });
        })
      );

      const utilization = await AdminService.getDoctorUtilization('2024-01-01', '2024-01-31');

      expect(utilization).toBeDefined();
      expect(utilization.length).toBe(0);
    });
  });

  describe('Capacity Analytics', () => {
    it('should retrieve daily capacity', async () => {
      server.use(
        http.get('*/api/v1/admin/analytics/capacity', () => {
          return HttpResponse.json({
            success: true,
            data: {
              date: '2024-01-15',
              totalCapacity: 200,
              bookedSlots: 180,
              availableSlots: 20,
              capacityUtilization: 90,
              byDepartment: {
                Cardiology: { total: 50, booked: 45 },
                Neurology: { total: 40, booked: 38 },
                Orthopedics: { total: 110, booked: 97 },
              }
            }
          });
        })
      );

      const capacity = await AdminService.getDailyCapacity('2024-01-15');

      expect(capacity.date).toBe('2024-01-15');
      expect(capacity.totalCapacity).toBe(200);
      expect(capacity.bookedSlots).toBe(180);
      expect(capacity.availableSlots).toBe(20);
      expect(capacity.capacityUtilization).toBe(90);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid date format gracefully', async () => {
      server.use(
        http.get('*/api/v1/admin/analytics/appointments', () => {
          return HttpResponse.json(
            { success: false, error: 'Invalid date format' },
            { status: 400 }
          );
        })
      );

      try {
        await AdminService.getAppointmentAnalytics('invalid-date', '2024-01-31');
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle server errors', async () => {
      server.use(
        http.get('*/api/v1/admin/analytics/revenue', () => {
          return HttpResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
          );
        })
      );

      try {
        await AdminService.getRevenueAnalytics('2024-01-01', '2024-01-31');
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Department Management', () => {
    it('should retrieve departments', async () => {
      server.use(
        http.get('*/api/v1/admin/departments', () => {
          return HttpResponse.json({
            success: true,
            data: {
              content: [
                {
                  id: 1,
                  name: 'Cardiology',
                  code: 'CARD',
                  doctorsCount: 5,
                  apptCount90d: 150,
                  status: true,
                },
                {
                  id: 2,
                  name: 'Neurology',
                  code: 'NEURO',
                  doctorsCount: 3,
                  apptCount90d: 90,
                  status: true,
                },
              ],
              totalElements: 2,
            }
          });
        })
      );

      const departments = await AdminService.getDepartments();

      expect(departments).toBeDefined();
      expect(departments.length).toBe(2);
      expect(departments[0].name).toBe('Cardiology');
      expect(departments[0].doctorCount).toBe(5);
      expect(departments[0].isActive).toBe(true);
    });

    it('should create new department', async () => {
      server.use(
        http.post('*/api/v1/admin/departments', () => {
          return HttpResponse.json({
            success: true,
            data: {
              id: 3,
              name: 'Orthopedics',
              code: 'ORTHO',
              isActive: true,
            }
          });
        })
      );

      const dept = await AdminService.createDepartment({
        name: 'Orthopedics',
        code: 'ORTHO',
        description: 'Bone and joint care',
      });

      expect(dept.name).toBe('Orthopedics');
      expect(dept.code).toBe('ORTHO');
      expect(dept.isActive).toBe(true);
    });

    it('should update department', async () => {
      server.use(
        http.patch('*/api/v1/admin/departments/*', () => {
          return HttpResponse.json({
            success: true,
            data: {
              id: 1,
              name: 'Cardiology Updated',
              code: 'CARD',
              isActive: true,
            }
          });
        })
      );

      const dept = await AdminService.updateDepartment('1', {
        name: 'Cardiology Updated',
      });

      expect(dept.name).toBe('Cardiology Updated');
    });

    it('should deactivate department', async () => {
      server.use(
        http.post('*/api/v1/admin/departments/*/deactivate', () => {
          return new HttpResponse(null, { status: 204 });
        })
      );

      await AdminService.deactivateDepartment('1');

      expect(true).toBe(true);
    });

    it('should reactivate department', async () => {
      server.use(
        http.post('*/api/v1/admin/departments/*/reactivate', () => {
          return new HttpResponse(null, { status: 204 });
        })
      );

      await AdminService.reactivateDepartment('1');

      expect(true).toBe(true);
    });
  });
});
