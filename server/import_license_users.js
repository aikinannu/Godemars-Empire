#!/usr/bin/env node
// import_license_users.js
// Import users from a PHP license-server JSON export into the app Postgres `users` table.
// Usage:
//   node import_license_users.js /path/to/users.json
// Or set `LICENSE_USERS_DATA_PATH` env var to the JSON file path.

const fs = require('fs');
const path = require('path');
const { pool, ready } = require('./db');

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

(async function main() {
  try {
    const argPath = process.argv.slice(2).find(a => !a.startsWith('-'));
    const envPath = process.env.LICENSE_USERS_DATA_PATH;

    const candidates = [];
    if (argPath) candidates.push(argPath);
    if (envPath) candidates.push(envPath);
    // common relative guesses (may not exist in multi-root workspaces)
    candidates.push(path.resolve(process.cwd(), 'license-server', 'data', 'users.json'));
    candidates.push(path.resolve(process.cwd(), '..', 'license-server', 'data', 'users.json'));
    candidates.push(path.resolve(__dirname, '..', 'license-server', 'data', 'users.json'));

    let filePath = candidates.find(p => p && fs.existsSync(p));
    if (!filePath) {
      console.error('No users.json found. Provide path as the first arg or set LICENSE_USERS_DATA_PATH.');
      console.error('Tried candidates:\n' + candidates.filter(Boolean).join('\n'));
      process.exit(1);
    }

    console.log('Using users file:', filePath);
    const raw = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(raw || '{}');
    if (!data || typeof data !== 'object') {
      console.error('No user records found in JSON');
      process.exit(1);
    }

    const entries = Object.entries(data);
    if (!entries.length) {
      console.log('No users to import.');
      process.exit(0);
    }

    // Wait for DB initialization (table creation) to finish
    if (ready && typeof ready.then === 'function') await ready;
    const client = await pool.connect();
    let inserted = 0;
    try {
      for (const [key, u] of entries) {
        const email = (u && u.email) ? u.email : key;
        if (!email) continue;

        let passwordHash = (u && (u.password_hash || u.password)) || null;
        if (!passwordHash) {
          console.warn(`Skipping ${email}: no password hash found`);
          continue;
        }

        // Convert PHP's $2y$ bcrypt prefix to $2a$ for Node bcryptjs compatibility
        if (passwordHash.startsWith('$2y$')) passwordHash = '$2a$' + passwordHash.slice(4);

        const firstName = (u && u.first_name) ? u.first_name : email.split('@')[0];
        const id = generateUUID();
        const tenantId = (u && u.tenant_id) ? u.tenant_id : generateUUID();
        const createdAt = (u && u.created_at) ? u.created_at : new Date().toISOString();

        const result = await client.query(
          'INSERT INTO users(id, email, password, first_name, tenant_id, created_at) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT (email) DO NOTHING',
          [id, email.toLowerCase(), passwordHash, firstName, tenantId, createdAt]
        );

        if (result && result.rowCount && result.rowCount > 0) {
          inserted++;
        } else {
          console.log(`Skipped existing user: ${email}`);
        }
      }
      console.log(`Imported ${inserted} new users.`);
    } finally {
      client.release();
      await pool.end();
    }
  } catch (err) {
    console.error('Import failed:', err);
    try { await pool.end(); } catch (e) {}
    process.exit(1);
  }
})();
