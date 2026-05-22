import { test, expect, Page } from '@playwright/test';

const PATIENT = { email: 'e2e.patient.20260511@example.com', password: 'Password123!' };
const DOCTOR = { email: 'dr.chen.e2e@medibook.test', password: 'Password123!' };
const ADMIN = { email: 'admin.e2e@medibook.test', password: 'Password123!' };

const usersByEmail = {
  [PATIENT.email]: {
    id: 1,
    email: PATIENT.email,
    role: 'ROLE_PATIENT',
    firstName: 'E2E',
    lastName: 'Patient',
    enabled: true,
  },
  [DOCTOR.email]: {
    id: 2,
    email: DOCTOR.email,
    role: 'ROLE_DOCTOR',
    firstName: 'Sarah',
    lastName: 'Chen',
    enabled: true,
  },
  [ADMIN.email]: {
    id: 3,
    email: ADMIN.email,
    role: 'ROLE_SUPER_ADMIN',
    firstName: 'E2E',
    lastName: 'Admin',
    enabled: true,
  },
};

const doctor = {
  id: 10,
  userId: 2,
  fullName: 'Sarah Chen',
  email: DOCTOR.email,
  specialization: 'Cardiology',
  departmentId: 4,
  departmentName: 'Cardiology',
  acceptingNew: true,
  slotDurationMins: 60,
  languages: 'English',
  consultationFee: 0,
  averageRating: 4.8,
  reviewCount: 12,
};

const pageResponse = <T,>(content: T[]) => ({
  content,
  totalPages: 1,
  totalElements: content.length,
  numberOfElements: content.length,
  size: 20,
  number: 0,
  first: true,
  last: true,
  empty: content.length === 0,
});

const ok = (data: unknown) => ({ success: true, data });

async function mockApi(page: Page) {
  let activeUser = usersByEmail[PATIENT.email];

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;

    if (path === '/api/v1/auth/login' && request.method() === 'POST') {
      const body = request.postDataJSON() as { email?: string };
      activeUser = usersByEmail[body.email as keyof typeof usersByEmail] ?? usersByEmail[PATIENT.email];
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: ok({
          accessToken: `mock-access-token-${activeUser.id}`,
          refreshToken: `mock-refresh-token-${activeUser.id}`,
          tokenType: 'Bearer',
          expiresIn: 900,
          user: activeUser,
        }),
      });
    }

    if (path === '/api/v1/auth/refresh' && request.method() === 'POST') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: ok({
          accessToken: `mock-access-token-${activeUser.id}`,
          refreshToken: `mock-refresh-token-${activeUser.id}`,
          tokenType: 'Bearer',
          expiresIn: 900,
          user: activeUser,
        }),
      });
    }

    if (path === '/api/v1/me' || path === '/api/v1/users/me') {
      return route.fulfill({ status: 200, contentType: 'application/json', json: ok(activeUser) });
    }

    if (path === '/api/v1/doctors/search') {
      return route.fulfill({ status: 200, contentType: 'application/json', json: ok(pageResponse([doctor])) });
    }

    if (path === '/api/v1/departments') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: ok([{ id: 4, name: 'Cardiology', code: 'CARD', active: true }]),
      });
    }

    if (path === '/api/v1/metadata/specialisations') {
      return route.fulfill({ status: 200, contentType: 'application/json', json: ok(['Cardiology']) });
    }

    if (path === '/api/v1/doctors/10') {
      return route.fulfill({ status: 200, contentType: 'application/json', json: ok(doctor) });
    }

    if (path === '/api/v1/doctors/10/availability') {
      const date = url.searchParams.get('from') ?? new Date().toISOString().split('T')[0];
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: ok({
          days: [{
            date,
            slots: [
              { start: `${date}T13:00:00`, end: `${date}T14:00:00`, status: 'OPEN' },
              { start: `${date}T15:00:00`, end: `${date}T16:00:00`, status: 'OPEN' },
            ],
          }],
        }),
      });
    }

    if (path === '/api/v1/reviews/doctors/10') {
      return route.fulfill({ status: 200, contentType: 'application/json', json: ok(pageResponse([])) });
    }

    if (path === '/api/v1/appointments/holds' && request.method() === 'POST') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: ok({ holdId: 'hold-e2e-1', expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString() }),
      });
    }

    if (path === '/api/v1/appointments' && request.method() === 'POST') {
      const body = request.postDataJSON() as { doctorId: number; scheduledAt: string; reason?: string };
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: ok({
          id: 9001,
          doctorId: body.doctorId,
          patientId: 1,
          doctorName: 'Dr. Sarah Chen',
          patientName: 'E2E Patient',
          scheduledAt: body.scheduledAt,
          durationMins: 60,
          status: 'PENDING',
          type: 'IN_PERSON',
          reason: body.reason,
          confirmationCode: 'E2E-9001',
          createdAt: new Date().toISOString(),
        }),
      });
    }

    if (path === '/api/v1/me/schedule') {
      const date = url.searchParams.get('date') ?? new Date().toISOString().split('T')[0];
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: ok({
          date,
          workStart: '08:00:00',
          workEnd: '17:00:00',
          freeSlots: [],
          appointments: [{
            id: 7001,
            patientId: 1,
            patientName: 'E2E Patient',
            doctorId: 10,
            doctorName: 'Dr. Sarah Chen',
            scheduledAt: `${date}T09:00:00`,
            durationMins: 30,
            status: 'CONFIRMED',
            type: 'IN_PERSON',
            reason: 'Follow-up',
            createdAt: new Date().toISOString(),
          }],
        }),
      });
    }

    if (path === '/api/v1/users') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: ok(pageResponse([
          { id: 1, email: PATIENT.email, firstName: 'E2E', lastName: 'Patient', role: 'ROLE_PATIENT', enabled: true },
        ])),
      });
    }

    if (path === '/api/v1/doctors') {
      return route.fulfill({ status: 200, contentType: 'application/json', json: ok(pageResponse([doctor])) });
    }

    if (path === '/api/v1/admin/departments') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: ok(pageResponse([{ id: 4, name: 'Cardiology', code: 'CARD', doctorsCount: 1, apptCount90d: 3, status: true }])),
      });
    }

    return route.fulfill({ status: 200, contentType: 'application/json', json: ok({}) });
  });
}

async function login(page: Page, email: string, password: string) {
    await mockApi(page);
    await page.addInitScript(() => window.localStorage.setItem('mb_tour_seen', 'true'));
    await page.goto('/login');
    await page.getByLabel(/Email/i).fill(email);
    await page.locator('#login-password').fill(password);
    await page.getByRole('button', { name: /Sign in/i }).click();
}

test.describe('MediBook E2E - Role Flows', () => {
  test('patient can log in, search, and book an appointment', async ({ page }) => {
    await login(page, PATIENT.email, PATIENT.password);
    await expect(page).toHaveURL(/.*patient.*/);
    await expect(page.getByRole('heading', { name: /Find a doctor/i })).toBeVisible();

    await page.getByPlaceholder(/Search doctors/i).fill('Sarah');
    await expect(page.getByText(/Dr. Sarah Chen/i)).toBeVisible();
    await page.getByRole('button', { name: /Book/i }).first().click();

    await expect(page.getByText(/Available slots/i)).toBeVisible();
    await page.getByRole('button', { name: /13:00/i }).click();
    await page.getByRole('button', { name: /Continue to review/i }).click();
    await expect(page.getByText(/Review & confirm/i)).toBeVisible();
    await page.getByPlaceholder(/Briefly describe/i).fill('E2E booking verification');
    await page.getByRole('button', { name: /Confirm booking/i }).click();
    await expect(page.getByText(/You're booked/i)).toBeVisible();
  });

  test('doctor can log in and view schedule', async ({ page }) => {
    await login(page, DOCTOR.email, DOCTOR.password);
    await expect(page).toHaveURL(/.*doctor.*/);
    await expect(page.getByRole('heading', { name: /schedule/i })).toBeVisible();
  });

  test('admin can log in and view management screens', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await expect(page).toHaveURL(/.*admin.*/);
    await expect(page.getByRole('heading', { name: /Patients/i })).toBeVisible();
    await page.goto('/admin/docs');
    await expect(page.getByRole('heading', { name: /Doctors/i })).toBeVisible();
    await expect(page.getByText(/Sarah Chen/i)).toBeVisible();
  });
});
