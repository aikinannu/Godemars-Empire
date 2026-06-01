const { test, expect } = require('@playwright/test');
const path = require('path');

const BASE = process.env.BASE_URL || 'http://localhost:3001';

test.describe('Executive Center entitlement and visibility', () => {
  test('shows upgrade CTA when analytics missing', async ({ page }) => {
    await page.route('**/api/v1/auth/*', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'free-agent', email: 'free@example.com', membershipTier: 'basic' }) }));
    await page.route('**/api/v1/introspect', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ active: true, features: [] }) }));

    await page.addInitScript(() => {
      localStorage.setItem('gdwb_user', JSON.stringify({ id: 'free-agent', email: 'free@example.com', membershipTier: 'basic' }));
    });

    await page.goto(BASE + '/executive-center', { waitUntil: 'networkidle' });
    const body = await page.textContent('body');
    expect(body).toMatch(/Feature locked|Upgrade required|Upgrade to access|Upgrade/);
  });

  test('shows KPI cards when analytics enabled', async ({ page }) => {
    await page.route('**/api/v1/auth/*', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'pro-agent', email: 'pro@example.com', membershipTier: 'premium' }) }));
    await page.route('**/api/v1/introspect', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ active: true, features: ['analytics','files_vault'] }) }));

    await page.addInitScript(() => {
      const files = [
        { id: 'f1', name: 'a.png', size: 1200, createdAt: new Date().toISOString(), type: 'image/png' },
        { id: 'f2', name: 'b.txt', size: 3000, createdAt: new Date().toISOString(), type: 'text/plain' }
      ];
      const activities = [
        { id: 'act1', type: 'uploaded', fileId: 'f1', fileName: 'a.png', user: 'pro@example.com', timestamp: new Date().toISOString() },
        { id: 'act2', type: 'shared', fileId: 'f1', fileName: 'a.png', user: 'pro@example.com', timestamp: new Date().toISOString() }
      ];
      localStorage.setItem('files_vault_files', JSON.stringify(files));
      localStorage.setItem('files_vault_activity', JSON.stringify(activities));
      localStorage.setItem('gdwb_user', JSON.stringify({ id: 'pro-agent', email: 'pro@example.com', membershipTier: 'premium' }));
    });

    await page.goto(BASE + '/executive-center', { waitUntil: 'networkidle' });
    await expect(page.locator('text=Total Files')).toBeVisible();
    await expect(page.locator('text=Files Shared')).toBeVisible();
    await expect(page.locator('text=Active Users')).toBeVisible();
  });
});
