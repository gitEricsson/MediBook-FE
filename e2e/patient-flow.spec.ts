import { test, expect } from '@playwright/test';

test.describe('MediBook E2E - Patient Flow', () => {
  test('should allow a patient to log in and search for a doctor', async ({ page }) => {
    // 1. Visit Login
    await page.goto('/login');
    
    // 2. Perform Login
    await page.getByLabel(/Email/i).fill('sarah.patient@email.com');
    await page.getByLabel(/Password/i).fill('password123');
    await page.getByRole('button', { name: /Sign in/i }).click();

    // 3. Verify Redirect to Patient Dashboard/Search
    await expect(page).toHaveURL(/.*patient.*/);
    await expect(page.getByText(/Find a doctor/i)).toBeVisible();

    // 4. Search for a doctor
    await page.getByPlaceholder(/Search doctors/i).fill('Sarah');
    await expect(page.getByText(/Dr. Sarah Chen/i)).toBeVisible();
  });
});
