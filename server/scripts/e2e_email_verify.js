#!/usr/bin/env node
const fetch = globalThis.fetch || require('node-fetch');
const { pool } = require('../db');

(async () => {
  try {
    const base = 'http://localhost:3000';
    const email = 'e2e-test+verif@example.com';
    const password = 'Password123';

    console.log('Registering user...');
    const reg = await fetch(`${base}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const regJson = await reg.json().catch(() => null);
    console.log('Register response:', reg.status, regJson);

    console.log('Resending verification...');
    const resend = await fetch(`${base}/api/v1/auth/resend-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const resendJson = await resend.json().catch(() => null);
    console.log('Resend response:', resend.status, resendJson);

    console.log('Querying DB for latest token...');
    const tokenRes = await pool.query(
      'SELECT * FROM email_verification_tokens WHERE email = $1 ORDER BY created_at DESC LIMIT 1',
      [email]
    );
    console.log('Tokens:', tokenRes.rows);

    if (!tokenRes.rows.length) {
      console.error('No token found, exiting.');
      process.exit(2);
    }
    const token = tokenRes.rows[0].token;

    console.log('Verifying token...');
    const verify = await fetch(`${base}/api/v1/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, email }),
    });
    console.log('Verify response:', verify.status, await verify.json().catch(() => null));

    console.log('Checking users table...');
    const userRes = await pool.query('SELECT id, email, email_verified, email_verified_at FROM users WHERE email = $1', [email]);
    console.log('User:', userRes.rows);

    process.exit(0);
  } catch (e) {
    console.error('Error in script:', e);
    process.exit(1);
  }
})();
