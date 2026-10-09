'use client';

import { requestApi } from './api';

const SW_URL = '/admin-sw.js';
const SW_SCOPE = '/admin-portal';

export function isIos() {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

/** True when the portal runs as an installed Home Screen app. */
export function isInstalled() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

export function pushSupported() {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

/**
 * The state of push on this device:
 * unsupported, needs-install (iPhone browser tab), denied, off, or on.
 */
export async function pushState() {
  if (isIos() && !isInstalled()) return 'needs-install';
  if (!pushSupported()) return 'unsupported';
  if (Notification.permission === 'denied') return 'denied';
  const registration = await navigator.serviceWorker.getRegistration(SW_SCOPE);
  const subscription = await registration?.pushManager.getSubscription();
  return subscription && Notification.permission === 'granted' ? 'on' : 'off';
}

/** Register the service worker. It only shows notifications and does not cache. */
export async function registerServiceWorker() {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return null;
  try {
    return await navigator.serviceWorker.register(SW_URL, { scope: SW_SCOPE });
  } catch {
    return null;
  }
}

function keyToBytes(base64) {
  const padded = `${base64}${'='.repeat((4 - (base64.length % 4)) % 4)}`.replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(padded);
  return Uint8Array.from(raw, (char) => char.charCodeAt(0));
}

export async function currentEndpoint() {
  if (!pushSupported()) return null;
  const registration = await navigator.serviceWorker.getRegistration(SW_SCOPE);
  const subscription = await registration?.pushManager.getSubscription();
  return subscription?.endpoint || null;
}

/** Ask for permission and save this device. Call it from a tap: iPhone requires a user action. */
export async function enablePush(preferences) {
  const config = await requestApi('/admin/push/config');
  if (!config?.enabled || !config.publicKey) {
    const error = new Error('Push notifications are not set up on the server yet.');
    error.code = 'PUSH_NOT_CONFIGURED';
    throw error;
  }
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    const error = new Error(permission === 'denied' ? 'Notifications are blocked for this app. Allow them in the device settings.' : 'Notifications were not allowed.');
    error.code = 'PUSH_PERMISSION';
    throw error;
  }
  const registration = (await registerServiceWorker()) || (await navigator.serviceWorker.ready);
  await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    try {
      subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyToBytes(config.publicKey) });
    } catch {
      const error = new Error('This browser could not set up notifications. Try again, or use the Home Screen app from Safari on iPhone or Chrome on Android.');
      error.code = 'PUSH_SUBSCRIBE_FAILED';
      throw error;
    }
  }
  const json = subscription.toJSON();
  return requestApi('/admin/push/subscription', {
    method: 'POST',
    body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys, preferences }),
  });
}

export async function disablePush() {
  const registration = await navigator.serviceWorker.getRegistration(SW_SCOPE);
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) return;
  try {
    await requestApi('/admin/push/subscription/remove', { method: 'POST', body: JSON.stringify({ endpoint: subscription.endpoint }) });
  } finally {
    await subscription.unsubscribe().catch(() => undefined);
  }
}

/** Show a count on the Home Screen icon where the device supports it. */
export function setAppBadge(count) {
  try {
    if (typeof navigator === 'undefined') return;
    if (count > 0 && navigator.setAppBadge) void navigator.setAppBadge(count).catch(() => undefined);
    else if (navigator.clearAppBadge) void navigator.clearAppBadge().catch(() => undefined);
  } catch { /* badges are optional */ }
}
