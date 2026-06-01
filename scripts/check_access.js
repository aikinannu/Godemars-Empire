const fs = require('fs');
const path = require('path');

const defaultTokenPath = path.resolve('C:\\Users\\USER\\Downloads\\New folder\\gd-workflow-bridge-pro\\license-server\\last_free_token.txt');
const tokenPath = process.argv[2] ? path.resolve(process.argv[2]) : defaultTokenPath;
const matrixPath = path.resolve(__dirname, '..', 'src', 'config', 'feature-matrix.json');

if (!fs.existsSync(tokenPath)) {
  console.error('Token file not found:', tokenPath);
  process.exit(2);
}

const token = fs.readFileSync(tokenPath, 'utf8').trim();
if (!token) {
  console.error('Token is empty');
  process.exit(2);
}

function decodeJwtPayload(t) {
  try {
    const parts = t.split('.');
    if (parts.length !== 3) return null;
    const b = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = Buffer.from(b, 'base64').toString('utf8');
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}

const payload = decodeJwtPayload(token);
if (!payload) {
  console.error('Failed to decode token payload');
  process.exit(2);
}

const features = Array.isArray(payload.features) ? payload.features : [];
console.log('Token features:', features.join(', ') || '(none)');

const matrix = require(matrixPath);
console.log('\nRoute access (based on feature requirements):');
for (const [route, info] of Object.entries(matrix)) {
  const required = info.features || [];
  const unlocked = required.length ? required.every(f => features.includes(f)) : true;
  console.log(`${route.padEnd(20)} - ${info.title.padEnd(22)} - ${unlocked ? 'UNLOCKED' : 'LOCKED'}${!unlocked ? ' (requires: ' + required.join(', ') + ')' : ''}`);
}
