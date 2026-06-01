const fetch = require('node-fetch');
const API = 'http://localhost:3000/api/v1';

async function parseJson(res){
  const t = await res.text();
  try { return JSON.parse(t); } catch { return t; }
}

async function run(){
  console.log('Starting integration test...');
  // 1. Register a temp user
  const email = `test+${Date.now()}@example.com`;
  const password = 'Password123!';
  let cookie = null;

  const captureCookie = (res) => {
    try {
      const raw = res.headers.raw && res.headers.raw()['set-cookie'];
      if (raw && raw.length) {
        cookie = raw.map(s => s.split(';')[0]).join('; ');
      }
    } catch (e) {
      // ignore
    }
  };

  let res = await fetch(`${API}/auth/register`, { method: 'POST', body: JSON.stringify({ email, password }), headers: { 'Content-Type':'application/json' } });
  let data = await parseJson(res);
  captureCookie(res);
  console.log('register', res.status, data, 'cookie=', !!cookie);

  // 2. Login (ensure we have cookie set)
  res = await fetch(`${API}/auth/login`, { method: 'POST', body: JSON.stringify({ email, password }), headers: { 'Content-Type':'application/json' } });
  data = await parseJson(res);
  captureCookie(res);
  console.log('login', res.status, data, 'cookie=', !!cookie);
  const token = data?.data?.access_token || data?.access_token;
  if (!token) return console.error('No token from login');

  // 3. Call protected route
  res = await fetch(`${API}/auth/me`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
  data = await parseJson(res);
  console.log('me (with token)', res.status, data);

  // 4. Simulate token expiry by using an invalid token, expect 401 then refresh
  res = await fetch(`${API}/auth/me`, { method: 'GET', headers: { Authorization: `Bearer invalidtoken` } });
  console.log('me (invalid token) status', res.status);
  if (res.status === 401){
    // call refresh (cookie should be present)
    if (!cookie) return console.error('No refresh cookie captured; cannot call refresh');
    res = await fetch(`${API}/auth/refresh`, { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookie } });
    data = await parseJson(res);
    console.log('refresh', res.status, data);
    const newToken = data?.data?.access_token || data?.access_token;
    // capture any rotated refresh cookie
    captureCookie(res);
    if (!newToken) return console.error('No token from refresh');
    res = await fetch(`${API}/auth/me`, { method: 'GET', headers: { Authorization: `Bearer ${newToken}` } });
    data = await parseJson(res);
    console.log('me (after refresh)', res.status, data);
  } else {
    console.warn('Server did not return 401 for invalid token, status:', res.status);
  }

  // 5. Logout
  res = await fetch(`${API}/auth/logout`, { method: 'POST', headers: cookie ? { Cookie: cookie } : undefined });
  data = await parseJson(res);
  console.log('logout', res.status, data);

  console.log('Integration test complete.');
}

run().catch(e=>{ console.error(e); process.exit(1); });
