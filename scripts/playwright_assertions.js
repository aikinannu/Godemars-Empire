const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

(async () => {
  const OUT_FAIL_DIR = path.resolve(__dirname, '..', 'tests', 'playwright-failures');
  if (!fs.existsSync(OUT_FAIL_DIR)) fs.mkdirSync(OUT_FAIL_DIR, { recursive: true });

  const FEATURE_MATRIX_PATH = path.resolve(__dirname, '..', 'src', 'config', 'feature-matrix.json');
  if (!fs.existsSync(FEATURE_MATRIX_PATH)) {
    console.error('feature-matrix.json not found at', FEATURE_MATRIX_PATH);
    process.exit(2);
  }

  const FEATURE_MATRIX = require(FEATURE_MATRIX_PATH);
  const BASE = process.env.BASE_URL || 'http://localhost:3001';
  const TOKEN_FILE = process.env.LICENSE_TOKEN_FILE || path.resolve(__dirname, '..', 'license-server', 'last_pro_token.txt');

  const MOCK_FEATURES = ['analytics', 'files_vault', 'webhooks'];

  // Detect local Chrome/Edge if available (Windows common paths)
  const envCandidates = ['CHROMIUM_EXECUTABLE', 'CHROME_EXECUTABLE', 'CHROME'];
  const candidates = [];
  for (const k of envCandidates) if (process.env[k]) candidates.push(process.env[k]);

  const potential = [
    path.join(process.env['ProgramFiles'] || 'C:\\Program Files', 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(process.env['LOCALAPPDATA'] || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(process.env['ProgramFiles'] || 'C:\\Program Files', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    path.join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    path.join(process.env['LOCALAPPDATA'] || '', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
  ];
  for (const p of potential) if (p && fs.existsSync(p)) candidates.push(p);

  const execPath = candidates.length ? candidates[0] : undefined;
  const launchOpts = { headless: true };
  if (execPath) launchOpts.executablePath = execPath;

  let browser;
  try {
    browser = await chromium.launch(launchOpts);
  } catch (e) {
    console.error('Failed to launch browser', e);
    process.exit(3);
  }

  const context = await browser.newContext();
  const page = await context.newPage();
  // deterministic mocks for auth/introspect
  await page.route('**/api/v1/auth/*', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'playwright-agent', email: 'agent+playwright@example.com', membershipTier: 'premium' }) }));
  // Introspect should return the license-server style envelope (success + top-level fields)
  await page.route('**/api/v1/introspect', (r) => r.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ success: true, active: true, features: MOCK_FEATURES }),
  }));

  // Prepare deterministic localStorage before any script runs in the page
  let initialLocal = {
    // provide a fake license token so LicenseContext will attempt introspection
    gdwb_license_token: 'FAKE-LICENSE-TOKEN',
    gdwb_license_key: 'STAGING-PRO-000000000000002',
    gdwb_user_token: 'FAKE-USERTOKEN',
    gdwb_user: { id: 'playwright-agent', email: 'agent+playwright@example.com', membershipTier: 'premium' },
    userAuthToken: { access_token: 'FAKE-USERTOKEN' },
  };
  try {
    if (fs.existsSync(TOKEN_FILE)) {
      initialLocal.gdwb_license_token = fs.readFileSync(TOKEN_FILE, 'utf8').trim();
    }
  } catch (e) {}

  await page.addInitScript((ls) => {
    for (const k in ls) {
      const v = ls[k];
      if (typeof v === 'object') localStorage.setItem(k, JSON.stringify(v));
      else localStorage.setItem(k, v);
    }
  }, initialLocal);

  // Debug: dump localStorage to verify our injected values
  try {
    const lsDump = await page.evaluate(() => {
      const out = {};
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        out[k] = localStorage.getItem(k);
      }
      return out;
    });
    console.log('LocalStorage snapshot:', JSON.stringify(lsDump, null, 2));
  } catch (e) {
    console.warn('Failed to dump localStorage', e.message);
  }

  const routes = Object.keys(FEATURE_MATRIX);
  const failures = [];

  for (const route of routes) {
    const url = BASE + route;
    console.log('Visiting', url);
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    } catch (e) {
      try { await page.goto(url, { waitUntil: 'load', timeout: 30000 }); } catch (e2) { console.warn('Failed to load', url, e2.message); failures.push({ route, error: e2.message }); continue; }
    }

    const bodyText = await page.textContent('body');
    const hasUpgrade = /(Upgrade required|View membership options|Upgrade your plan to|This feature is locked)/i.test(bodyText);
    const hasLocked = /(\bLocked\b|feature locked|Feature locked|Access denied|Not available in your plan|Upgrade required)/i.test(bodyText);

    const required = FEATURE_MATRIX[route].features || [];
    const unlocked = required.length ? required.every((f) => MOCK_FEATURES.includes(f)) : true;

    const expectedLocked = unlocked ? false : true;
    const foundLocked = hasUpgrade || hasLocked;

    if (expectedLocked !== foundLocked) {
      const safeName = route.replace(/[^a-z0-9_-]/gi, '_').replace(/^_+/, '');
      const out = path.join(OUT_FAIL_DIR, `${safeName}.png`);
      await page.screenshot({ path: out, fullPage: true });
      console.error('Assertion failed for route', route, 'expectedLocked=', expectedLocked, 'foundLocked=', foundLocked, 'screenshot=', out);
      failures.push({ route, expectedLocked, foundLocked, screenshot: out });
    } else {
      console.log('OK', route, 'locked=', expectedLocked);
    }
  }

  await browser.close();

  if (failures.length) {
    console.error('FAILURES:', failures.length);
    failures.forEach((f) => console.error(f));
    process.exit(1);
  }

  console.log('All assertions passed');
  process.exit(0);
})();
