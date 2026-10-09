/* Fluxgo admin portal service worker. Scope: /admin-portal.
   It shows admin push notifications and opens the right page on tap.
   It does not cache pages or API data. */

self.addEventListener('install', () => { self.skipWaiting(); });
self.addEventListener('activate', (event) => { event.waitUntil(self.clients.claim()); });

self.addEventListener('push', (event) => {
  let message = {};
  try { message = event.data ? event.data.json() : {}; } catch { message = { title: 'Fluxgo Admin', body: event.data ? event.data.text() : '' }; }
  const title = message.title || 'Fluxgo Admin';
  const options = {
    body: message.body || '',
    tag: message.tag || undefined,
    renotify: Boolean(message.tag),
    icon: '/admin/icon-192.png',
    data: { url: typeof message.url === 'string' && message.url.startsWith('/admin-portal') ? message.url : '/admin-portal' },
  };
  // Every push must show a notification. Browsers can revoke permission otherwise.
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || '/admin-portal', self.location.origin).href;
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const portal = windows.find((client) => new URL(client.url).pathname.startsWith('/admin-portal'));
    if (portal) {
      await portal.focus();
      if ('navigate' in portal) await portal.navigate(target);
      return;
    }
    await self.clients.openWindow(target);
  })());
});
