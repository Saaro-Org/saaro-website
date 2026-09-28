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
  "requestApi('/admin/dashboard/summary'",
  "'/admin/members'",
  "'/admin/trips'",
  "'/admin/bookings'",
  "'/admin/support/tickets'",
  "'/admin/audit'",
  'function Console',
  'status=PUBLISHED',
  'Active support tickets',
  'Recent audit log',
  'Open tickets close automatically after 24 hours without activity.',
  'New messages load automatically while this ticket is open.',
  'loadData({ silent: true })',
  'const refreshInterval = kind === \'support\' ? SUPPORT_DETAIL_REFRESH_INTERVAL_MS : CONSOLE_REFRESH_INTERVAL_MS;',
  'setInterval(() => { void refreshSelectedDetail(); }, refreshInterval)',
  'admin-console-expanded-row',
  'expandedId',
  'fluxgo-admin-session-expired',
  'readConsoleUrlState',
  'admin-status-badge',
  'admin-console-confirmation',
  'admin-console-filter-field',
  'aria-busy',
  'aria-expanded',
  'lastUpdated',
];

const missing = requiredMarkers.filter((marker) => !page.includes(marker));

if (missing.length) {
  console.error(`Admin portal check failed. Missing: ${missing.join(', ')}`);
  process.exit(1);
}

console.log('Admin portal source check passed.');
console.log(`Route: /admin-portal`);
console.log('Server-owned cookie login, logout, and password reset wiring present.');
