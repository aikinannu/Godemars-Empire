const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const FEATURE_MATRIX = require('../../src/config/feature-matrix.json');

// Basic test config: BASE_URL, optional token file path via env or arg
const BASE = process.env.BASE_URL || 'http://localhost:3001';
const TOKEN_FILE = process.env.LICENSE_TOKEN_FILE || path.resolve(__dirname, '..', '..', 'license-server', 'last_pro_token.txt');

// Mocked features used when introspect endpoints are intercepted
const MOCK_FEATURES = ['analytics', 'files_vault', 'webhooks'];

test.describe('Entitlement visual checks', () => {
  test.beforeEach(async ({ page }) => {
    // Intercept auth/introspect to be deterministic in CI/local
    await page.route('**/api/v1/auth/*', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'playwright-agent', email: 'agent+playwright@example.com', membershipTier: 'pro' }) }));
    await page.route('**/api/v1/introspect', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ active: true, features: MOCK_FEATURES }) }));

    // Try to read a token file and set localStorage if present (so UI uses it)
    try {
      if (fs.existsSync(TOKEN_FILE)) {
        const token = fs.readFileSync(TOKEN_FILE, 'utf8').trim();
        await page.addInitScript((t) => {
          localStorage.setItem('gdwb_license_token', t);
          localStorage.setItem('gdwb_license_key', 'STAGING-PRO-000000000000002');
          localStorage.setItem('gdwb_user_token', 'FAKE-USERTOKEN');
          localStorage.setItem('gdwb_user', JSON.stringify({ id: 'playwright-agent', email: 'agent+playwright@example.com', membershipTier: 'pro' }));
          localStorage.setItem('userAuthToken', JSON.stringify({ access_token: 'FAKE-USERTOKEN' }));
        }, token);
      } else {
        // still set a mocked user token so client hydrations don't fail
        await page.addInitScript(() => {
          localStorage.setItem('gdwb_license_token', '');
          localStorage.setItem('gdwb_user_token', 'FAKE-USERTOKEN');
          localStorage.setItem('gdwb_user', JSON.stringify({ id: 'playwright-agent', email: 'agent+playwright@example.com', membershipTier: 'pro' }));
          localStorage.setItem('userAuthToken', JSON.stringify({ access_token: 'FAKE-USERTOKEN' }));
        });
      }
    } catch (e) {
      // ignore
    }
  });

  test('programmatic login + entitlement checks', async ({ page }) => {
    const routes = Object.keys(FEATURE_MATRIX);

    for (const route of routes) {
      const url = BASE + route;
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

      // Small heuristic for locked/unlocked UI
      const bodyText = await page.textContent('body');
      const hasUpgrade = /Upgrade required|View membership options|Upgrade to access|Upgrade/.test(bodyText);
      const hasLocked = /Locked\b|Premium\b|Upgrade required/i.test(bodyText);

      const required = FEATURE_MATRIX[route].features || [];
      const unlocked = required.length ? required.every((f) => MOCK_FEATURES.includes(f)) : true;

      if (unlocked) {
        expect(hasUpgrade || hasLocked).toBeFalsy();
      } else {
        expect(hasUpgrade || hasLocked).toBeTruthy();
      }
    }
  });
});
