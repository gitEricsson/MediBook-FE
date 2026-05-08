import { http, HttpResponse } from 'msw';

export const handlers = [
  // Auth Handlers
  http.post('*/api/v1/auth/login', () => {
    return HttpResponse.json({
      accessToken: 'mock-access-token',
      user: {
        id: 'user-1',
        email: 'test@example.com',
        role: 'patient',
        firstName: 'Test',
        lastName: 'User'
      }
    });
  }),

  http.post('*/api/v1/auth/refresh', () => {
    return HttpResponse.json({ accessToken: 'new-mock-token' });
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
      holdId: 'hold-123',
      expiresAt: new Date(Date.now() + 600000).toISOString()
    });
  }),
];
