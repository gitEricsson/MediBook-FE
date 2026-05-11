import { test, expect, Page } from '@playwright/test';

const PATIENT = { email: 'e2e.patient.20260511@example.com', password: 'Password123!' };
const DOCTOR = { email: 'dr.chen.e2e@medibook.test', password: 'Password123!' };
const ADMIN = { email: 'admin.e2e@medibook.test', password: 'Password123!' };

async function login(page: Page, email: string, password: string) {
    await page.addInitScript(() => window.localStorage.setItem('mb_tour_seen', 'true'));
    await page.goto('/login');
    await page.getByLabel(/Email/i).fill(email);
    await page.getByLabel(/Password/i).fill(password);
    await page.getByRole('button', { name: /Sign in/i }).click();
}

test.describe('MediBook E2E - Role Flows', () => {
  test('patient can log in, search, and book an appointment', async ({ page }) => {
    await login(page, PATIENT.email, PATIENT.password);
    await expect(page).toHaveURL(/.*patient.*/);
    await expect(page.getByText(/Find a doctor/i)).toBeVisible();

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
    await expect(page.getByText(/Today's schedule/i)).toBeVisible();
  });

  test('admin can log in and view management screens', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await expect(page).toHaveURL(/.*admin.*/);
    await expect(page.getByText(/Patient search/i)).toBeVisible();
    await page.getByRole('button', { name: /Doctors/i }).click();
    await expect(page.getByText(/Sarah Chen/i)).toBeVisible();
  });
});
