# Flux Go public website

This repository contains the Flux Go public landing page built with Next.js.

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

Open `/admin-portal` to use the operations portal.

The portal calls the backend admin routes with `credentials: include`. The
backend owns the session in an HttpOnly cookie. The browser does not store an
admin bearer token or password. Set `NEXT_PUBLIC_FLUXGO_API_URL` to the
approved API origin, such as `http://127.0.0.1:3000` for local development or
the deployed API origin for the hosted website.

The reset form accepts the one-time code from the admin email. It also accepts
`resetToken` in the URL query for a future email-link template.
