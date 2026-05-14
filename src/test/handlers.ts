import { http, HttpResponse } from 'msw';

export const handlers = [
  // Auth Handlers
  http.post('*/api/v1/auth/login', () => {
    return HttpResponse.json({
      success: true,
      data: {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        tokenType: 'Bearer',
        expiresIn: 900,
        user: {
          id: 1,
          email: 'test@example.com',
          role: 'ROLE_PATIENT',
          firstName: 'Test',
          lastName: 'User',
          enabled: true,
        }
      }
    });
  }),

  http.post('*/api/v1/auth/refresh', () => {
    return HttpResponse.json({
      success: true,
      data: { accessToken: 'new-mock-token', refreshToken: 'new-refresh-token', tokenType: 'Bearer', expiresIn: 900 },
    });
  }),

  http.post('*/api/v1/auth/logout', () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // Doctor Handlers
  http.get('*/api/v1/doctors/search', () => {
    return HttpResponse.json([
      { id: 'dr-1', name: 'Dr. Test One', specialization: 'Cardiology', department: 'Cardiology', city: 'Test City' }
    ]);
  }),

  // Booking Handlers
  http.post('*/api/v1/appointments/holds', () => {
    return HttpResponse.json({
      success: true,
      data: {
        holdId: 'hold-123',
        expiresAt: new Date(Date.now() + 600000).toISOString()
      }
    });
  }),

  http.post('*/api/v1/appointments', () => {
    return HttpResponse.json({
      success: true,
      data: {
        id: 'appt-123',
        status: 'PENDING',
        doctorId: 1,
        doctorName: 'Dr. Test',
      }
    });
  }),
];
