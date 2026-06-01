const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

(async () => {
  const OUT_DIR = path.resolve(__dirname, '..', 'tests', 'playwright-screenshots');
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const BASE = process.env.BASE_URL || 'http://localhost:3001';
  const argPath = process.argv[2];

  // Try to resolve token from multiple locations: env var, arg, or license-server/last_pro_token.txt up the tree
  const tryPaths = [];
  if (process.env.LICENSE_TOKEN) tryPaths.push({ type: 'env', value: process.env.LICENSE_TOKEN });
  if (argPath) tryPaths.push({ type: 'arg', value: argPath });

  // Walk up parent directories and look for license-server/last_pro_token.txt
  let cur = path.resolve(__dirname, '..');
  for (let i = 0; i < 6; i++) {
    tryPaths.push({ type: 'file', value: path.join(cur, 'license-server', 'last_pro_token.txt') });
    tryPaths.push({ type: 'file', value: path.join(cur, 'license-server', 'last_free_token.txt') });
    cur = path.dirname(cur);
  }

  let token = null;
  for (const p of tryPaths) {
    if (p.type === 'env') {
      token = p.value && p.value.trim();
      if (token) { console.log('Using token from LICENSE_TOKEN env'); break; }
      continue;
    }
    if (p.type === 'arg') {
      try {
        const txt = fs.readFileSync(path.resolve(p.value), 'utf8').trim();
        if (txt) { token = txt; console.log('Using token from arg:', p.value); break; }
      } catch (e) {}
      continue;
    }
    if (p.type === 'file') {
      try {
        if (fs.existsSync(p.value)) {
          const txt = fs.readFileSync(p.value, 'utf8').trim();
          if (txt) { token = txt; console.log('Using token from', p.value); break; }
        }
      } catch (e) {}
    }
  }

  if (!token) console.warn('No token found; proceeding with mocked/auth-intercept only. To use a real token pass its file path as first arg or set LICENSE_TOKEN env var.');

  const routes = [
    '/dashboard','/executive-center','/cloud-infrastructure','/cms-studio','/crm-erp','/marketing-hub','/e-banking','/analytics','/ai-operations','/security-center','/billing-licensing','/marketplace','/integrations','/developer-apis','/settings'
  ];

  const execPath = process.env.CHROMIUM_EXECUTABLE || process.env.CHROME_EXECUTABLE || undefined;
  const launchOpts = { headless: true };
  if (execPath) launchOpts.executablePath = execPath;
  const browser = await chromium.launch(launchOpts);
  const context = await browser.newContext();
  const page = await context.newPage();

  // If token available, set localStorage before navigation
  if (token) {
    await page.goto(BASE, { waitUntil: 'load' });
    await page.evaluate((t) => {
      localStorage.setItem('gdwb_license_token', t);
      localStorage.setItem('gdwb_license_key', 'STAGING-PRO-000000000000002');
      localStorage.setItem('gdwb_user_token', 'FAKE-USERTOKEN');
      localStorage.setItem('gdwb_user', JSON.stringify({ id: 'playwright-agent', email: 'agent+playwright@example.com', membershipTier: 'pro' }));
      localStorage.setItem('userAuthToken', JSON.stringify({ access_token: 'FAKE-USERTOKEN' }));
    }, token);
  }

  // intercept auth/introspect to avoid network errors during CI
  await page.route('**/api/v1/auth/*', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'playwright-agent', email: 'agent+playwright@example.com', membershipTier: 'pro' }) }));
  await page.route('**/api/v1/introspect', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ active: true, features: ['analytics','files_vault','webhooks'] }) }));

  for (const route of routes) {
    const url = BASE + route;
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    } catch (e) {
      try { await page.goto(url, { waitUntil: 'load', timeout: 30000 }); } catch(e) { console.warn('Failed to load', url, e.message); }
    }
    const safeName = route.replace(/[^a-z0-9_-]/gi, '_').replace(/^_+/, '');
    const out = path.join(OUT_DIR, `${safeName}.png`);
    await page.screenshot({ path: out, fullPage: true });
    console.log('Captured', out);
  }

  await browser.close();
  console.log('Done');
})();