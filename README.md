# Fluxgo public website

This repository contains the Fluxgo public website and the admin portal, built with Next.js.

## Structure

- `app/(site)/` holds the public pages: home, `/support`, and `/privacy-terms`. They share `app/(site)/site.css` and the parts in `app/(site)/_components/`. All public styles sit under the `.fx` root class.
- `app/admin-portal/` holds the operations console. Its styles are in `app/admin-portal/admin.css` and load only on that route.
- The public pages use SVG and CSS for all visuals. Colors mirror `fluxgo-frontend/src/constants/tokens.json`.

## Local development

Install the dependencies, then start the development server.

```bash
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

## Vercel

Import `saaro-org/saaro-website` into Vercel.

- Framework preset: Next.js
- Root directory: `./`
- Build command: automatic
- Output directory: automatic
- Install command: automatic

Vercel detects Next.js from `package.json`. Add `fluxgo.in` as the custom domain after the first deployment.

## Admin portal

Open `/admin-portal` to use the operations console.

The portal calls the backend admin routes with `credentials: include`. The
backend owns the session in an HttpOnly cookie. The browser does not store an
admin bearer token or password. Set `NEXT_PUBLIC_FLUXGO_API_URL` to the
approved API origin, such as `http://127.0.0.1:3000` for local development or
the deployed API origin for the hosted website.

The console provides overview counts, member search and details, trip and
booking inspection, support ticket replies and status changes, admin user
management, and audit-log search. It uses real `/v1/admin` routes and does not
use placeholder queue data.

The reset form accepts the one-time code from the admin email. It also accepts
`resetToken` in the URL query for a future email-link template.

## Shared ride links

`/ride/:publicId` shows a public ride that a member shared from the app. It reads `GET /v1/public/trips/:publicId` and refreshes the data every 60 s. It has a per-ride preview image and `noindex`.

- `FLUXGO_API_URL`: API base for server fetches. Default `https://api.fluxgo.in`.
- `NEXT_PUBLIC_FLUXGO_OPEN_HOST_URL`: host for the "Open in app" button. Default `https://go.fluxgo.in`. It must be a different domain from the page, or iOS does not open the app.
- `NEXT_PUBLIC_FLUXGO_IOS_APP_LINKS_LIVE`: set `true` when the App Store build with shared-link support is live. Until then, iPhone and desktop visitors see **Continue on the web** and an "app is coming soon" note, with no App Store button or Safari app banner on ride pages.
- `NEXT_PUBLIC_FLUXGO_ANDROID_STORE_PUBLIC`: set `true` when the Play listing is public. Until then, Android visitors see **Continue on the web** and the same note.

`/.well-known/apple-app-site-association` and `/.well-known/assetlinks.json` let the app open `/ride/*` and `/open/ride/*`. Serve them on `www.fluxgo.in` and `go.fluxgo.in` with no redirect. `/open/ride/:publicId` sends a visitor without the app to the App Store, Google Play, or the web app.
