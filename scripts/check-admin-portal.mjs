import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const pagePath = resolve('app/admin-portal/page.jsx');
const page = await readFile(pagePath, 'utf8');

const requiredMarkers = [
  'NEXT_PUBLIC_FLUXGO_API_URL',
  "requestApi('/admin/auth/login'",
  "requestApi('/admin/auth/logout'",
  "requestApi('/admin/me'",
  "requestApi('/admin/auth/request-password-reset'",
  "requestApi('/admin/auth/reset-password'",
  "credentials: 'include'",
  'HttpOnly session cookie',
  'function Dashboard',
];

const missing = requiredMarkers.filter((marker) => !page.includes(marker));

if (missing.length) {
  console.error(`Admin portal check failed. Missing: ${missing.join(', ')}`);
  process.exit(1);
}

console.log('Admin portal source check passed.');
console.log(`Route: /admin-portal`);
console.log('Server-owned cookie login, logout, and password reset wiring present.');
