'use client';

const API_BASE_URL = (process.env.NEXT_PUBLIC_FLUXGO_API_URL || '').replace(/\/+$/, '');

export const SESSION_EXPIRED_EVENT = 'fluxgo-admin-session-expired';

const AUTH_PATHS = ['/admin/auth/login', '/admin/auth/request-password-reset', '/admin/auth/reset-password'];

/** Call the Fluxgo admin API with the HttpOnly session cookie. */
export async function requestApi(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}/v1${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      ...(options.body ? { 'content-type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
  });
  if (response.status === 204) return null;
  let body = null;
  try { body = await response.json(); } catch { body = null; }
  if (!response.ok) {
    const error = new Error(body?.error?.message || 'The admin service is not available. Try again.');
    error.status = response.status;
    error.code = body?.error?.code;
    error.sessionExpired = response.status === 401;
    if (error.sessionExpired && typeof window !== 'undefined' && !AUTH_PATHS.some((authPath) => path.startsWith(authPath))) {
      window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
    }
    throw error;
  }
  return body;
}

/** Build a query string. Empty values are left out. */
export function queryString(params) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    search.set(key, String(value));
  });
  const text = search.toString();
  return text ? `?${text}` : '';
}

export function isSessionExpired(error) {
  return Boolean(error?.sessionExpired || error?.status === 401);
}

const ERROR_MESSAGES = {
  ADMIN_INVALID_CREDENTIALS: 'The email or password is not correct.',
  ADMIN_RESET_TOKEN_INVALID: 'The reset code is not valid or it expired.',
  EMAIL_PROVIDER_UNAVAILABLE: 'We could not send the reset email. Try again later.',
  ADMIN_USERNAME_EXISTS: 'That display name is already in use.',
  ADMIN_EMAIL_EXISTS: 'That email is already in use by another admin.',
  SUPPORT_TICKET_CLOSED: 'Reopen the ticket before you send a reply.',
  SUPPORT_TICKET_ALREADY_OPEN: 'This member already has a different open ticket.',
  UNAUTHENTICATED: 'Your session expired. Sign in again.',
  FORBIDDEN: 'Your admin account cannot do this action.',
  NOT_FOUND: 'We could not find this record.',
  INVALID_REQUEST: 'Check the values and try again.',
  PUSH_NOT_CONFIGURED: 'Notifications are not set up on the server yet.',
  PUSH_DELIVERY_FAILED: 'The test notification did not reach this device. Turn notifications off and on again.',
};

export function errorText(error, fallback = 'The request failed. Try again.') {
  if (error?.code && ERROR_MESSAGES[error.code]) return ERROR_MESSAGES[error.code];
  if (error instanceof TypeError) return 'We could not reach the Fluxgo API. Check your connection.';
  return error instanceof Error && error.message ? error.message : fallback;
}
