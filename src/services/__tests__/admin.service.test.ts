import { describe, it, expect, beforeEach } from 'vitest';
import { AdminService } from '../admin.service';
import { server } from '@/test/server';
import { http, HttpResponse } from 'msw';

describe('AdminService Unit Tests', () => {
  beforeEach(() => {
    server.resetHandlers();
  });

  describe('Department Management', () => {
    it('should retrieve departments with pagination', async () => {
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
                  apptCount90d: 120,
                  status: true,
                },
              ],
              totalElements: 1,
            }
          });
        })
      );

      const departments = await AdminService.getDepartments();

      expect(Array.isArray(departments)).toBe(true);
      expect(departments.length).toBeGreaterThan(0);
      expect(departments[0].name).toBe('Cardiology');
      expect(departments[0].code).toBe('CARD');
      expect(departments[0].isActive).toBe(true);
    });

    it('should create department', async () => {
      server.use(
        http.post('*/api/v1/admin/departments', async ({ request }) => {
          const body = await request.json() as any;
          return HttpResponse.json({
            success: true,
            data: {
              id: 2,
              name: body.name,
              code: body.code,
              isActive: true,
            }
          });
        })
      );

      const dept = await AdminService.createDepartment({
        name: 'Neurology',
        code: 'NEURO',
        description: 'Nervous system disorders',
      });

      expect(dept.name).toBe('Neurology');
      expect(dept.code).toBe('NEURO');
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

  describe('User Management', () => {
    it('should retrieve all users', async () => {
      server.use(
        http.get('*/api/v1/users', () => {
          return HttpResponse.json({
            success: true,
            data: {
              content: [
                {
                  id: 1,
                  email: 'admin@example.com',
                  firstName: 'Admin',
                  lastName: 'User',
                  role: 'ROLE_ADMIN',
                  enabled: true,
                },
                {
                  id: 2,
                  email: 'doctor@example.com',
                  firstName: 'Dr',
                  lastName: 'Smith',
                  role: 'ROLE_DOCTOR',
                  enabled: true,
                },
              ],
              totalElements: 2,
            }
          });
        })
      );

      const users = await AdminService.getUsers();

      expect(users.length).toBe(2);
      expect(users[0].role).toBe('admin');
      expect(users[1].role).toBe('doctor');
    });

    it('should retrieve doctors with pagination', async () => {
      server.use(
        http.get('*/api/v1/doctors', () => {
          return HttpResponse.json({
            success: true,
            data: {
              content: [
                {
                  id: 1,
                  firstName: 'Dr',
                  lastName: 'Smith',
                  email: 'dr.smith@example.com',
                  specialization: 'Cardiology',
                }
              ],
              totalElements: 1,
            }
          });
        })
      );

      const doctors = await AdminService.getDoctors(0, 50);

      expect(doctors.length).toBeGreaterThan(0);
      expect(doctors[0].firstName).toBe('Dr');
    });

    it('should create doctor', async () => {
      server.use(
        http.post('*/api/v1/admin/doctors', () => {
          return HttpResponse.json({
            success: true,
            data: {
              id: 3,
              firstName: 'Dr',
              lastName: 'Johnson',
              email: 'dr.johnson@example.com',
              specialization: 'Orthopedics',
              departmentId: 1,
            }
          });
        })
      );

      const doctor = await AdminService.createDoctor({
        firstName: 'Dr',
        lastName: 'Johnson',
        email: 'dr.johnson@example.com',
        departmentId: '1',
      });

      expect(doctor.firstName).toBe('Dr');
      expect(doctor.lastName).toBe('Johnson');
    });

    it('should update user role', async () => {
      server.use(
        http.patch('*/api/v1/users/*/role', () => {
          return HttpResponse.json({ success: true, data: {} });
        })
      );

      await AdminService.updateUserRole('1', 'admin');
      expect(true).toBe(true);
    });

    it('should revoke user sessions', async () => {
      server.use(
        http.post('*/api/v1/users/*/revoke-sessions', () => {
          return new HttpResponse(null, { status: 204 });
        })
      );

      await AdminService.revokeUserSessions('1');
      expect(true).toBe(true);
    });
  });

  describe('Analytics', () => {
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
              appointmentsByDepartment: { Cardiology: 120 },
              appointmentsByType: { IN_PERSON: 350 },
            }
          });
        })
      );

      const analytics = await AdminService.getAppointmentAnalytics('2024-01-01', '2024-01-31');

      expect(analytics.totalAppointments).toBe(500);
      expect(analytics.completedAppointments).toBe(450);
      expect(analytics.cancellationRatePercent).toBe(7.0);
    });

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
      expect(analytics.netRevenue).toBe(48000.00);
    });

    it('should retrieve doctor utilization with field mapping', async () => {
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
              ]
            }
          });
        })
      );

      const utilization = await AdminService.getDoctorUtilization('2024-01-01', '2024-01-31');

      expect(utilization[0].department).toBe('Cardiology');
      expect(utilization[0].totalSlots).toBe(100);
      expect(utilization[0].bookedSlots).toBe(90);
      expect(utilization[0].utilizationRate).toBe(90);
    });

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
            }
          });
        })
      );

      const capacity = await AdminService.getDailyCapacity('2024-01-15');

      expect(capacity.date).toBe('2024-01-15');
      expect(capacity.totalCapacity).toBe(200);
      expect(capacity.capacityUtilization).toBe(90);
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
              }
            ]
          });
        })
      );

      const leaves = await AdminService.getDoctorLeaves('1');

      expect(leaves.length).toBeGreaterThan(0);
      expect(leaves[0].leaveType).toBe('PERSONAL');
    });

    it('should create doctor leave', async () => {
      server.use(
        http.post('*/api/v1/doctors/*/leaves', () => {
          return HttpResponse.json({
            success: true,
            data: { id: 2, status: 'PENDING' }
          });
        })
      );

      const leave = await AdminService.createDoctorLeave('1', {
        startDate: '2024-07-15',
        endDate: '2024-07-20',
        leaveType: 'CONFERENCE',
      });

      expect(leave.status).toBe('PENDING');
    });
  });

  describe('System Health', () => {
    it('should retrieve system health', async () => {
      server.use(
        http.get('*/health', () => {
          return HttpResponse.json({
            status: 'UP',
            database: { status: 'UP' },
            cache: { status: 'UP' },
          });
        })
      );

      const health = await AdminService.getHealth();

      expect(health.status).toBe('UP');
    });

    it('should retrieve system version', async () => {
      server.use(
        http.get('*/version', () => {
          return HttpResponse.json({
            version: '1.0.0',
            buildTime: '2024-01-01T00:00:00Z',
          });
        })
      );

      const version = await AdminService.getVersion();

      expect(version.version).toBeDefined();
    });
  });

  describe('CSV Export', () => {
    it('should export departments as CSV', async () => {
      server.use(
        http.get('*/api/v1/admin/departments/export.csv', () => {
          const csvContent = 'id,name,code\n1,Cardiology,CARD\n';
          return new HttpResponse(csvContent, {
            status: 200,
            headers: { 'content-type': 'text/csv' },
          });
        })
      );

      const csv = await AdminService.exportDepartmentsCsv();

      expect(csv).toBeInstanceOf(Blob);
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for non-existent department', async () => {
      server.use(
        http.patch('*/api/v1/admin/departments/*', () => {
          return HttpResponse.json(
            { success: false, error: 'Department not found' },
            { status: 404 }
          );
        })
      );

      try {
        await AdminService.updateDepartment('999', { name: 'Non-existent' });
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle validation errors on create', async () => {
      server.use(
        http.post('*/api/v1/admin/departments', () => {
          return HttpResponse.json(
            { success: false, error: 'Duplicate department code' },
            { status: 400 }
          );
        })
      );

      try {
        await AdminService.createDepartment({
          name: 'Cardiology',
          code: 'CARD',
        });
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Date Format Handling', () => {
    it('should format date-only strings to ISO format', async () => {
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

      await AdminService.getAppointmentAnalytics('2024-01-01', '2024-01-31');

      expect(capturedParams.from).toBe('2024-01-01T00:00:00');
      expect(capturedParams.to).toBe('2024-01-31T00:00:00');
    });

    it('should preserve ISO format dates', async () => {
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

      await AdminService.getAppointmentAnalytics(
        '2024-01-01T10:00:00',
        '2024-01-31T23:59:59'
      );

      expect(capturedParams.from).toBe('2024-01-01T10:00:00');
      expect(capturedParams.to).toBe('2024-01-31T23:59:59');
    });
  });
});
